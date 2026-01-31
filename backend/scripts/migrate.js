const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DB_PATH || './inventory.db';
const db = new sqlite3.Database(path.join(__dirname, '..', dbPath));

const runStatement = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                return reject(err);
            }
            resolve(this);
        });
    });

const runMigrations = async () => {
    console.log('Running migrations...');

    await runStatement('PRAGMA foreign_keys = OFF');

    const dropTargets = [
        'articles',
        'submissions',
        'assignments',
        'borrowings',
        'requests',
        'history',
        'competition_items',
        'competition_volunteers',
        'competitions',
        'allocations',
        'project_volunteers',
        'projects',
        'transactions',
        'items',
        'users'
    ];

    for (const table of dropTargets) {
        await runStatement(`DROP TABLE IF EXISTS ${table}`);
    }

    try {
        await runStatement('DELETE FROM sqlite_sequence');
    } catch (err) {
        if (!err.message.includes('no such table')) {
            throw err;
        }
    }
    await runStatement('PRAGMA foreign_keys = ON');

    await runStatement(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin','member')) NOT NULL DEFAULT 'member',
        full_name TEXT NOT NULL,
        roll_number TEXT UNIQUE,
        gender TEXT CHECK(gender IN ('male','female','other')),
        phone TEXT,
        email TEXT UNIQUE NOT NULL,
        department TEXT CHECK(department IN ('mechanical','software','embedded')),
        branch TEXT,
        is_verified INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
    )`);

    await runStatement(`CREATE TABLE requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        reason TEXT,
        expected_return_date DATETIME,
        status TEXT CHECK(status IN ('pending','approved','rejected','cancelled')) DEFAULT 'pending',
        requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        resolved_by INTEGER,
        cancellation_reason TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(resolved_by) REFERENCES users(id)
    )`);

    await runStatement(`CREATE TABLE borrowings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        request_id INTEGER,
        tool_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        borrowed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expected_return_date DATETIME,
        returned_at DATETIME,
        notes TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(request_id) REFERENCES requests(id)
    )`);

    await runStatement(`CREATE TABLE assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        department TEXT,
        due_date DATETIME,
        resource_url TEXT,
        status TEXT DEFAULT 'active',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
    )`);

    await runStatement(`CREATE TABLE submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        github_link TEXT NOT NULL,
        status TEXT CHECK(status IN ('pending','pass','fail')) DEFAULT 'pending',
        feedback TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        graded_at DATETIME,
        graded_by INTEGER,
        FOREIGN KEY(assignment_id) REFERENCES assignments(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(graded_by) REFERENCES users(id),
        UNIQUE(assignment_id, user_id)
    )`);

    await runStatement(`CREATE TABLE competitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_date DATETIME,
        end_date DATETIME,
        location TEXT,
        status TEXT DEFAULT 'upcoming',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runStatement(`CREATE TABLE items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        cabinet TEXT,
        quantity INTEGER DEFAULT 0,
        available_quantity INTEGER DEFAULT 0,
        location_x REAL,
        location_y REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runStatement(`CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('issue','return')) NOT NULL,
        quantity INTEGER NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(item_id) REFERENCES items(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    await runStatement(`CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK(status IN ('planning','active','completed','on_hold')) DEFAULT 'planning',
        lead_id INTEGER,
        start_date DATETIME,
        end_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        FOREIGN KEY(lead_id) REFERENCES users(id)
    )`);

    await runStatement(`CREATE TABLE project_volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('pending','accepted','rejected')) DEFAULT 'pending',
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        resolved_by INTEGER,
        FOREIGN KEY(project_id) REFERENCES projects(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(resolved_by) REFERENCES users(id),
        UNIQUE(project_id, user_id)
    )`);

    await runStatement(`CREATE TABLE competition_volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        competition_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('pending','accepted','rejected')) DEFAULT 'pending',
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        resolved_by INTEGER,
        FOREIGN KEY(competition_id) REFERENCES competitions(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(resolved_by) REFERENCES users(id),
        UNIQUE(competition_id, user_id)
    )`);

    await runStatement(`CREATE TABLE allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        allocated_quantity INTEGER NOT NULL,
        allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(item_id) REFERENCES items(id),
        FOREIGN KEY(project_id) REFERENCES projects(id)
    )`);

    await runStatement(`CREATE TABLE competition_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        competition_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY(competition_id) REFERENCES competitions(id),
        FOREIGN KEY(item_id) REFERENCES items(id)
    )`);

    await runStatement(`CREATE TABLE history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    await runStatement(`CREATE TABLE articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        source TEXT,
        published_at DATETIME,
        fetched_for DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runStatement('CREATE UNIQUE INDEX idx_articles_url_day ON articles(url, fetched_for)');

    console.log('Migrations completed successfully.');
};

runMigrations()
    .then(() => {
        db.close();
        process.exit(0);
    })
    .catch((err) => {
        console.error('Migration failed:', err);
        db.close();
        process.exit(1);
    });
