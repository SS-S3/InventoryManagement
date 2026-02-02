// ===========================================
// Load environment variables FIRST - before any other imports
// ===========================================
require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const cron = require('node-cron');
const axios = require('axios');
const RSSParser = require('rss-parser');
const { URL } = require('url');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const app = express();

// ===========================================
// Environment Configuration
// ===========================================
// JWT Secret - MUST be set in production via environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    throw new Error('Missing Turso configuration. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in the environment.');
}

let tursoClientPromise = null;

const getTursoClient = () => {
    if (!tursoClientPromise) {
        tursoClientPromise = (async () => {
            const { connect } = await import('@tursodatabase/serverless');
            return connect({
                url: TURSO_DATABASE_URL,
                authToken: TURSO_AUTH_TOKEN
            });
        })();
    }
    return tursoClientPromise;
};

const ARTICLE_SOURCES = (process.env.ROBOTICS_ARTICLE_SOURCES || '')
    .split(',')
    .map((src) => src.trim())
    .filter(Boolean);
const ARTICLES_PER_SOURCE = Number(process.env.ROBOTICS_ARTICLE_LIMIT || 5);

const rssParser = new RSSParser();

// Configure Helmet with a CSP and COOP/COEP settings suitable for
// Google OAuth popups/iframes while keeping security headers in place.
const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'https://accounts.google.com', 'https://apis.google.com', "'unsafe-inline'"],
    connectSrc: ["'self'", 'https://accounts.google.com', 'https://oauth2.googleapis.com', 'https://www.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https://lh3.googleusercontent.com'],
    styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
    fontSrc: ["'self'", 'https:', 'data:'],
    frameAncestors: ["'self'", 'https://accounts.google.com']
};

app.use(helmet({
    contentSecurityPolicy: IS_PRODUCTION ? { directives: cspDirectives } : false,
    // Allow popups and cross-origin postMessage flows used by Google Sign-In
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: IS_PRODUCTION ? { policy: 'same-origin-allow-popups' } : false,
    hsts: IS_PRODUCTION ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
}));

const corsOptions = {
    origin: IS_PRODUCTION ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://sr-management.vercel.app'] : true,
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
    windowMs: IS_PRODUCTION ? 15 * 60 * 1000 : 60 * 1000,
    max: IS_PRODUCTION ? 100 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    skip: (req) => req.path === '/health'
});
app.use(limiter);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'SR Management API is running',
        version: '1.0.0',
        documentation: '/docs'
    });
});

const prepareStatement = async (sql) => {
    const client = await getTursoClient();
    return client.prepare(sql);
};

const toNumber = (value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string' && /^-?\d+$/.test(value)) return Number(value);
    return value;
};

const normalizeRow = (row) => {
    if (!row) return row;
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
        normalized[key] = typeof value === 'bigint' ? Number(value) : value;
    }
    return normalized;
};

const dbRun = async (sql, args = []) => {
    try {
        const client = await getTursoClient();
        if (client.execute) {
            const result = await client.execute({ sql, args });
            return {
                lastID: toNumber(result.lastInsertRowid),
                changes: toNumber(result.changes) || 0
            };
        }
        const stmt = await client.prepare(sql);
        const result = await stmt.run(args);
        return {
            lastID: toNumber(result.lastInsertRowid),
            changes: toNumber(result.changes) || 0
        };
    } catch (error) {
        console.error('Database Error (Run):', error);
        throw error;
    }
};

const dbGet = async (sql, args = []) => {
    try {
        const client = await getTursoClient();
        // Check if execute exists (it might not)
        if (client.execute) {
            const result = await client.execute({ sql, args });
            return result.rows[0];
        }
        // Fallback to prepare pattern
        const stmt = await client.prepare(sql);
        const result = await stmt.get(args);
        return result;
    } catch (error) {
        console.error('Database Error (Get):', error);
        return null;
    }
};

const dbAll = async (sql, args = []) => {
    try {
        const client = await getTursoClient();
        if (client.execute) {
            const result = await client.execute({ sql, args });
            return result.rows;
        }
        const stmt = await client.prepare(sql);
        return await stmt.all(args);
    } catch (error) {
        console.error('Database Error (All):', error);
        return [];
    }
};

const withTransaction = async (callback) => {
    const client = await getTursoClient();
    await client.exec('BEGIN');
    try {
        const result = await callback();
        await client.exec('COMMIT');
        return result;
    } catch (err) {
        await client.exec('ROLLBACK');
        throw err;
    }
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const sanitizeUser = (user) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    full_name: user.full_name,
    roll_number: user.roll_number,
    gender: user.gender,
    phone: user.phone,
    email: user.email,
    department: user.department,
    branch: user.branch,
    is_verified: user.is_verified,
    created_at: user.created_at
});

const logHistory = async (userId, username, action, details) => {
    try {
        await dbRun(
            'INSERT INTO history (user_id, username, action, details) VALUES (?, ?, ?, ?)',
            [userId || null, username || null, action, details || null]
        );
    } catch (err) {
        console.error('Error logging history:', err.message);
    }
};

const authenticateToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        res.status(401).json({ error: 'Access denied' });
        return;
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        res.status(403).json({ error: 'Invalid token' });
        return;
    }

    const user = await dbGet(
        'SELECT id, username, role, full_name, roll_number, phone, email, gender, department, branch, is_verified, created_at FROM users WHERE id = ?',
        [decoded.id]
    );

    if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }

    req.user = sanitizeUser(user);
    next();
});

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: admins only' });
    }
    next();
};

const extractHost = (value) => {
    if (!value) return null;
    try {
        return new URL(value).hostname;
    } catch (err) {
        return value;
    }
};

const normalizeArticleList = (entries, fallbackSource) => {
    if (!Array.isArray(entries)) return [];
    return entries
        .map((entry) => {
            const title = entry?.title || entry?.headline || entry?.name;
            const link = entry?.link || entry?.url;
            if (!title || !link) return null;
            const published = entry?.isoDate || entry?.pubDate || entry?.published || entry?.published_at;
            return {
                title: title.trim(),
                url: link,
                source: entry?.source || extractHost(link) || fallbackSource,
                published_at: published ? new Date(published).toISOString() : null
            };
        })
        .filter(Boolean)
        .slice(0, ARTICLES_PER_SOURCE);
};

const fetchArticlesFromSource = async (sourceUrl) => {
    const host = extractHost(sourceUrl);

    try {
        if (sourceUrl.includes('medium.com/feed') || sourceUrl.endsWith('.rss') || sourceUrl.endsWith('.xml')) {
            const feed = await rssParser.parseURL(sourceUrl);
            return normalizeArticleList(feed.items || [], host);
        }

        const response = await axios.get(sourceUrl, { timeout: 10000 });
        const data = Array.isArray(response.data) ? response.data : response.data?.articles;
        return normalizeArticleList(data || [], host);
    } catch (err) {
        console.error(`Failed to fetch articles from ${sourceUrl}:`, err.message);
        return [];
    }
};

const fetchAndStoreArticles = async () => {
    if (!ARTICLE_SOURCES.length) {
        console.warn('No robotics article sources configured.');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const aggregated = [];

    for (const source of ARTICLE_SOURCES) {
        const articles = await fetchArticlesFromSource(source);
        aggregated.push(...articles);
    }

    const deduped = [];
    const seen = new Set();

    for (const article of aggregated) {
        if (!article.url) continue;
        const key = article.url.trim();
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(article);
    }

    if (!deduped.length) {
        console.warn('No new articles fetched; retaining existing data.');
        return;
    }

    await withTransaction(async () => {
        await dbRun('DELETE FROM articles WHERE fetched_for = ?', [today]);
        for (const article of deduped) {
            await dbRun(
                'INSERT INTO articles (title, url, source, published_at, fetched_for) VALUES (?, ?, ?, ?, ?)',
                [article.title, article.url, article.source, article.published_at || null, today]
            );
        }
    });

    console.log(`Stored ${deduped.length} robotics articles for ${today}.`);
};

fetchAndStoreArticles().catch((err) => console.error('Initial article fetch failed:', err.message));

cron.schedule('0 15 * * *', () => {
    fetchAndStoreArticles().catch((err) => console.error('Scheduled article fetch failed:', err.message));
});

// --- Authentication Routes ---
app.post(
    '/register',
    [
        body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.').trim(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
        body('full_name').notEmpty().withMessage('Full name is required.').trim(),
        body('roll_number').optional().trim(),
        body('phone').optional().trim(),
        body('email').notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email address.').normalizeEmail(),
        body('department')
            .optional()
            .isIn(['mechanical', 'software', 'embedded'])
            .withMessage('Invalid department.'),
        validate
    ],
    asyncHandler(async (req, res) => {
        const { username, password, full_name, roll_number, phone, email, department } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const result = await dbRun(
                `INSERT INTO users (username, password, role, full_name, roll_number, phone, email, department, is_verified)
                 VALUES (?, ?, 'member', ?, ?, ?, ?, ?, 1)`,
                [
                    username,
                    hashedPassword,
                    full_name || null,
                    roll_number || null,
                    phone || null,
                    email || null,
                    department || null
                ]
            );

            await logHistory(result.lastID, username, 'REGISTER', 'New member registration');
            res.status(201).json({ id: result.lastID, message: 'Registration successful.' });
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Username, email, or roll number already exists.' });
                return;
            }
            throw err;
        }
    })
);

app.post(
    '/login',
    [
        body('email').optional().isString().trim(),
        body('username').optional().isString().trim(),
        body('password').notEmpty().withMessage('Password is required.'),
        body()
            .custom((_, { req }) => {
                const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
                const rawUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
                if (!rawEmail && !rawUsername) {
                    throw new Error('Email or username is required.');
                }
                req.body.email = rawEmail || undefined;
                req.body.username = rawUsername || undefined;
                return true;
            }),
        validate
    ],
    asyncHandler(async (req, res) => {
        const { email, username, password } = req.body;
        const identifierSource = typeof email === 'string' && email.length ? email : username;
        const identifier = (identifierSource || '').trim();
        if (!identifier) {
            res.status(400).json({ error: 'Email or username is required.' });
            return;
        }
        const normalizedIdentifier = identifier.toLowerCase();
        const identifierType = email ? 'email' : 'username';

        console.log(`[LOGIN_ATTEMPT] ${identifierType.toUpperCase()}: ${identifier}`);

        const user = await dbGet(
            'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?',
            [normalizedIdentifier, normalizedIdentifier]
        );

        if (!user) {
            console.warn(`[LOGIN_FAIL] User not found: ${identifier}`);
            res.status(400).json({ error: 'Invalid credentials.' });
            return;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            console.warn(`[LOGIN_FAIL] Invalid password for user: ${user.username} (ID: ${user.id})`);
            res.status(400).json({ error: 'Invalid credentials.' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: sanitizeUser(user) });
    })
);

// --- Google Sign-In Authentication (existing users only) ---
app.post(
    '/auth/google',
    [body('googleIdToken').notEmpty().withMessage('Google ID token is required'), validate],
    asyncHandler(async (req, res) => {
        const { googleIdToken } = req.body;

        if (!googleClient) {
            console.error('[AUTH_GOOGLE_ERROR] Google authentication is missing or misconfigured.');
            res.status(503).json({ error: 'Google authentication is not configured.' });
            return;
        }

        // Verify the Google ID token
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: googleIdToken,
                audience: GOOGLE_CLIENT_ID
            });
            payload = ticket.getPayload();
        } catch (err) {
            console.error('Google token verification failed:', err.message);
            res.status(400).json({ error: 'Invalid Google token.' });
            return;
        }

        const googleEmail = payload.email;
        if (!googleEmail || !payload.email_verified) {
            res.status(400).json({ error: 'Google account email not verified.' });
            return;
        }

        // Check if this email exists in our database (existing users only)
        const user = await dbGet('SELECT * FROM users WHERE email = ?', [googleEmail.toLowerCase()]);

        if (!user) {
            // User must register first - Google login is only for existing users
            res.status(400).json({ error: 'No account found with this email. Please register first.' });
            return;
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(`[AUTH_GOOGLE_SUCCESS] User logged in via Google: ${user.email} (ID: ${user.id})`);
        await logHistory(user.id, user.username, 'LOGIN_GOOGLE', 'User logged in via Google Sign-In');

        res.json({ token, user: sanitizeUser(user) });
    })
);


// --- Password Reset via Google OAuth ---

// Verify Google ID token and issue a password reset token if email matches
app.post(
    '/forgot-password',
    [body('googleIdToken').notEmpty().withMessage('Google ID token is required'), validate],
    asyncHandler(async (req, res) => {
        const { googleIdToken } = req.body;

        if (!googleClient) {
            console.error('[FORGOT_PASSWORD_ERROR] Google authentication is missing or misconfigured.');
            res.status(503).json({ error: 'Google authentication is not configured.' });
            return;
        }

        // Verify the Google ID token
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: googleIdToken,
                audience: GOOGLE_CLIENT_ID
            });
            payload = ticket.getPayload();
        } catch (err) {
            console.error('Google token verification failed:', err.message);
            res.status(400).json({ error: 'Invalid Google token.' });
            return;
        }

        const googleEmail = payload.email;
        if (!googleEmail || !payload.email_verified) {
            res.status(400).json({ error: 'Google account email not verified.' });
            return;
        }

        // Check if this email exists in our database
        const user = await dbGet('SELECT id, email, full_name FROM users WHERE email = ?', [googleEmail.toLowerCase()]);

        if (!user) {
            // Don't reveal whether email exists
            res.status(400).json({ error: 'No account found with this email address.' });
            return;
        }

        // Email matches - issue a reset token directly (Google verified identity)
        const resetToken = jwt.sign({ userId: user.id, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '10m' });

        console.log(`Password reset authorized via Google for ${user.email}`);

        res.json({
            valid: true,
            resetToken,
            message: 'Identity verified via Google. You can now reset your password.'
        });
    })
);

app.post(
    '/reset-password',
    [
        body('resetToken').notEmpty().withMessage('Reset token is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        validate
    ],
    asyncHandler(async (req, res) => {
        const { resetToken, newPassword } = req.body;

        // Verify the reset token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, JWT_SECRET);
            if (decoded.purpose !== 'password-reset') {
                throw new Error('Invalid token purpose');
            }
        } catch (err) {
            res.status(400).json({ error: 'Invalid or expired reset token.' });
            return;
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password
        await dbRun('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?', [hashedPassword, decoded.userId]);

        // Delete all reset tokens for this user (cleanup old SMS tokens if any)
        await dbRun('DELETE FROM password_reset_tokens WHERE user_id = ?', [decoded.userId]);

        // Log the action
        const user = await dbGet('SELECT username FROM users WHERE id = ?', [decoded.userId]);
        await dbRun(
            'INSERT INTO history (user_id, username, action, details) VALUES (?, ?, ?, ?)',
            [decoded.userId, user?.username, 'PASSWORD_RESET', 'Password was reset via Google verification']
        );

        res.json({ message: 'Password has been reset successfully.' });
    })
);

app.get(
    '/profile',
    authenticateToken,
    asyncHandler(async (req, res) => {
        res.json(req.user);
    })
);

// --- User Management ---
app.get(
    '/users',
    authenticateToken,
    isAdmin,
    asyncHandler(async (req, res) => {
        const users = await dbAll(
            'SELECT id, username, role, full_name, department, is_verified FROM users ORDER BY username ASC'
        );
        res.json(users);
    })
);

app.put(
    '/users/:id/role',
    [authenticateToken, isAdmin, param('id').isInt(), body('role').isIn(['admin', 'member']), validate],
    asyncHandler(async (req, res) => {
        const { role } = req.body;
        const userId = Number(req.params.id);

        const result = await dbRun('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        if (!result.changes) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }

        await logHistory(req.user.id, req.user.username, 'UPDATE_ROLE', `Changed role for user ${userId} to ${role}`);
        res.json({ message: 'Role updated.' });
    })
);

// Bulk register users from CSV/JSON
app.post(
    '/users/bulk-register',
    [authenticateToken, isAdmin, body('users').isArray({ min: 1 }), validate],
    asyncHandler(async (req, res) => {
        const { users } = req.body;
        const results = { success: [], failed: [] };

        for (const userData of users) {
            try {
                const { full_name, roll_number, gender, phone, email, department, branch, password } = userData;

                if (!email || !full_name) {
                    results.failed.push({ email: email || 'unknown', error: 'Email and full_name are required' });
                    continue;
                }

                // Generate password if not provided (use roll_number or random)
                const userPassword = password || roll_number || Math.random().toString(36).slice(-8);
                const hashedPassword = await bcrypt.hash(userPassword, 10);

                // Generate username from email
                const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

                await dbRun(
                    `INSERT INTO users (username, password, role, full_name, roll_number, gender, phone, email, department, branch, is_verified)
                     VALUES (?, ?, 'member', ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [username, hashedPassword, full_name, roll_number || null, gender || null, phone || null, email, department || null, branch || null]
                );

                results.success.push({ email, full_name, generated_password: password ? undefined : userPassword });
            } catch (err) {
                results.failed.push({ email: userData.email || 'unknown', error: err.message });
            }
        }

        await logHistory(req.user.id, req.user.username, 'BULK_REGISTER', `Registered ${results.success.length} users, ${results.failed.length} failed`);
        res.json(results);
    })
);

// Get all users with full details (admin)
app.get(
    '/users/all',
    authenticateToken,
    isAdmin,
    asyncHandler(async (req, res) => {
        const users = await dbAll(
            `SELECT id, username, role, full_name, roll_number, gender, phone, email, department, branch, is_verified, created_at 
             FROM users ORDER BY created_at DESC`
        );
        res.json(users);
    })
);

// --- Inventory Items ---
app.get(
    '/items',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const items = await dbAll('SELECT * FROM items ORDER BY name ASC');
        res.json(items);
    })
);

app.post(
    '/items',
    [
        authenticateToken,
        isAdmin,
        body('name').notEmpty().trim(),
        body('cabinet').notEmpty().trim(),
        body('quantity').isInt({ min: 0 }),
        body('description').optional().trim(),
        body('location_x').optional().isFloat(),
        body('location_y').optional().isFloat(),
        validate
    ],
    asyncHandler(async (req, res) => {
        const { name, description, cabinet, quantity, location_x, location_y } = req.body;
        const result = await dbRun(
            `INSERT INTO items (name, description, cabinet, quantity, location_x, location_y)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description || null, cabinet, quantity, location_x ?? null, location_y ?? null]
        );

        await logHistory(req.user.id, req.user.username, 'ITEM_CREATED', `Created item ${result.lastID}`);
        const item = await dbGet('SELECT * FROM items WHERE id = ?', [result.lastID]);
        res.status(201).json(item);
    })
);

app.put(
    '/items/:id',
    [
        authenticateToken,
        isAdmin,
        param('id').isInt(),
        body('name').notEmpty().trim(),
        body('cabinet').notEmpty().trim(),
        body('quantity').isInt({ min: 0 }),
        body('description').optional().trim(),
        body('location_x').optional().isFloat(),
        body('location_y').optional().isFloat(),
        validate
    ],
    asyncHandler(async (req, res) => {
        const itemId = Number(req.params.id);
        const { name, description, cabinet, quantity, location_x, location_y } = req.body;
        const result = await dbRun(
            `UPDATE items
             SET name = ?, description = ?, cabinet = ?, quantity = ?, location_x = ?, location_y = ?
             WHERE id = ?`,
            [name, description || null, cabinet, quantity, location_x ?? null, location_y ?? null, itemId]
        );

        if (!result.changes) {
            res.status(404).json({ error: 'Item not found.' });
            return;
        }

        await logHistory(req.user.id, req.user.username, 'ITEM_UPDATED', `Updated item ${itemId}`);
        const item = await dbGet('SELECT * FROM items WHERE id = ?', [itemId]);
        res.json(item);
    })
);

app.delete(
    '/items/:id',
    [authenticateToken, isAdmin, param('id').isInt(), validate],
    asyncHandler(async (req, res) => {
        const itemId = Number(req.params.id);
        const result = await dbRun('DELETE FROM items WHERE id = ?', [itemId]);
        if (!result.changes) {
            res.status(404).json({ error: 'Item not found.' });
            return;
        }
        await logHistory(req.user.id, req.user.username, 'ITEM_DELETED', `Deleted item ${itemId}`);
        res.json({ message: 'Item deleted.' });
    })
);

// --- Item Issuance & Transactions ---
app.post(
    '/issue',
    [authenticateToken, isAdmin, body('item_id').isInt(), body('quantity').isInt({ min: 1 }), validate],
    asyncHandler(async (req, res) => {
        const { item_id, quantity } = req.body;
        const item = await dbGet('SELECT id, quantity FROM items WHERE id = ?', [item_id]);
        if (!item) {
            res.status(404).json({ error: 'Item not found.' });
            return;
        }

        if (item.quantity < quantity) {
            res.status(400).json({ error: 'Insufficient stock.' });
            return;
        }

        await withTransaction(async () => {
            await dbRun('UPDATE items SET quantity = quantity - ? WHERE id = ?', [quantity, item_id]);
            await dbRun(
                `INSERT INTO transactions (item_id, user_id, type, quantity, date)
                 VALUES (?, ?, 'issue', ?, ?)`,
                [item_id, req.user.id, quantity, new Date().toISOString()]
            );
        });

        await logHistory(req.user.id, req.user.username, 'ITEM_ISSUED', `Issued item ${item_id} (qty ${quantity})`);
        res.json({ message: 'Item issued.' });
    })
);

app.get(
    '/transactions',
    [authenticateToken, isAdmin],
    asyncHandler(async (req, res) => {
        const transactions = await dbAll(
            `SELECT t.*, i.name AS item_name, u.username
             FROM transactions t
             JOIN items i ON t.item_id = i.id
             JOIN users u ON t.user_id = u.id
             ORDER BY t.date DESC`
        );
        res.json(transactions);
    })
);

// --- Requests Workflow ---
app.get(
    '/requests',
    [authenticateToken, query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled']), validate],
    asyncHandler(async (req, res) => {
        const filters = [];
        const params = [];

        if (req.query.status) {
            filters.push('r.status = ?');
            params.push(req.query.status);
        }

        if (req.user.role !== 'admin') {
            filters.push('r.user_id = ?');
            params.push(req.user.id);
        }

        const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
        const sql = `
            SELECT r.*, u.username, u.full_name AS requester_name
            FROM requests r
            JOIN users u ON r.user_id = u.id
            ${whereClause}
            ORDER BY r.requested_at DESC
        `;

        const requests = await dbAll(sql, params);
        res.json(requests);
    })
);

app.post(
    '/requests',
    [
        authenticateToken,
        body('title').notEmpty().trim(),
        body('tool_name').notEmpty().trim(),
        body('quantity').optional().isInt({ min: 1 }),
        body('reason').optional().trim(),
        body('expected_return_date').optional().isISO8601().withMessage('Invalid return date.'),
        validate
    ],
    asyncHandler(async (req, res) => {
        const { title, tool_name, quantity = 1, reason, expected_return_date } = req.body;

        const result = await dbRun(
            `INSERT INTO requests (user_id, title, tool_name, quantity, reason, expected_return_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, title, tool_name, quantity, reason || null, expected_return_date || null]
        );

        await logHistory(req.user.id, req.user.username, 'REQUEST_SUBMITTED', `Request ${result.lastID} for ${tool_name}`);

        const request = await dbGet('SELECT * FROM requests WHERE id = ?', [result.lastID]);
        res.status(201).json(request);
    })
);

app.put(
    '/requests/:id/approve',
    [authenticateToken, isAdmin, param('id').isInt(), validate],
    asyncHandler(async (req, res) => {
        const requestId = Number(req.params.id);
        const request = await dbGet('SELECT * FROM requests WHERE id = ?', [requestId]);

        if (!request) {
            res.status(404).json({ error: 'Request not found.' });
            return;
        }

        if (request.status !== 'pending') {
            res.status(400).json({ error: 'Only pending requests can be approved.' });
            return;
        }

        const resolvedAt = new Date().toISOString();

        await withTransaction(async () => {
            await dbRun(
                `UPDATE requests
                 SET status = 'approved', resolved_at = ?, resolved_by = ?, cancellation_reason = NULL
                 WHERE id = ?`,
                [resolvedAt, req.user.id, requestId]
            );

            await dbRun(
                `INSERT INTO borrowings (user_id, request_id, tool_name, quantity, expected_return_date, notes)
                 VALUES (?, ?, ?, ?, ?, ?)`
                ,
                [
                    request.user_id,
                    requestId,
                    request.tool_name,
                    request.quantity,
                    request.expected_return_date || null,
                    request.reason || null
                ]
            );
        });

        await logHistory(req.user.id, req.user.username, 'REQUEST_APPROVED', `Approved request ${requestId}`);
        res.json({ message: 'Request approved.' });
    })
);

app.put(
    '/requests/:id/reject',
    [
        authenticateToken,
        isAdmin,
        param('id').isInt(),
        body('reason').optional().trim(),
        validate
    ],
    asyncHandler(async (req, res) => {
        const requestId = Number(req.params.id);
        const { reason } = req.body;

        const request = await dbGet('SELECT * FROM requests WHERE id = ?', [requestId]);
        if (!request) {
            res.status(404).json({ error: 'Request not found.' });
            return;
        }

        if (request.status !== 'pending') {
            res.status(400).json({ error: 'Only pending requests can be rejected.' });
            return;
        }

        await dbRun(
            `UPDATE requests
             SET status = 'rejected', resolved_at = ?, resolved_by = ?, cancellation_reason = ?
             WHERE id = ?`,
            [new Date().toISOString(), req.user.id, reason || null, requestId]
        );

        await logHistory(req.user.id, req.user.username, 'REQUEST_REJECTED', `Rejected request ${requestId}`);
        res.json({ message: 'Request rejected.' });
    })
);

app.put(
    '/requests/:id/cancel',
    [
        authenticateToken,
        param('id').isInt(),
        body('reason').optional().trim(),
        validate
    ],
    asyncHandler(async (req, res) => {
        const requestId = Number(req.params.id);
        const { reason } = req.body;

        const request = await dbGet('SELECT * FROM requests WHERE id = ?', [requestId]);
        if (!request) {
            res.status(404).json({ error: 'Request not found.' });
            return;
        }

        if (request.user_id !== req.user.id && req.user.role !== 'admin') {
            res.status(403).json({ error: 'You can only cancel your own requests.' });
            return;
        }

        if (request.status !== 'pending') {
            res.status(400).json({ error: 'Only pending requests can be cancelled.' });
            return;
        }

        await dbRun(
            `UPDATE requests
             SET status = 'cancelled', resolved_at = ?, resolved_by = ?, cancellation_reason = ?
             WHERE id = ?`,
            [new Date().toISOString(), req.user.id, reason || null, requestId]
        );

        await logHistory(req.user.id, req.user.username, 'REQUEST_CANCELLED', `Cancelled request ${requestId}`);
        res.json({ message: 'Request cancelled.' });
    })
);

// --- Borrowings Workflow ---
app.get(
    '/borrowings',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const filters = [];
        const params = [];

        if (req.user.role !== 'admin') {
            filters.push('b.user_id = ?');
            params.push(req.user.id);
        }

        const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
        const sql = `
            SELECT b.*, u.username, u.full_name AS borrower_name
            FROM borrowings b
            JOIN users u ON b.user_id = u.id
            ${whereClause}
            ORDER BY b.borrowed_at DESC
        `;

        const borrowings = await dbAll(sql, params);
        res.json(borrowings);
    })
);

app.post(
    '/borrowings',
    [
        authenticateToken,
        isAdmin,
        body('user_id').isInt(),
        body('tool_name').notEmpty().trim(),
        body('quantity').optional().isInt({ min: 1 }),
        body('expected_return_date').optional().isISO8601(),
        body('notes').optional().trim(),
        validate
    ],
    asyncHandler(async (req, res) => {
        const { user_id, tool_name, quantity = 1, expected_return_date, notes } = req.body;

        const result = await dbRun(
            `INSERT INTO borrowings (user_id, tool_name, quantity, expected_return_date, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, tool_name, quantity, expected_return_date || null, notes || null]
        );

        await logHistory(req.user.id, req.user.username, 'BORROWING_CREATED', `Created borrowing ${result.lastID}`);
        const borrowing = await dbGet('SELECT * FROM borrowings WHERE id = ?', [result.lastID]);
        res.status(201).json(borrowing);
    })
);

app.put(
    '/borrowings/:id/return',
    [authenticateToken, param('id').isInt(), body('notes').optional().trim(), validate],
    asyncHandler(async (req, res) => {
        const borrowingId = Number(req.params.id);
        const borrowing = await dbGet('SELECT * FROM borrowings WHERE id = ?', [borrowingId]);

        if (!borrowing) {
            res.status(404).json({ error: 'Borrowing not found.' });
            return;
        }

        if (req.user.role !== 'admin' && borrowing.user_id !== req.user.id) {
            res.status(403).json({ error: 'You can only close your own borrowings.' });
            return;
        }

        if (borrowing.returned_at) {
            res.status(400).json({ error: 'Borrowing already closed.' });
            return;
        }

        await dbRun(
            'UPDATE borrowings SET returned_at = ?, notes = COALESCE(?, notes) WHERE id = ?',
            [new Date().toISOString(), req.body.notes || null, borrowingId]
        );

        await logHistory(req.user.id, req.user.username, 'BORROWING_RETURNED', `Marked borrowing ${borrowingId} as returned`);
        res.json({ message: 'Borrowing closed.' });
    })
);

// --- Activity History ---
app.get(
    '/history',
    [
        authenticateToken,
        query('action').optional().isString(),
        query('user_id').optional().isInt(),
        query('limit').optional().isInt({ min: 1, max: 1000 }),
        query('offset').optional().isInt({ min: 0 }),
        validate
    ],
    asyncHandler(async (req, res) => {
        const filters = [];
        const params = [];

        // Filter by action type
        if (req.query.action) {
            filters.push('h.action = ?');
            params.push(req.query.action);
        }

        // Filter by user (admin can see all, members only their own)
        if (req.user.role !== 'admin') {
            filters.push('h.user_id = ?');
            params.push(req.user.id);
        } else if (req.query.user_id) {
            filters.push('h.user_id = ?');
            params.push(Number(req.query.user_id));
        }

        const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
        const limit = Number(req.query.limit) || 100;
        const offset = Number(req.query.offset) || 0;

        const sql = `
            SELECT h.*, u.full_name, u.roll_number, u.email, u.department
            FROM history h
            LEFT JOIN users u ON h.user_id = u.id
            ${whereClause}
            ORDER BY h.timestamp DESC
            LIMIT ? OFFSET ?
        `;

        params.push(limit, offset);

        const history = await dbAll(sql, params);
        
        // Get total count for pagination
        const countSql = `
            SELECT COUNT(*) as total
            FROM history h
            ${whereClause}
        `;
        const countParams = params.slice(0, -2); // Remove limit and offset
        const countResult = await dbGet(countSql, countParams);
        
        res.json({
            records: history,
            total: countResult?.total || 0,
            limit,
            offset
        });
    })
);

// --- Assignments & Submissions ---
app.post(
    '/assignments',
    [
        authenticateToken,
        isAdmin,
        body('title').notEmpty().trim(),
        body('department').isIn(['mechanical', 'software', 'embedded']),
        body('description').optional().trim(),
        body('due_date').optional().isISO8601(),
        body('resource_url').optional().isURL(),
        validate
    ],
    asyncHandler(async (req, res) => {
        const { title, description, department, due_date, resource_url } = req.body;

        const result = await dbRun(
            `INSERT INTO assignments (title, description, department, due_date, resource_url, created_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description || null, department, due_date || null, resource_url || null, req.user.id]
        );

        await logHistory(req.user.id, req.user.username, 'ASSIGNMENT_CREATED', `Created assignment ${result.lastID}`);
        res.status(201).json({ id: result.lastID, message: 'Assignment created.' });
    })
);

app.get(
    '/assignments',
    authenticateToken,
    asyncHandler(async (req, res) => {
        let sql = 'SELECT * FROM assignments ORDER BY created_at DESC';
        let params = [];

        if (req.user.role !== 'admin') {
            sql = 'SELECT * FROM assignments WHERE department = ? ORDER BY created_at DESC';
            params = [req.user.department || ''];
        }

        const assignments = await dbAll(sql, params);
        res.json(assignments);
    })
);

app.get(
    '/assignments/:id',
    [authenticateToken, param('id').isInt(), validate],
    asyncHandler(async (req, res) => {
        const assignment = await dbGet('SELECT * FROM assignments WHERE id = ?', [Number(req.params.id)]);
        if (!assignment) {
            res.status(404).json({ error: 'Assignment not found.' });
            return;
        }
        res.json(assignment);
    })
);

app.get(
    '/assignments/:id/stats',
    [authenticateToken, param('id').isInt(), validate],
    asyncHandler(async (req, res) => {
        const assignmentId = Number(req.params.id);
        const assignment = await dbGet('SELECT department FROM assignments WHERE id = ?', [assignmentId]);

        if (!assignment) {
            res.status(404).json({ error: 'Assignment not found.' });
            return;
        }

        const assignedCountRow = await dbGet(
            'SELECT COUNT(*) AS count FROM users WHERE role = ? AND department = ? AND is_verified = 1',
            ['member', assignment.department]
        );
        const submissionCountRow = await dbGet(
            'SELECT COUNT(*) AS count FROM submissions WHERE assignment_id = ?',
            [assignmentId]
        );

        res.json({
            assignment_id: assignmentId,
            assigned_count: assignedCountRow?.count || 0,
            submission_count: submissionCountRow?.count || 0
        });
    })
);

app.get(
    '/assignments/:id/submissions',
    [authenticateToken, isAdmin, param('id').isInt(), validate],
    asyncHandler(async (req, res) => {
        const assignmentId = Number(req.params.id);
        const submissions = await dbAll(
            `SELECT s.*, u.username, u.full_name, u.roll_number, u.department
             FROM submissions s
             JOIN users u ON s.user_id = u.id
             WHERE s.assignment_id = ?
             ORDER BY s.submitted_at DESC`,
            [assignmentId]
        );
        res.json(submissions);
    })
);

app.post(
    '/submissions',
    [
        authenticateToken,
        body('assignment_id').isInt(),
        body('github_link').isURL(),
        validate
    ],
    asyncHandler(async (req, res) => {
        const { assignment_id, github_link } = req.body;

        try {
            const result = await dbRun(
                `INSERT INTO submissions (assignment_id, user_id, github_link)
                 VALUES (?, ?, ?)`
                ,
                [assignment_id, req.user.id, github_link]
            );

            await logHistory(req.user.id, req.user.username, 'ASSIGNMENT_SUBMITTED', `Submission ${result.lastID}`);
            res.status(201).json({ id: result.lastID, message: 'Submission recorded.' });
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'You already submitted this assignment.' });
                return;
            }
            throw err;
        }
    })
);

app.get(
    '/submissions/user',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const submissions = await dbAll(
            `SELECT s.*, a.title, a.department, a.due_date
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.id
             WHERE s.user_id = ?
             ORDER BY s.submitted_at DESC`,
            [req.user.id]
        );
        res.json(submissions);
    })
);

app.put(
    '/submissions/:id/grade',
    [authenticateToken, isAdmin, param('id').isInt(), body('status').isIn(['pass', 'fail']), body('feedback').optional().trim(), validate],
    asyncHandler(async (req, res) => {
        const submissionId = Number(req.params.id);
        const { status, feedback } = req.body;

        const result = await dbRun(
            `UPDATE submissions
             SET status = ?, feedback = ?, graded_at = ?, graded_by = ?
             WHERE id = ?`,
            [status, feedback || null, new Date().toISOString(), req.user.id, submissionId]
        );

        if (!result.changes) {
            res.status(404).json({ error: 'Submission not found.' });
            return;
        }

        await logHistory(req.user.id, req.user.username, 'SUBMISSION_GRADED', `Graded submission ${submissionId}`);
        res.json({ message: 'Submission graded.' });
    })
);

// --- Competitions & Reports ---
app.post(
    '/competitions',
    [
        authenticateToken,
        isAdmin,
        body('name').notEmpty().trim(),
        body('description').optional().trim(),
        body('start_date').optional().isISO8601(),
        body('end_date').optional().isISO8601(),
        body('location').optional().trim(),
        validate
    ],
    asyncHandler(async (req, res) => {
        const { name, description, start_date, end_date, location } = req.body;

        const result = await dbRun(
            `INSERT INTO competitions (name, description, start_date, end_date, location)
             VALUES (?, ?, ?, ?, ?)`,
            [name, description || null, start_date || null, end_date || null, location || null]
        );

        await logHistory(req.user.id, req.user.username, 'COMPETITION_CREATED', `Created competition ${result.lastID}`);
        res.status(201).json({ id: result.lastID, message: 'Competition created.' });
    })
);

app.get(
    '/competitions',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const competitions = await dbAll('SELECT * FROM competitions ORDER BY start_date DESC');
        res.json(competitions);
    })
);

app.get(
    '/competitions/:id/items',
    [authenticateToken, param('id').isInt(), validate],
    asyncHandler(async (req, res) => {
        const competitionId = Number(req.params.id);
        const items = await dbAll(
            `SELECT ci.*, i.name AS item_name
             FROM competition_items ci
             JOIN items i ON ci.item_id = i.id
             WHERE ci.competition_id = ?`,
            [competitionId]
        );
        res.json(items);
    })
);

app.post(
    '/competitions/:id/items',
    [authenticateToken, isAdmin, param('id').isInt(), body('item_id').isInt(), body('quantity').isInt({ min: 1 }), validate],
    asyncHandler(async (req, res) => {
        const competitionId = Number(req.params.id);
        const { item_id, quantity } = req.body;
        const result = await dbRun(
            'INSERT INTO competition_items (competition_id, item_id, quantity) VALUES (?, ?, ?)',
            [competitionId, item_id, quantity]
        );
        await logHistory(req.user.id, req.user.username, 'ADD_COMPETITION_RESOURCE', `Added ${quantity} items to competition ${competitionId}`);
        res.status(201).json({ id: result.lastID });
    })
);

app.get(
    '/reports/competitions/calendar',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const competitions = await dbAll(
            'SELECT id, name, start_date, end_date, location, description FROM competitions ORDER BY start_date ASC'
        );
        res.json(competitions);
    })
);

app.get(
    '/statistics/submissions-by-department',
    authenticateToken,
    isAdmin,
    asyncHandler(async (req, res) => {
        const rows = await dbAll(`
            SELECT
                u.department,
                COUNT(DISTINCT u.id) AS total_members,
                COUNT(DISTINCT s.user_id) AS submitted_members,
                ROUND(100.0 * COUNT(DISTINCT s.user_id) / NULLIF(COUNT(DISTINCT u.id), 0), 2) AS submission_percentage,
                COUNT(CASE WHEN s.status = 'pass' THEN 1 END) AS passed_count,
                COUNT(CASE WHEN s.status = 'fail' THEN 1 END) AS failed_count
            FROM users u
            LEFT JOIN submissions s ON u.id = s.user_id
            WHERE u.role = 'member' AND u.department IS NOT NULL
            GROUP BY u.department
        `);
        res.json(rows);
    })
);

// --- History ---
app.get(
    '/history',
    authenticateToken,
    isAdmin,
    asyncHandler(async (req, res) => {
        const history = await dbAll('SELECT * FROM history ORDER BY timestamp DESC LIMIT 100');
        res.json(history);
    })
);

// --- Dashboard Summary ---
app.get(
    '/dashboard/summary',
    authenticateToken,
    asyncHandler(async (req, res) => {
        if (req.user.role === 'admin') {
            const [pendingRequests, activeBorrowings, assignmentsOpen, submissionsPending, recentRequests, recentHistory] = await Promise.all([
                dbGet("SELECT COUNT(*) AS count FROM requests WHERE status = 'pending'"),
                dbGet('SELECT COUNT(*) AS count FROM borrowings WHERE returned_at IS NULL'),
                dbGet('SELECT COUNT(*) AS count FROM assignments'),
                dbGet("SELECT COUNT(*) AS count FROM submissions WHERE status = 'pending'"),
                dbAll(
                    `SELECT r.*, u.username
                     FROM requests r
                     JOIN users u ON r.user_id = u.id
                     ORDER BY r.requested_at DESC
                     LIMIT 5`
                ),
                dbAll('SELECT * FROM history ORDER BY timestamp DESC LIMIT 10')
            ]);

            res.json({
                role: 'admin',
                metrics: {
                    pendingRequests: pendingRequests?.count || 0,
                    activeBorrowings: activeBorrowings?.count || 0,
                    totalAssignments: assignmentsOpen?.count || 0,
                    pendingSubmissions: submissionsPending?.count || 0
                },
                recent: {
                    requests: recentRequests,
                    history: recentHistory
                }
            });
            return;
        }

        const [myPendingRequests, myActiveBorrowings, assignmentsForDept, recentMyRequests, recentBorrowings] = await Promise.all([
            dbGet("SELECT COUNT(*) AS count FROM requests WHERE user_id = ? AND status = 'pending'", [req.user.id]),
            dbGet('SELECT COUNT(*) AS count FROM borrowings WHERE user_id = ? AND returned_at IS NULL', [req.user.id]),
            dbAll(
                `SELECT * FROM assignments WHERE department = ? ORDER BY due_date ASC LIMIT 5`,
                [req.user.department || '']
            ),
            dbAll(
                `SELECT * FROM requests WHERE user_id = ? ORDER BY requested_at DESC LIMIT 5`,
                [req.user.id]
            ),
            dbAll(
                `SELECT * FROM borrowings WHERE user_id = ? ORDER BY borrowed_at DESC LIMIT 5`,
                [req.user.id]
            )
        ]);

        res.json({
            role: 'member',
            metrics: {
                pendingRequests: myPendingRequests?.count || 0,
                activeBorrowings: myActiveBorrowings?.count || 0,
                assignmentsAvailable: assignmentsForDept.length
            },
            recent: {
                requests: recentMyRequests,
                borrowings: recentBorrowings,
                assignments: assignmentsForDept
            }
        });
    })
);

// --- Robotics Articles ---
app.get(
    '/articles',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const today = new Date().toISOString().split('T')[0];

        let targetDate = today;
        let rows = await dbAll(
            'SELECT id, title, url, source, published_at, fetched_for FROM articles WHERE fetched_for = ? ORDER BY published_at DESC, id DESC',
            [targetDate]
        );

        if (!rows.length) {
            const fallback = await dbGet('SELECT fetched_for FROM articles ORDER BY fetched_for DESC LIMIT 1');
            if (fallback) {
                targetDate = fallback.fetched_for;
                rows = await dbAll(
                    'SELECT id, title, url, source, published_at, fetched_for FROM articles WHERE fetched_for = ? ORDER BY published_at DESC, id DESC',
                    [targetDate]
                );
            }
        }

        res.json({ fetched_for: rows.length ? targetDate : today, articles: rows });
    })
);

app.post(
    '/articles/refresh',
    authenticateToken,
    isAdmin,
    asyncHandler(async (req, res) => {
        await fetchAndStoreArticles();
        res.json({ message: 'Article refresh triggered.' });
    })
);

// 6. Projects & Allocations
app.get(
    '/allocations',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const allocations = await dbAll(
            `SELECT a.*, i.name AS item_name, p.name AS project_name
             FROM allocations a
             JOIN items i ON a.item_id = i.id
             JOIN projects p ON a.project_id = p.id
             ORDER BY a.id DESC`
        );
        res.json(allocations);
    })
);

app.post(
    '/allocations',
    authenticateToken,
    isAdmin,
    asyncHandler(async (req, res) => {
        const { item_id, project_id, allocated_quantity } = req.body;

        const allocationId = await withTransaction(async () => {
            const item = await dbGet('SELECT quantity FROM items WHERE id = ?', [item_id]);
            if (!item || item.quantity < allocated_quantity) {
                const error = new Error('Insufficient stock for allocation');
                error.status = 400;
                throw error;
            }

            await dbRun('UPDATE items SET quantity = quantity - ? WHERE id = ?', [allocated_quantity, item_id]);
            const allocation = await dbRun(
                'INSERT INTO allocations (item_id, project_id, allocated_quantity) VALUES (?, ?, ?)',
                [item_id, project_id, allocated_quantity]
            );

            await logHistory(
                req.user.id,
                req.user.username,
                'ALLOCATE_RESOURCE',
                `Allocated quantity ${allocated_quantity} of Item ${item_id} to Project ${project_id}`
            );

            return allocation.lastID;
        });

        res.json({ id: allocationId });
    })
);

app.delete(
    '/allocations/:id',
    authenticateToken,
    isAdmin,
    asyncHandler(async (req, res) => {
        const allocationId = Number(req.params.id);

        await withTransaction(async () => {
            const allocation = await dbGet('SELECT item_id, allocated_quantity FROM allocations WHERE id = ?', [allocationId]);
            if (!allocation) {
                const error = new Error('Allocation not found');
                error.status = 404;
                throw error;
            }

            await dbRun('UPDATE items SET quantity = quantity + ? WHERE id = ?', [allocation.allocated_quantity, allocation.item_id]);
            await dbRun('DELETE FROM allocations WHERE id = ?', [allocationId]);

            await logHistory(
                req.user.id,
                req.user.username,
                'ALLOCATE_RESOURCE_REVOKE',
                `Revoked allocation ${allocationId} and restored stock for Item ${allocation.item_id}`
            );
        });

        res.json({ message: 'Allocation removed and stock restored.' });
    })
);

// --- Projects ---
app.get(
    '/projects',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const projects = await dbAll(`
            SELECT p.*, u.full_name as lead_name, u.email as lead_email,
                   (SELECT COUNT(*) FROM project_volunteers WHERE project_id = p.id AND status = 'accepted') as volunteer_count
            FROM projects p
            LEFT JOIN users u ON p.lead_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.json(projects);
    })
);

app.post(
    '/projects',
    [
        authenticateToken,
        isAdmin,
        body('name').notEmpty().trim(),
        body('description').optional().trim(),
        body('lead_id').optional().isInt(),
        body('start_date').optional(),
        body('end_date').optional(),
        validate
    ],
    asyncHandler(async (req, res) => {
        const { name, description, lead_id, start_date, end_date } = req.body;

        const result = await dbRun(
            `INSERT INTO projects (name, description, lead_id, start_date, end_date, status)
             VALUES (?, ?, ?, ?, ?, 'planning')`,
            [name, description || null, lead_id || null, start_date || null, end_date || null]
        );

        await logHistory(req.user.id, req.user.username, 'CREATE_PROJECT', `Created project: ${name}`);
        const project = await dbGet('SELECT * FROM projects WHERE id = ?', [result.lastID]);
        res.status(201).json(project);
    })
);

app.put(
    '/projects/:id',
    [
        authenticateToken,
        isAdmin,
        param('id').isInt(),
        body('name').optional().trim(),
        body('description').optional().trim(),
        body('status').optional().isIn(['planning', 'active', 'completed', 'on_hold']),
        body('lead_id').optional().isInt(),
        validate
    ],
    asyncHandler(async (req, res) => {
        const projectId = Number(req.params.id);
        const { name, description, status, lead_id, start_date, end_date } = req.body;

        const updates = [];
        const params = [];

        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }
        if (lead_id !== undefined) { updates.push('lead_id = ?'); params.push(lead_id); }
        if (start_date !== undefined) { updates.push('start_date = ?'); params.push(start_date); }
        if (end_date !== undefined) { updates.push('end_date = ?'); params.push(end_date); }

        if (updates.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }

        updates.push('updated_at = ?');
        params.push(new Date().toISOString());
        params.push(projectId);

        await dbRun(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, params);

        const project = await dbGet('SELECT * FROM projects WHERE id = ?', [projectId]);
        res.json(project);
    })
);

// Project volunteers
app.get(
    '/projects/:id/volunteers',
    [authenticateToken, param('id').isInt(), validate],
    asyncHandler(async (req, res) => {
        const projectId = Number(req.params.id);
        const volunteers = await dbAll(`
            SELECT pv.*, u.full_name, u.email, u.department, u.roll_number
            FROM project_volunteers pv
            JOIN users u ON pv.user_id = u.id
            WHERE pv.project_id = ?
            ORDER BY pv.applied_at DESC
        `, [projectId]);
        res.json(volunteers);
    })
);

app.post(
    '/projects/:id/volunteer',
    [authenticateToken, param('id').isInt(), validate],
    asyncHandler(async (req, res) => {
        const projectId = Number(req.params.id);
        const userId = req.user.id;

        const existing = await dbGet(
            'SELECT * FROM project_volunteers WHERE project_id = ? AND user_id = ?',
            [projectId, userId]
        );

        if (existing) {
            res.status(400).json({ error: 'You have already applied for this project' });
            return;
        }

        await dbRun(
            'INSERT INTO project_volunteers (project_id, user_id) VALUES (?, ?)',
            [projectId, userId]
        );

        await logHistory(userId, req.user.username, 'VOLUNTEER_PROJECT', `Applied to volunteer for project ${projectId}`);
        res.status(201).json({ message: 'Application submitted' });
    })
);

app.put(
    '/projects/:id/volunteers/:volunteerId',
    [
        authenticateToken,
        isAdmin,
        param('id').isInt(),
        param('volunteerId').isInt(),
        body('status').isIn(['accepted', 'rejected']),
        validate
    ],
    asyncHandler(async (req, res) => {
        const volunteerId = Number(req.params.volunteerId);
        const { status } = req.body;

        await dbRun(
            `UPDATE project_volunteers SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?`,
            [status, new Date().toISOString(), req.user.id, volunteerId]
        );

        await logHistory(req.user.id, req.user.username, 'RESOLVE_VOLUNTEER', `${status} volunteer application ${volunteerId}`);
        res.json({ message: `Volunteer ${status}` });
    })
);

// --- Competition Volunteers ---
app.get(
    '/competitions/:id/volunteers',
    [authenticateToken, param('id').isInt(), validate],
    asyncHandler(async (req, res) => {
        const competitionId = Number(req.params.id);
        const volunteers = await dbAll(`
            SELECT cv.*, u.full_name, u.email, u.department, u.roll_number
            FROM competition_volunteers cv
            JOIN users u ON cv.user_id = u.id
            WHERE cv.competition_id = ?
            ORDER BY cv.applied_at DESC
        `, [competitionId]);
        res.json(volunteers);
    })
);

app.post(
    '/competitions/:id/volunteer',
    [authenticateToken, param('id').isInt(), validate],
    asyncHandler(async (req, res) => {
        const competitionId = Number(req.params.id);
        const userId = req.user.id;

        const existing = await dbGet(
            'SELECT * FROM competition_volunteers WHERE competition_id = ? AND user_id = ?',
            [competitionId, userId]
        );

        if (existing) {
            res.status(400).json({ error: 'You have already applied for this competition' });
            return;
        }

        await dbRun(
            'INSERT INTO competition_volunteers (competition_id, user_id) VALUES (?, ?)',
            [competitionId, userId]
        );

        await logHistory(userId, req.user.username, 'VOLUNTEER_COMPETITION', `Applied to volunteer for competition ${competitionId}`);
        res.status(201).json({ message: 'Application submitted' });
    })
);

app.put(
    '/competitions/:id/volunteers/:volunteerId',
    [
        authenticateToken,
        isAdmin,
        param('id').isInt(),
        param('volunteerId').isInt(),
        body('status').isIn(['accepted', 'rejected']),
        validate
    ],
    asyncHandler(async (req, res) => {
        const volunteerId = Number(req.params.volunteerId);
        const { status } = req.body;

        await dbRun(
            `UPDATE competition_volunteers SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?`,
            [status, new Date().toISOString(), req.user.id, volunteerId]
        );

        await logHistory(req.user.id, req.user.username, 'RESOLVE_COMPETITION_VOLUNTEER', `${status} competition volunteer ${volunteerId}`);
        res.json({ message: `Volunteer ${status}` });
    })
);

// Get user's volunteer applications
app.get(
    '/my-applications',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const projectApps = await dbAll(`
            SELECT pv.*, p.name as project_name, p.description as project_description, 'project' as type
            FROM project_volunteers pv
            JOIN projects p ON pv.project_id = p.id
            WHERE pv.user_id = ?
        `, [userId]);

        const competitionApps = await dbAll(`
            SELECT cv.*, c.name as competition_name, c.description as competition_description, 'competition' as type
            FROM competition_volunteers cv
            JOIN competitions c ON cv.competition_id = c.id
            WHERE cv.user_id = ?
        `, [userId]);

        res.json({ projects: projectApps, competitions: competitionApps });
    })
);


// --- Error Handling ---
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    const errorId = Date.now().toString(36);
    console.error(`[${errorId}] Unhandled error:`, {
        message: err.message,
        stack: IS_PRODUCTION ? undefined : err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Don't leak error details in production
    res.status(err.status || 500).json({
        error: IS_PRODUCTION ? 'Internal server error' : err.message,
        errorId: errorId
    });
});

module.exports = app;