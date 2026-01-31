const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
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

const hashPassword = (password) =>
    new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                return reject(err);
            }
            resolve(hash);
        });
    });

const seed = async () => {
    console.log('Seeding database...');

    try {
        await runStatement('PRAGMA foreign_keys = OFF');

        const tablesToClear = [
            'articles',
            'submissions',
            'assignments',
            'borrowings',
            'requests',
            'history',
            'competition_volunteers',
            'competitions',
            'competition_items',
            'project_volunteers',
            'projects',
            'items',
            'users'
        ];

        for (const table of tablesToClear) {
            await runStatement(`DELETE FROM ${table}`);
        }

        try {
            await runStatement('DELETE FROM sqlite_sequence');
        } catch (err) {
            if (!err.message.includes('no such table')) {
                throw err;
            }
        }

        await runStatement('PRAGMA foreign_keys = ON');

        const adminUser = {
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            fullName: 'System Admin',
            rollNumber: 'ADMIN001',
            gender: 'male',
            phone: '+10000000000',
            email: 'admin@example.com',
            department: 'software',
            branch: 'CSE'
        };

        const memberUser = {
            username: 'member',
            password: 'member123',
            role: 'member',
            fullName: 'Core Member',
            rollNumber: 'MEMBER001',
            gender: 'female',
            phone: '+10000000001',
            email: 'member@example.com',
            department: 'mechanical',
            branch: 'ME'
        };

        const adminHash = await hashPassword(adminUser.password);
        const memberHash = await hashPassword(memberUser.password);

        const insertUserSql = `
            INSERT INTO users (username, password, role, full_name, roll_number, gender, phone, email, department, branch, is_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `;

        await runStatement(insertUserSql, [
            adminUser.username,
            adminHash,
            adminUser.role,
            adminUser.fullName,
            adminUser.rollNumber,
            adminUser.gender,
            adminUser.phone,
            adminUser.email,
            adminUser.department,
            adminUser.branch
        ]);

        await runStatement(insertUserSql, [
            memberUser.username,
            memberHash,
            memberUser.role,
            memberUser.fullName,
            memberUser.rollNumber,
            memberUser.gender,
            memberUser.phone,
            memberUser.email,
            memberUser.department,
            memberUser.branch
        ]);

        // Seed items
        const items = [
            { name: 'Soldering Iron', category: 'Electronics', description: 'Temperature-controlled soldering iron', quantity: 5, available_quantity: 5 },
            { name: 'Multimeter', category: 'Electronics', description: 'Digital multimeter for voltage/current measurement', quantity: 10, available_quantity: 10 },
            { name: 'Oscilloscope', category: 'Electronics', description: 'Digital oscilloscope 100MHz', quantity: 2, available_quantity: 2 },
            { name: 'Arduino Uno', category: 'Microcontrollers', description: 'Arduino Uno R3 development board', quantity: 15, available_quantity: 15 },
            { name: 'Raspberry Pi 4', category: 'Microcontrollers', description: 'Raspberry Pi 4 Model B 4GB', quantity: 8, available_quantity: 8 },
            { name: '3D Printer Filament', category: 'Materials', description: 'PLA filament 1.75mm', quantity: 20, available_quantity: 20 },
            { name: 'Power Supply', category: 'Electronics', description: 'Adjustable DC power supply 0-30V', quantity: 4, available_quantity: 4 },
            { name: 'Drill Machine', category: 'Tools', description: 'Cordless drill with bits set', quantity: 3, available_quantity: 3 }
        ];

        for (const item of items) {
            await runStatement(
                `INSERT INTO items (name, category, description, quantity, available_quantity, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
                [item.name, item.category, item.description, item.quantity, item.available_quantity]
            );
        }
        console.log('Items seeded successfully.');

        // Seed competitions
        const competitions = [
            { name: 'Robotics Challenge 2026', description: 'Annual robotics competition', start_date: '2026-03-01', end_date: '2026-03-15', status: 'upcoming' },
            { name: 'Hackathon Spring', description: '48-hour coding hackathon', start_date: '2026-04-10', end_date: '2026-04-12', status: 'upcoming' },
            { name: 'Design Sprint', description: 'Product design competition', start_date: '2026-02-15', end_date: '2026-02-20', status: 'active' }
        ];

        for (const comp of competitions) {
            await runStatement(
                `INSERT INTO competitions (name, description, start_date, end_date, status, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
                [comp.name, comp.description, comp.start_date, comp.end_date, comp.status]
            );
        }
        console.log('Competitions seeded successfully.');

        // Seed projects
        const projects = [
            { name: 'Autonomous Robot', description: 'Build an autonomous navigation robot', status: 'active', lead_id: 1, start_date: '2026-01-15', end_date: '2026-06-01' },
            { name: 'Smart Home System', description: 'IoT-based home automation system', status: 'planning', lead_id: 1, start_date: '2026-03-01', end_date: '2026-08-01' },
            { name: 'Drone Development', description: 'Custom drone for aerial photography', status: 'active', lead_id: 1, start_date: '2026-01-01', end_date: '2026-04-30' }
        ];

        for (const proj of projects) {
            await runStatement(
                `INSERT INTO projects (name, description, status, lead_id, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
                [proj.name, proj.description, proj.status, proj.lead_id, proj.start_date, proj.end_date]
            );
        }
        console.log('Projects seeded successfully.');

        // Seed assignments
        const assignments = [
            { title: 'Weekly Report', description: 'Submit weekly progress report', due_date: '2026-02-07', status: 'active' },
            { title: 'Component Inventory', description: 'Update component inventory list', due_date: '2026-02-14', status: 'active' },
            { title: 'Safety Training', description: 'Complete safety training module', due_date: '2026-02-01', status: 'completed' }
        ];

        for (const assign of assignments) {
            await runStatement(
                `INSERT INTO assignments (title, description, due_date, status, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
                [assign.title, assign.description, assign.due_date, assign.status]
            );
        }
        console.log('Assignments seeded successfully.');

        // Seed submissions for the member user (id=2)
        await runStatement(
            `INSERT INTO submissions (assignment_id, user_id, github_link, submitted_at, status) VALUES (3, 2, 'https://github.com/member/safety-training', datetime('now'), 'pass')`
        );
        console.log('Submissions seeded successfully.');

        // Seed requests (member user id=2 requesting tools)
        const requests = [
            { user_id: 2, title: 'Need Oscilloscope for Project', tool_name: 'Oscilloscope', quantity: 1, reason: 'Signal analysis for autonomous robot project', expected_return_date: '2026-02-15', status: 'pending' },
            { user_id: 2, title: 'Arduino for Prototyping', tool_name: 'Arduino Uno', quantity: 2, reason: 'Prototyping control system', expected_return_date: '2026-02-20', status: 'pending' },
            { user_id: 2, title: 'Multimeter Request', tool_name: 'Multimeter', quantity: 1, reason: 'Circuit testing and debugging', expected_return_date: '2026-02-10', status: 'approved', resolved_at: "datetime('now', '-1 day')", resolved_by: 1 },
            { user_id: 2, title: 'Soldering Equipment', tool_name: 'Soldering Iron', quantity: 1, reason: 'PCB assembly work', expected_return_date: '2026-02-18', status: 'pending' },
            { user_id: 2, title: 'Power Supply Unit', tool_name: 'Power Supply', quantity: 1, reason: 'Testing power requirements for drone', expected_return_date: '2026-02-25', status: 'rejected', resolved_at: "datetime('now', '-2 days')", resolved_by: 1, cancellation_reason: 'All units currently in use' }
        ];

        for (const req of requests) {
            if (req.status === 'pending') {
                await runStatement(
                    `INSERT INTO requests (user_id, title, tool_name, quantity, reason, expected_return_date, status, requested_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                    [req.user_id, req.title, req.tool_name, req.quantity, req.reason, req.expected_return_date, req.status]
                );
            } else {
                await runStatement(
                    `INSERT INTO requests (user_id, title, tool_name, quantity, reason, expected_return_date, status, requested_at, resolved_at, resolved_by, cancellation_reason) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-3 days'), datetime('now', '-1 day'), ?, ?)`,
                    [req.user_id, req.title, req.tool_name, req.quantity, req.reason, req.expected_return_date, req.status, req.resolved_by, req.cancellation_reason || null]
                );
            }
        }
        console.log('Requests seeded successfully.');

        // Seed borrowings (approved requests become borrowings)
        await runStatement(
            `INSERT INTO borrowings (user_id, request_id, tool_name, quantity, borrowed_at, expected_return_date, notes) 
             VALUES (2, 3, 'Multimeter', 1, datetime('now', '-1 day'), '2026-02-10', 'Approved for circuit testing')`
        );
        console.log('Borrowings seeded successfully.');

        console.log('Database seeded successfully.');
        db.close();
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        db.close();
        process.exit(1);
    }
};

seed();
