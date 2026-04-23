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

const dbRun = async (sql, args = []) => {
    const client = await getClient();
    if (client.execute) {
        const result = await client.execute({ sql, args });
        return { lastID: Number(result.lastInsertRowid), changes: Number(result.changes) || 0 };
    }
    const stmt = await client.prepare(sql);
    const result = await stmt.run(args);
    return { lastID: Number(result.lastInsertRowid), changes: Number(result.changes) || 0 };
};

const dbGet = async (sql, args = []) => {
    const client = await getClient();
    if (client.execute) {
        const result = await client.execute({ sql, args });
        return result.rows[0];
    }
    const stmt = await client.prepare(sql);
    return await stmt.get(args);
};

const seed = async () => {
    console.log('Seeding mock data...');

    const passwordHash = '$2b$10$vI8tm7.1G9W43b8uX7JmXO9S8.yNlV.s4yNlV.s4yNlV.s4yNlV.s'; 

    await dbRun(`INSERT OR IGNORE INTO users (username, password, role, full_name, email, department) VALUES 
        ('admin', ?, 'admin', 'System Admin', 'admin@example.com', 'software')`, [passwordHash]);
    await dbRun(`INSERT OR IGNORE INTO users (username, password, role, full_name, email, department) VALUES 
        ('member1', ?, 'member', 'John Member', 'member1@example.com', 'mechanical')`, [passwordHash]);
    await dbRun(`INSERT OR IGNORE INTO users (username, password, role, full_name, email, department) VALUES 
        ('member2', ?, 'member', 'Jane Member', 'member2@example.com', 'embedded')`, [passwordHash]);

    const admin = await dbGet("SELECT id FROM users WHERE username = 'admin'");
    const m1 = await dbGet("SELECT id FROM users WHERE username = 'member1'");
    const m2 = await dbGet("SELECT id FROM users WHERE username = 'member2'");

    const adminId = admin.id;
    const m1Id = m1.id;
    const m2Id = m2.id;

    // 2. Create projects
    const p1Res = await dbRun(`INSERT INTO projects (name, description, status, lead_id) VALUES 
        ('Project Phoenix', 'A high-stakes robotics project focused on autonomous flight.', 'active', ?)`, [adminId]);
    const p2Res = await dbRun(`INSERT INTO projects (name, description, status, lead_id) VALUES 
        ('Eco Rover', 'Developing an eco-friendly rover for soil analysis.', 'planning', ?)`, [m1Id]);

    const p1Id = p1Res.lastID;
    const p2Id = p2Res.lastID;

    // 3. Create volunteer applications
    await dbRun(`INSERT INTO project_volunteers (project_id, user_id, status) VALUES (?, ?, 'pending')`, [p1Id, m1Id]);
    await dbRun(`INSERT INTO project_volunteers (project_id, user_id, status) VALUES (?, ?, 'accepted')`, [p1Id, m2Id]);
    await dbRun(`INSERT INTO project_volunteers (project_id, user_id, status) VALUES (?, ?, 'pending')`, [p2Id, m2Id]);

    // 4. Add some initial chat messages
    await dbRun(`INSERT INTO project_chats (project_id, sender_id, message) VALUES (?, ?, 'Welcome to Project Phoenix! Let''s get started.')`, [p1Id, adminId]);
    await dbRun(`INSERT INTO project_chats (project_id, sender_id, message) VALUES (?, ?, 'Thanks! Glad to be part of the team.')`, [p1Id, m2Id]);

    console.log('Mock data seeded successfully.');
};

seed()
    .then(async () => {
        const client = await getClient();
        if (client?.close) await client.close();
        process.exit(0);
    })
    .catch(async (err) => {
        console.error('Seeding failed:', err);
        const client = await getClient();
        if (client?.close) await client.close();
        process.exit(1);
    });
