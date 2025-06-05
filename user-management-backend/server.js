const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001' }));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database:', process.env.DB_NAME);
    connection.release();
  } catch (err) {
    console.error('Failed to connect to MySQL database:', err.message);
    process.exit(1);
  }
})();

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret'); // Replace with a secure secret
    const [rows] = await pool.query('SELECT status FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (rows[0].status === 'blocked') {
      return res.status(403).json({ message: 'Account is blocked' });
    }
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Initialize database schema
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50),
        last_seen DATETIME,
        activity_data JSON,
        status ENUM('active', 'blocked') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table schema ensured.');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
})();

// Register endpoint
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields (name, email, and password) are required' });
  }

  try {
    const hashedPassword = password; // Placeholder; use bcrypt.hash(password, 10) in production
    await pool.query(
      'INSERT INTO users (name, email, password, role, last_seen, activity_data) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, null, null, '[0, 0, 0]']
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err.message, err);
    if (err.errno === 1062) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email not found' });
    }
    const user = rows[0];
    if (user.password !== password) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Account is blocked' });
    }
    await pool.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);
    const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Users endpoint
app.get('/users', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, role, email, last_seen, CAST(activity_data AS CHAR) AS activity_data, status FROM users');
    res.json(rows.length > 0 ? rows : [{ message: 'No users found' }]);
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ message: 'Server error getting users' });
  }
});

// Block users endpoint
app.put('/users/block', authMiddleware, async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Invalid or missing user IDs' });
  }
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    for (const userId of userIds) {
      await connection.query('UPDATE users SET status = "blocked" WHERE id = ?', [userId]);
    }
    await connection.commit();
    res.json({ message: 'Users blocked successfully' });
    connection.release();
  } catch (err) {
    console.error('Block users error:', err.message);
    res.status(500).json({ message: 'Server error blocking users' });
  }
});

// Unblock users endpoint
app.put('/users/unblock', authMiddleware, async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Invalid or missing user IDs' });
  }
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    for (const userId of userIds) {
      await connection.query('UPDATE users SET status = "active" WHERE id = ?', [userId]);
    }
    await connection.commit();
    res.json({ message: 'Users unblocked successfully' });
    connection.release();
  } catch (err) {
    console.error('Unblock users error:', err.message);
    res.status(500).json({ message: 'Server error unblocking users' });
  }
});

// Delete users endpoint
app.delete('/users', authMiddleware, async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Invalid or missing user IDs' });
  }
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    for (const userId of userIds) {
      await connection.query('DELETE FROM users WHERE id = ?', [userId]);
    }
    await connection.commit();
    res.json({ message: 'Users deleted successfully' });
    connection.release();
  } catch (err) {
    console.error('Delete users error:', err.message);
    res.status(500).json({ message: 'Server error deleting users' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));