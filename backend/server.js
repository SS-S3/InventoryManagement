const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './inventory.db';

// --- Security & Middleware ---
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // JSON parsing

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// --- Database Connection ---
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// --- Helper Functions ---

// Log History
const logHistory = (userId, username, action, details) => {
  db.run('INSERT INTO history (user_id, username, action, details) VALUES (?, ?, ?, ?)',
    [userId, username, action, details],
    (err) => {
      if (err) console.error('Error logging history:', err);
    }
  );
};

// --- Middleware ---

// Authentication
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Authorization: Admin Only
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admins only' });
  }
  next();
};

// Validation Checker
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// --- Routes ---

// 1. Authentication

app.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be 3+ chars').trim().escape(),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  validate
], async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role || 'user'],
      function (err) {
        if (err) return res.status(400).json({ error: 'Username already exists' });
        res.json({ id: this.lastID, message: 'User registered successfully' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', [
  body('username').exists().trim(),
  body('password').exists(),
  validate
], (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });
});

// 2. User Management (NEW - Admin Only)

app.get('/users', authenticateToken, isAdmin, (req, res) => {
  db.all('SELECT id, username, role FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/users/:id/role', [
  authenticateToken,
  isAdmin,
  body('role').isIn(['user', 'admin']).withMessage('Invalid role'),
  validate
], (req, res) => {
  const { role } = req.body;
  db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    logHistory(req.user.id, req.user.username, 'UPDATE_ROLE', `Changed user ID ${req.params.id} role to ${role}`);
    res.json({ message: 'Role updated' });
  });
});


// 3. Items (CRUD)

app.get('/items', authenticateToken, (req, res) => {
  db.all('SELECT * FROM items', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/items', [
  authenticateToken,
  isAdmin,
  body('name').notEmpty().trim().escape(),
  body('quantity').isInt({ min: 0 }),
  validate
], (req, res) => {
  const { name, description, cabinet, quantity, location_x, location_y } = req.body;
  db.run('INSERT INTO items (name, description, cabinet, quantity, location_x, location_y) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, cabinet, quantity, location_x, location_y], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logHistory(req.user.id, req.user.username, 'CREATE_ITEM', `Added item: ${name} (Qty: ${quantity})`);
      res.json({ id: this.lastID });
    });
});

app.put('/items/:id', authenticateToken, isAdmin, (req, res) => {
  const { name, description, cabinet, quantity, location_x, location_y } = req.body;
  db.run('UPDATE items SET name = ?, description = ?, cabinet = ?, quantity = ?, location_x = ?, location_y = ? WHERE id = ?',
    [name, description, cabinet, quantity, location_x, location_y, req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logHistory(req.user.id, req.user.username, 'UPDATE_ITEM', `Updated item ID: ${req.params.id} to ${name}`);
      res.json({ changes: this.changes });
    });
});

app.delete('/items/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('DELETE FROM items WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    logHistory(req.user.id, req.user.username, 'DELETE_ITEM', `Deleted item ID: ${req.params.id}`);
    res.json({ changes: this.changes });
  });
});

// 4. Transactions (Issue/Return with Transaction Logic)
// Note: SQLite serialized mode + db.run chain mimics basic transaction for single client
// For strict atomicity, we use BEGIN TRANSACTION

const runTransaction = (operation) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      operation()
        .then((result) => {
          db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve(result);
          });
        })
        .catch((err) => {
          db.run('ROLLBACK');
          reject(err);
        });
    });
  });
};

app.post('/issue', [
  authenticateToken,
  body('item_id').isInt(),
  body('quantity').isInt({ min: 1 }),
  validate
], (req, res) => {
  const { item_id, quantity } = req.body;
  const user_id = req.user.id;
  const date = new Date().toISOString();

  // Transaction: Check stock -> Deduct stock -> Log transaction
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Check stock
    db.get("SELECT quantity, name FROM items WHERE id = ?", [item_id], (err, row) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }
      if (!row || row.quantity < quantity) {
        db.run("ROLLBACK");
        return res.status(400).json({ error: "Insufficient stock or invalid item" });
      }

      // Deduct stock
      db.run("UPDATE items SET quantity = quantity - ? WHERE id = ?", [quantity, item_id], (err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }

        // Create Transaction Record
        db.run("INSERT INTO transactions (item_id, user_id, type, quantity, date) VALUES (?, ?, ?, ?, ?)",
          [item_id, user_id, 'issue', quantity, date],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: err.message });
            }

            db.run("COMMIT");
            logHistory(user_id, req.user.username, 'ISSUE_ITEM', `Issued ${quantity} of ${row.name}`);
            res.json({ id: this.lastID, message: "Item issued successfully" });
          }
        );
      });
    });
  });
});

app.post('/return', [
  authenticateToken,
  body('item_id').isInt(),
  body('quantity').isInt({ min: 1 }),
  validate
], (req, res) => {
  const { item_id, quantity } = req.body;
  const user_id = req.user.id;
  const date = new Date().toISOString();

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.run("UPDATE items SET quantity = quantity + ? WHERE id = ?", [quantity, item_id], (err) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }

      db.run("INSERT INTO transactions (item_id, user_id, type, quantity, date) VALUES (?, ?, ?, ?, ?)",
        [item_id, user_id, 'return', quantity, date],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: err.message });
          }
          db.run("COMMIT");
          logHistory(user_id, req.user.username, 'RETURN_ITEM', `Returned ${quantity} of Item ID: ${item_id}`);
          res.json({ id: this.lastID, message: "Item returned successfully" });
        }
      );
    });
  });
});

app.get('/transactions', authenticateToken, (req, res) => {
  db.all('SELECT t.*, i.name as item_name, u.username FROM transactions t JOIN items i ON t.item_id = i.id JOIN users u ON t.user_id = u.id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 5. Borrowings (Similar logic can be applied, simplified for brevity but includes logging)

app.get('/borrowings', authenticateToken, (req, res) => {
  db.all('SELECT b.*, i.name as item_name, u.username FROM borrowings b JOIN items i ON b.item_id = i.id JOIN users u ON b.user_id = u.id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/borrowings', [authenticateToken, body('quantity').isInt({ min: 1 }), validate], (req, res) => {
  const { item_id, quantity, expected_return_date } = req.body;
  const user_id = req.user.id;
  const borrow_date = new Date().toISOString();

  // Simple transaction flow
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run("UPDATE items SET quantity = quantity - ? WHERE id = ?", [quantity, item_id], (err) => {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }

      db.run("INSERT INTO borrowings (item_id, user_id, quantity, borrow_date, expected_return_date) VALUES (?, ?, ?, ?, ?)",
        [item_id, user_id, quantity, borrow_date, expected_return_date],
        function (err) {
          if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
          db.run("COMMIT");
          logHistory(user_id, req.user.username, 'BORROW_ITEM', `Borrowed ${quantity} of Item ${item_id}`);
          res.json({ id: this.lastID });
        }
      );
    });
  });
});

app.put('/borrowings/:id/return', authenticateToken, (req, res) => {
  const { quantity } = req.body;
  const actual_return_date = new Date().toISOString();

  // Simple logic: Mark as returned (partial returns not implemented in simplified schema, assuming full return or just closing record)
  // Updating item stock back

  db.get("SELECT item_id, quantity FROM borrowings WHERE id = ?", [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Borrowing not found" });

    const returnQty = quantity || row.quantity; // Default to full quantity if not specified

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run("UPDATE items SET quantity = quantity + ? WHERE id = ?", [returnQty, row.item_id], (err) => {
        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }

        db.run("UPDATE borrowings SET actual_return_date = ? WHERE id = ?", [actual_return_date, req.params.id], (err) => {
          if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
          db.run("COMMIT");
          logHistory(req.user.id, req.user.username, 'RETURN_BORROWING', `Returned borrowing ID: ${req.params.id}`);
          res.json({ message: "Returned successfully" });
        });
      });
    });
  });
});

// 6. Projects & Allocations

app.get('/projects', authenticateToken, (req, res) => {
  db.all('SELECT * FROM projects', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/projects', authenticateToken, isAdmin, (req, res) => {
  const { name, description } = req.body;
  db.run('INSERT INTO projects (name, description) VALUES (?, ?)', [name, description], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    logHistory(req.user.id, req.user.username, 'CREATE_PROJECT', `Created project: ${name}`);
    res.json({ id: this.lastID });
  });
});

app.get('/allocations', authenticateToken, (req, res) => {
  db.all('SELECT a.*, i.name as item_name, p.name as project_name FROM allocations a JOIN items i ON a.item_id = i.id JOIN projects p ON a.project_id = p.id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/allocations', authenticateToken, isAdmin, (req, res) => {
  const { item_id, project_id, allocated_quantity } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Check stock
    db.get("SELECT quantity FROM items WHERE id = ?", [item_id], (err, row) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }
      if (!row || row.quantity < allocated_quantity) {
        db.run("ROLLBACK");
        return res.status(400).json({ error: "Insufficient stock for allocation" });
      }

      // 2. Deduct stock
      db.run("UPDATE items SET quantity = quantity - ? WHERE id = ?", [allocated_quantity, item_id], (err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }

        // 3. Create allocation
        db.run('INSERT INTO allocations (item_id, project_id, allocated_quantity) VALUES (?, ?, ?)',
          [item_id, project_id, allocated_quantity],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: err.message });
            }
            db.run("COMMIT");
            logHistory(req.user.id, req.user.username, 'ALLOCATE_RESOURCE', `Allocated quantity ${allocated_quantity} of Item ${item_id} to Project ${project_id}`);
            res.json({ id: this.lastID });
          }
        );
      });
    });
  });
});

app.delete('/allocations/:id', authenticateToken, isAdmin, (req, res) => {
  const allocationId = req.params.id;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Get the allocation details to know what to restore
    db.get("SELECT item_id, allocated_quantity FROM allocations WHERE id = ?", [allocationId], (err, row) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        db.run("ROLLBACK");
        return res.status(404).json({ error: "Allocation not found" });
      }

      const { item_id, allocated_quantity } = row;

      // 2. Restore the item quantity
      db.run("UPDATE items SET quantity = quantity + ? WHERE id = ?", [allocated_quantity, item_id], (err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }

        // 3. Delete the allocation record
        db.run("DELETE FROM allocations WHERE id = ?", [allocationId], function (err) {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: err.message });
          }

          db.run("COMMIT");
          logHistory(req.user.id, req.user.username, 'REMOVE_ALLOCATION', `Removed allocation ID: ${allocationId} (Restored ${allocated_quantity} items)`);
          res.json({ message: "Allocation removed and items restored" });
        });
      });
    });
  });
});


// 7. Competitions

app.get('/competitions', authenticateToken, (req, res) => {
  db.all('SELECT * FROM competitions', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/competitions', authenticateToken, isAdmin, (req, res) => {
  const { name, date, description } = req.body;
  db.run('INSERT INTO competitions (name, date, description) VALUES (?, ?, ?)', [name, date, description], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    logHistory(req.user.id, req.user.username, 'CREATE_COMPETITION', `Created competition: ${name}`);
    res.json({ id: this.lastID });
  });
});

app.get('/competitions/:id/items', authenticateToken, (req, res) => {
  const query = `SELECT ci.*, i.name as item_name 
                 FROM competition_items ci 
                 JOIN items i ON ci.item_id = i.id 
                 WHERE ci.competition_id = ?`;
  db.all(query, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/competitions/:id/items', authenticateToken, isAdmin, (req, res) => {
  const { item_id, quantity } = req.body;
  const competition_id = req.params.id;

  db.run('INSERT INTO competition_items (competition_id, item_id, quantity) VALUES (?, ?, ?)',
    [competition_id, item_id, quantity], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logHistory(req.user.id, req.user.username, 'ADD_COMPETITION_RESOURCE', `Added ${quantity} items to competition ${competition_id}`);
      res.json({ id: this.lastID });
    });
});

// 8. History (Admin Only)

app.get('/history', authenticateToken, isAdmin, (req, res) => {
  db.all('SELECT * FROM history ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});