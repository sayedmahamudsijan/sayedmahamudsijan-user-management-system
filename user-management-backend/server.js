const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const { register, login, authMiddleware, forgotPassword } = require('./auth');
const { getUsers, blockUsers, unblockUsers, deleteUsers } = require('./user');

const app = express();
app.use(express.json());

const allowedOrigins = [
  'https://user-management-frontend-1i015d1vb.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

(async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to Postgres database');
    client.release();
  } catch (err) {
    console.error('Failed to connect to Postgres database:', err.message);
    process.exit(1);
  }
})();

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50),
        last_login TIMESTAMP,
        activity_data JSONB DEFAULT '[0, 0, 0]',
        status VARCHAR(50) CHECK (status IN ('active', 'blocked')) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table schema ensured.');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
})();

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.post('/register', register);
app.post('/login', login);
app.post('/forgot-password', forgotPassword);
app.get('/users', authMiddleware, getUsers);
app.put('/users/block', authMiddleware, blockUsers);
app.put('/users/unblock', authMiddleware, unblockUsers);
app.delete('/users', authMiddleware, deleteUsers);

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Backend is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
