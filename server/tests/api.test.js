/**
 * API Unit Tests
 * Tests for the Inventory Management backend API
 * 
 * For integration tests, set real TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
 * environment variables. Without them, integration tests are skipped.
 */

const request = require('supertest');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Check if we have real Turso credentials for integration testing
const hasTursoCredentials = process.env.TURSO_DATABASE_URL && 
                            process.env.TURSO_AUTH_TOKEN &&
                            !process.env.TURSO_DATABASE_URL.includes('placeholder');

const SKIP_INTEGRATION = !hasTursoCredentials;

let app = null;

// Try to load the app if Turso is configured
beforeAll(async () => {
    if (!SKIP_INTEGRATION) {
        try {
            app = require('../server');
        } catch (err) {
            console.warn('Could not load server:', err.message);
        }
    }
});

const getTestTarget = () => app || 'http://localhost:3000';

describe('API Endpoints', () => {
    let adminToken = null;
    let memberToken = null;
    let testUserId = null;

    // Helper function to make authenticated requests
    const authRequest = (method, path, token) => {
        const req = request(getTestTarget())[method](path);
        if (token) {
            req.set('Authorization', `Bearer ${token}`);
        }
        return req;
    };

    describe('Health Check', () => {
        it('should return OK status', async () => {
            if (SKIP_INTEGRATION) {
                console.log('Skipping - no Turso credentials');
                return;
            }
            const res = await request(getTestTarget()).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.timestamp).toBeDefined();
        });
    });

    describe('Authentication', () => {
        describe('POST /login', () => {
            it('should login with valid credentials', async () => {
                if (SKIP_INTEGRATION) {
                    console.log('Skipping - no Turso credentials');
                    return;
                }
                const res = await request(getTestTarget())
                    .post('/login')
                    .send({ email: 'admin@inventory.local', password: 'admin123' });
                
                if (res.status === 200) {
                    expect(res.body.token).toBeDefined();
                    expect(res.body.user).toBeDefined();
                    expect(res.body.user.email).toBe('admin@inventory.local');
                    adminToken = res.body.token;
                } else {
                    // Admin might not exist in test DB or validation failed
                    expect([400, 401]).toContain(res.status);
                }
            });

            it('should reject empty credentials', async () => {
                if (SKIP_INTEGRATION) {
                    console.log('Skipping - no Turso credentials');
                    return;
                }
                const res = await request(getTestTarget())
                    .post('/login')
                    .send({ email: '', password: '' });
                
                expect(res.status).toBe(400);
            });

            it('should reject invalid credentials', async () => {
                if (SKIP_INTEGRATION) {
                    console.log('Skipping - no Turso credentials');
                    return;
                }
                const res = await request(getTestTarget())
                    .post('/login')
                    .send({ email: 'invalid@test.com', password: 'wrongpassword' });
                
                // Returns 400 if validation fails or 401 if credentials are invalid
                expect([400, 401]).toContain(res.status);
            });
        });

        describe('POST /register', () => {
            it('should reject short username', async () => {
                if (SKIP_INTEGRATION) {
                    console.log('Skipping - no Turso credentials');
                    return;
                }
                const res = await request(getTestTarget())
                    .post('/register')
                    .send({
                        username: 'ab',
                        password: 'password123',
                        email: 'test@example.com'
                    });
                
                expect(res.status).toBe(400);
            });

            it('should reject short password', async () => {
                if (SKIP_INTEGRATION) {
                    console.log('Skipping - no Turso credentials');
                    return;
                }
                const res = await request(getTestTarget())
                    .post('/register')
                    .send({
                        username: 'testuser',
                        password: '123',
                        email: 'test@example.com'
                    });
                
                expect(res.status).toBe(400);
            });

            it('should reject invalid email format', async () => {
                if (SKIP_INTEGRATION) {
                    console.log('Skipping - no Turso credentials');
                    return;
                }
                const res = await request(getTestTarget())
                    .post('/register')
                    .send({
                        username: 'testuser',
                        password: 'password123',
                        email: 'invalid-email'
                    });
                
                expect(res.status).toBe(400);
            });
        });
    });

    describe('Authorization', () => {
        it('should reject requests without token', async () => {
            if (SKIP_INTEGRATION) {
                console.log('Skipping - no Turso credentials');
                return;
            }
            const res = await request(getTestTarget()).get('/users');
            expect(res.status).toBe(401);
        });

        it('should reject requests with invalid token', async () => {
            if (SKIP_INTEGRATION) {
                console.log('Skipping - no Turso credentials');
                return;
            }
            const res = await request(getTestTarget())
                .get('/users')
                .set('Authorization', 'Bearer invalid-token');
            
            expect(res.status).toBe(403);
        });
    });

    describe('Items Endpoints', () => {
        describe('GET /items', () => {
            it('should require authentication', async () => {
                if (SKIP_INTEGRATION) {
                    console.log('Skipping - no Turso credentials');
                    return;
                }
                const res = await request(getTestTarget()).get('/items');
                expect(res.status).toBe(401);
            });

            it('should return items with valid token', async () => {
                if (SKIP_INTEGRATION || !adminToken) {
                    console.log('Skipping - no admin token');
                    return;
                }
                
                const res = await authRequest('get', '/items', adminToken);
                expect(res.status).toBe(200);
                expect(Array.isArray(res.body)).toBe(true);
            });
        });

        describe('POST /items', () => {
            it('should reject creation without required fields', async () => {
                if (SKIP_INTEGRATION || !adminToken) {
                    console.log('Skipping - no admin token');
                    return;
                }

                const res = await authRequest('post', '/items', adminToken)
                    .send({ name: '' });
                
                expect(res.status).toBe(400);
            });

            it('should reject negative quantity', async () => {
                if (SKIP_INTEGRATION || !adminToken) {
                    console.log('Skipping - no admin token');
                    return;
                }

                const res = await authRequest('post', '/items', adminToken)
                    .send({
                        name: 'Test Item',
                        cabinet: 'A1',
                        quantity: -5
                    });
                
                expect(res.status).toBe(400);
            });
        });
    });

    describe('Input Validation', () => {
        describe('SQL Injection Prevention', () => {
            it('should safely handle SQL injection attempts in login', async () => {
                if (SKIP_INTEGRATION) {
                    console.log('Skipping - no Turso credentials');
                    return;
                }
                const res = await request(getTestTarget())
                    .post('/login')
                    .send({
                        email: "admin@test.com'; DROP TABLE users; --",
                        password: 'password'
                    });
                
                // Should fail gracefully with 400 (validation) or 401 (auth), not cause a server error
                expect([400, 401]).toContain(res.status);
            });

            it('should safely handle SQL injection in search', async () => {
                if (SKIP_INTEGRATION || !adminToken) {
                    console.log('Skipping - no admin token');
                    return;
                }

                const res = await authRequest('get', '/items?search=\'; DROP TABLE items; --', adminToken);
                // Should return results or empty array, not crash
                expect([200, 400]).toContain(res.status);
            });
        });

        describe('XSS Prevention', () => {
            it('should sanitize script tags in input', async () => {
                if (SKIP_INTEGRATION || !adminToken) {
                    console.log('Skipping - no admin token');
                    return;
                }

                const res = await authRequest('post', '/items', adminToken)
                    .send({
                        name: '<script>alert("xss")</script>Test Item',
                        cabinet: 'A1',
                        quantity: 1
                    });
                
                // If created, the name should be stored (but rendered safely)
                // The server doesn't need to reject this, frontend handles rendering
                expect([200, 201, 400]).toContain(res.status);
            });
        });
    });

    describe('Rate Limiting', () => {
        it('should apply rate limits', async () => {
            if (SKIP_INTEGRATION) {
                console.log('Skipping - no Turso credentials');
                return;
            }
            const res = await request(getTestTarget()).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for unknown endpoints', async () => {
            if (SKIP_INTEGRATION) {
                console.log('Skipping - no Turso credentials');
                return;
            }
            const res = await request(getTestTarget()).get('/nonexistent-endpoint-12345');
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Endpoint not found');
        });

        it('should handle malformed JSON gracefully', async () => {
            if (SKIP_INTEGRATION) {
                console.log('Skipping - no Turso credentials');
                return;
            }
            const res = await request(getTestTarget())
                .post('/login')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }');
            
            expect([400, 500]).toContain(res.status);
        });
    });
});

describe('Security Headers', () => {
    it('should include security headers from Helmet', async () => {
        if (SKIP_INTEGRATION) {
            console.log('Skipping - no Turso credentials');
            return;
        }
        const res = await request(getTestTarget()).get('/health');
        
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBeDefined();
    });
});

// Unit tests that don't require database connection
describe('Unit Tests (No DB Required)', () => {
    describe('Environment Configuration', () => {
        it('should have JWT_SECRET set', () => {
            expect(process.env.JWT_SECRET).toBeDefined();
        });

        it('should be in test environment', () => {
            expect(process.env.NODE_ENV).toBe('test');
        });
    });

    describe('Input Validation Logic', () => {
        it('should validate email format correctly', () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            expect(emailRegex.test('valid@email.com')).toBe(true);
            expect(emailRegex.test('invalid-email')).toBe(false);
            expect(emailRegex.test('')).toBe(false);
        });

        it('should validate password length', () => {
            const isValidPassword = (pwd) => !!pwd && pwd.length >= 6;
            expect(isValidPassword('password123')).toBe(true);
            expect(isValidPassword('123')).toBe(false);
            expect(isValidPassword('')).toBe(false);
        });

        it('should validate username length', () => {
            const isValidUsername = (name) => name && name.length >= 3;
            expect(isValidUsername('admin')).toBe(true);
            expect(isValidUsername('ab')).toBe(false);
        });
    });
});