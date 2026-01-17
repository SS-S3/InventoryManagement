const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./inventory.db');

// Initialize database
db.serialize(() => {
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

  // Insert default admin user if not exists
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (!row) {
      bcrypt.hash('admin123', 10, (err, hash) => {
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
      });
    }
  });
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, 'secretkey', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role || 'user'], function(err) {
    if (err) return res.status(400).json({ error: 'User already exists' });
    res.json({ id: this.lastID });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, 'secretkey');
    res.json({ token });
  });
});

app.get('/items', authenticateToken, (req, res) => {
  db.all('SELECT * FROM items', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/items', authenticateToken, (req, res) => {
  const { name, description, cabinet, quantity, location_x, location_y } = req.body;
  db.run('INSERT INTO items (name, description, cabinet, quantity, location_x, location_y) VALUES (?, ?, ?, ?, ?, ?)', 
    [name, description, cabinet, quantity, location_x, location_y], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.put('/items/:id', authenticateToken, (req, res) => {
  const { name, description, cabinet, quantity, location_x, location_y } = req.body;
  db.run('UPDATE items SET name = ?, description = ?, cabinet = ?, quantity = ?, location_x = ?, location_y = ? WHERE id = ?',
    [name, description, cabinet, quantity, location_x, location_y, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

app.delete('/items/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM items WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

app.post('/issue', authenticateToken, (req, res) => {
  const { item_id, quantity } = req.body;
  const user_id = req.user.id;
  const date = new Date().toISOString();
  db.run('INSERT INTO transactions (item_id, user_id, type, quantity, date) VALUES (?, ?, ?, ?, ?)',
    [item_id, user_id, 'issue', quantity, date], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // Update item quantity
    db.run('UPDATE items SET quantity = quantity - ? WHERE id = ?', [quantity, item_id]);
    res.json({ id: this.lastID });
  });
});

app.post('/return', authenticateToken, (req, res) => {
  const { item_id, quantity } = req.body;
  const user_id = req.user.id;
  const date = new Date().toISOString();
  db.run('INSERT INTO transactions (item_id, user_id, type, quantity, date) VALUES (?, ?, ?, ?, ?)',
    [item_id, user_id, 'return', quantity, date], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // Update item quantity
    db.run('UPDATE items SET quantity = quantity + ? WHERE id = ?', [quantity, item_id]);
    res.json({ id: this.lastID });
  });
});

app.get('/transactions', authenticateToken, (req, res) => {
  db.all('SELECT t.*, i.name as item_name, u.username FROM transactions t JOIN items i ON t.item_id = i.id JOIN users u ON t.user_id = u.id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Projects
app.get('/projects', authenticateToken, (req, res) => {
  db.all('SELECT * FROM projects', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/projects', authenticateToken, (req, res) => {
  const { name, description } = req.body;
  db.run('INSERT INTO projects (name, description) VALUES (?, ?)', [name, description], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Allocations
app.get('/allocations', authenticateToken, (req, res) => {
  db.all('SELECT a.*, i.name as item_name, p.name as project_name FROM allocations a JOIN items i ON a.item_id = i.id JOIN projects p ON a.project_id = p.id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/allocations', authenticateToken, (req, res) => {
  const { item_id, project_id, allocated_quantity } = req.body;
  db.run('INSERT INTO allocations (item_id, project_id, allocated_quantity) VALUES (?, ?, ?)', [item_id, project_id, allocated_quantity], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.delete('/allocations/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM allocations WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Borrowings
app.get('/borrowings', authenticateToken, (req, res) => {
  db.all('SELECT b.*, i.name as item_name, u.username FROM borrowings b JOIN items i ON b.item_id = i.id JOIN users u ON b.user_id = u.id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/borrowings', authenticateToken, (req, res) => {
  const { item_id, quantity, expected_return_date } = req.body;
  const user_id = req.user.id;
  const borrow_date = new Date().toISOString();
  db.run('INSERT INTO borrowings (item_id, user_id, quantity, borrow_date, expected_return_date) VALUES (?, ?, ?, ?, ?)', 
    [item_id, user_id, quantity, borrow_date, expected_return_date], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // Update item quantity
    db.run('UPDATE items SET quantity = quantity - ? WHERE id = ?', [quantity, item_id]);
    res.json({ id: this.lastID });
  });
});

app.put('/borrowings/:id/return', authenticateToken, (req, res) => {
  const actual_return_date = new Date().toISOString();
  const { quantity } = req.body;
  db.run('UPDATE borrowings SET actual_return_date = ? WHERE id = ?', [actual_return_date, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // Update item quantity
    db.get('SELECT item_id FROM borrowings WHERE id = ?', [req.params.id], (err, row) => {
      if (row) {
        db.run('UPDATE items SET quantity = quantity + ? WHERE id = ?', [quantity, row.item_id]);
      }
    });
    res.json({ changes: this.changes });
  });
});

// Competitions
app.get('/competitions', authenticateToken, (req, res) => {
  db.all('SELECT * FROM competitions', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/competitions', authenticateToken, (req, res) => {
  const { name, date, description } = req.body;
  db.run('INSERT INTO competitions (name, date, description) VALUES (?, ?, ?)', [name, date, description], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Competition Items
app.get('/competitions/:id/items', authenticateToken, (req, res) => {
  db.all('SELECT ci.*, i.name as item_name FROM competition_items ci JOIN items i ON ci.item_id = i.id WHERE ci.competition_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/competitions/:id/items', authenticateToken, (req, res) => {
  const { item_id, quantity } = req.body;
  db.run('INSERT INTO competition_items (competition_id, item_id, quantity) VALUES (?, ?, ?)', [req.params.id, item_id, quantity], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});