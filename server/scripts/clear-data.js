/**
 * Clear all data from database tables while preserving schema
 * Run with: node scripts/clear-data.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    console.error('Missing Turso configuration. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env');
    process.exit(1);
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

const runStatement = async (sql) => {
    const client = await getClient();
    return client.exec(sql);
};

const clearAllData = async () => {
    console.log('🗑️  Clearing all data from database...\n');

    try {
        // Disable foreign key checks temporarily
        await runStatement('PRAGMA foreign_keys = OFF');

        // All tables in dependency order (children first)
        const tablesToClear = [
            'articles',
            'submissions',
            'assignments',
            'borrowings',
            'requests',
            'history',
            'competition_volunteers',
            'competition_items',
            'competitions',
            'project_volunteers',
            'projects',
            'items',
            'users'
        ];

        for (const table of tablesToClear) {
            try {
                await runStatement(`DELETE FROM ${table}`);
                console.log(`   ✓ Cleared table: ${table}`);
            } catch (err) {
                if (err.message.includes('no such table')) {
                    console.log(`   - Table ${table} does not exist, skipping`);
                } else {
                    throw err;
                }
            }
        }

        // Reset auto-increment counters
        try {
            await runStatement('DELETE FROM sqlite_sequence');
            console.log('   ✓ Reset auto-increment counters');
        } catch (err) {
            if (!err.message.includes('no such table')) {
                throw err;
            }
        }

        // Re-enable foreign key checks
        await runStatement('PRAGMA foreign_keys = ON');

        console.log('\n✅ Database cleared successfully!');
        console.log('   Schema preserved, ready for fresh entries after deployment.\n');

    } catch (error) {
        console.error('\n❌ Error clearing database:', error.message);
        process.exit(1);
    }
};

clearAllData();
