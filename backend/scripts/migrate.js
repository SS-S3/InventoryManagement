const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DB_PATH || './inventory.db';
const db = new sqlite3.Database(path.join(__dirname, '..', dbPath));

const up = () => {
    db.serialize(() => {
        console.log('Running Migrations...');

        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            cabinet TEXT,
            quantity INTEGER,
            location_x REAL,
            location_y REAL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER,
            user_id INTEGER,
            type TEXT, -- 'issue' or 'return'
            quantity INTEGER,
            date TEXT,
            FOREIGN KEY(item_id) REFERENCES items(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS allocations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER,
            project_id INTEGER,
            allocated_quantity INTEGER,
            FOREIGN KEY(item_id) REFERENCES items(id),
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS borrowings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER,
            user_id INTEGER,
            quantity INTEGER,
            borrow_date TEXT,
            expected_return_date TEXT,
            actual_return_date TEXT,
            FOREIGN KEY(item_id) REFERENCES items(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS competitions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            date TEXT,
            description TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS competition_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            competition_id INTEGER,
            item_id INTEGER,
            quantity INTEGER,
            FOREIGN KEY(competition_id) REFERENCES competitions(id),
            FOREIGN KEY(item_id) REFERENCES items(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            action TEXT,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Migration failed:', err);
                process.exit(1);
            } else {
                console.log('Migrations completed successfully.');
                process.exit(0);
            }
        });
    });
};

up();
