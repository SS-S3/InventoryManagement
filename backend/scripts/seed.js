const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DB_PATH || './inventory.db';
const db = new sqlite3.Database(path.join(__dirname, '..', dbPath));

const seed = () => {
    db.serialize(() => {
        console.log('Seeding Database...');

        const adminUser = {
            username: 'admin',
            password: 'admin123',
            role: 'admin'
        };

        db.get('SELECT * FROM users WHERE username = ?', [adminUser.username], (err, row) => {
            if (err) {
                console.error('Error checking admin user:', err);
                return;
            }

            if (!row) {
                bcrypt.hash(adminUser.password, 10, (err, hash) => {
                    if (err) {
                        console.error('Error hashing password:', err);
                        return;
                    }

                    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                        [adminUser.username, hash, adminUser.role],
                        (err) => {
                            if (err) {
                                console.error('Error seeding admin user:', err);
                            } else {
                                console.log('Admin user seeded successfully.');
                            }
                            process.exit(0);
                        }
                    );
                });
            } else {
                console.log('Admin user already exists.');
                process.exit(0);
            }
        });
    });
};

seed();
