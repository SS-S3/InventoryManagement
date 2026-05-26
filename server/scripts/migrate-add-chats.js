const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    throw new Error('Missing Turso configuration. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in the environment.');
}

let clientPromise;

const getClient = () => {
    if (!clientPromise) {
        clientPromise = (async () => {
            const { connect } = await import('@tursodatabase/serverless');
            return connect({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
        })();
    }
    return clientPromise;
};

const runStatement = async (sql, params = []) => {
    const client = await getClient();
    if (params.length) {
        const stmt = client.prepare(sql);
        return await stmt.run(params);
    }
    return await client.exec(sql);
};

const checkTableExists = async (tableName) => {
    const client = await getClient();
    try {
        const stmt = client.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`);
        const result = await stmt.get([tableName]);
        return !!result;
    } catch (e) {
        console.warn(`Error checking table ${tableName}: ${e.message}`);
        return false;
    }
};

const runMigrations = async () => {
    console.log('Running safe migrations (non-destructive)...\n');

    // Check and create project_chats table if it doesn't exist
    const projectChatsExists = await checkTableExists('project_chats');
    if (!projectChatsExists) {
        console.log('Creating project_chats table...');
        await runStatement(`CREATE TABLE project_chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('project_chats table created.');
    } else {
        console.log('project_chats table already exists.');
    }

    // Create indices (using IF NOT EXISTS so it's safe to run multiple times)
    const indices = [
        { name: 'idx_project_chats_project', sql: 'CREATE INDEX IF NOT EXISTS idx_project_chats_project ON project_chats(project_id)' },
        { name: 'idx_users_email', sql: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)' },
        { name: 'idx_requests_user', sql: 'CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id)' },
        { name: 'idx_requests_status', sql: 'CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status)' },
        { name: 'idx_borrowings_user', sql: 'CREATE INDEX IF NOT EXISTS idx_borrowings_user ON borrowings(user_id)' },
        { name: 'idx_borrowings_returned', sql: 'CREATE INDEX IF NOT EXISTS idx_borrowings_returned ON borrowings(returned_at)' },
        { name: 'idx_project_volunteers_user', sql: 'CREATE INDEX IF NOT EXISTS idx_project_volunteers_user ON project_volunteers(user_id)' },
        { name: 'idx_competition_volunteers_user', sql: 'CREATE INDEX IF NOT EXISTS idx_competition_volunteers_user ON competition_volunteers(user_id)' },
        { name: 'idx_items_cabinet', sql: 'CREATE INDEX IF NOT EXISTS idx_items_cabinet ON items(cabinet)' },
        { name: 'idx_items_category', sql: 'CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)' },
        { name: 'idx_history_user', sql: 'CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id)' },
        { name: 'idx_articles_date', sql: 'CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(fetched_for)' },
    ];

    console.log('\nCreating indices...');
    for (const idx of indices) {
        try {
            await runStatement(idx.sql);
            console.log(`Index ${idx.name} created/verified.`);
        } catch (e) {
            console.warn(`Index ${idx.name} failed: ${e.message}`);
        }
    }

    console.log('\nSafe migrations completed successfully.');
};

runMigrations()
    .then(async () => {
        const client = await getClient();
        if (client?.close) {
            await client.close();
        }
        process.exit(0);
    })
    .catch(async (err) => {
        console.error('Migration failed:', err);
        const client = await getClient();
        if (client?.close) {
            await client.close();
        }
        process.exit(1);
    });