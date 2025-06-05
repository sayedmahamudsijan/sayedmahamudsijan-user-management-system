const pool = require('./db');
const { authMiddleware } = require('./auth');

const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, last_login, status FROM users ORDER BY last_login DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const blockUsers = async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Please provide userIds' });
  }
  try {
    for (const userId of userIds) {
      await pool.query('UPDATE users SET status = "blocked" WHERE id = ? AND status = "active"', [userId]);
    }
    res.json({ message: 'Users blocked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const unblockUsers = async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Please provide userIds' });
  }
  try {
    for (const userId of userIds) {
      await pool.query('UPDATE users SET status = "active" WHERE id = ? AND status = "blocked"', [userId]);
    }
    res.json({ message: 'Users unblocked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUsers = async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Please provide userIds' });
  }
  try {
    for (const userId of userIds) {
      await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    }
    res.json({ message: 'Users deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUsers: [authMiddleware, getUsers], blockUsers: [authMiddleware, blockUsers], unblockUsers: [authMiddleware, unblockUsers], deleteUsers: [authMiddleware, deleteUsers] };