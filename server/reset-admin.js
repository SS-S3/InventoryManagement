require('dotenv').config();
const bcrypt = require('bcryptjs');

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    console.error("Missing Turso configuration.");
    process.exit(1);
}

async function resetAdmin() {
    console.log("Resetting admin password...");
    try {
        const { createClient, connect } = await import('@tursodatabase/serverless');
        // Fallback or specific export
        const dbParams = {
            url: TURSO_DATABASE_URL,
            authToken: TURSO_AUTH_TOKEN
        };
        const client = await (connect ? connect(dbParams) : createClient(dbParams));
        console.log("Client prototype:", Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
        const password = 'soumya@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Ensure user exists first or update
        const email = 'soumya@example.com'; // Using dummy email if not known, or expecting usage of username
        const username = 'soumya';


        // Upsert logic
        // Try update
        try {
            const stmt = await client.prepare("UPDATE users SET password = ? WHERE username = ?");
            const result = await stmt.run([hashedPassword, username]);
            // result usually has changes or rowsAffected

            // Check rows affected (depends on verify implementation, assuming result structure)
            // If result.changes is 0, insert. 
            // Note: result structure varies by adapter. Let's assume standard object.
            console.log("Update result:", result);

            if (result.changes === 0) {
                console.log("User 'soumya' not found. Creating...");
                const insertStmt = await client.prepare("INSERT INTO users (username, password, role, full_name, email, is_verified) VALUES (?, ?, 'admin', 'Soumya Shekhar', 'soumya@example.com', 1)");
                await insertStmt.run([username, hashedPassword]);
                console.log("Admin user 'soumya' created.");
            } else {
                console.log("Admin user 'soumya' password updated.");
            }
        } catch (e) {
            console.error("Operation failed:", e);
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

resetAdmin();
