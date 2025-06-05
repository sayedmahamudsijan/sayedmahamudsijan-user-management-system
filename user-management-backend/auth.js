const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role, status, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *',
      [name, email, hashedPassword, 'user', 'active']
    );

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Account is blocked' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Email not found' });
    }

    // In a real app, send a reset link via email
    return res.json({ message: 'Password reset instructions sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
};

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = userResult.rows[0];
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Account is blocked' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { register, login, authMiddleware, forgotPassword };
