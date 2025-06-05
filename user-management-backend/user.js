const pool = require('./db');
const { authMiddleware } = require('./auth');

const getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, last_login, status FROM users ORDER BY last_login DESC');
    res.json(rows);
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const blockUsers = async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Please provide userIds' });
  }
  try {
    await pool.query(
      'UPDATE users SET status = $1 WHERE id = ANY($2::int[]) AND status = $3',
      ['blocked', userIds, 'active']
    );
    res.json({ message: 'Users blocked successfully' });
  } catch (err) {
    console.error('Block users error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const unblockUsers = async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Please provide userIds' });
  }
  try {
    await pool.query(
      'UPDATE users SET status = $1 WHERE id = ANY($2::int[]) AND status = $3',
      ['active', userIds, 'blocked']
    );
    res.json({ message: 'Users unblocked successfully' });
  } catch (err) {
    console.error('Unblock users error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUsers = async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Please provide userIds' });
  }
  try {
    await pool.query(
      'DELETE FROM users WHERE id = ANY($1::int[])',
      [userIds]
    );
    res.json({ message: 'Users deleted successfully' });
  } catch (err) {
    console.error('Delete users error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUsers: [authMiddleware, getUsers], blockUsers: [authMiddleware, blockUsers], unblockUsers: [authMiddleware, unblockUsers], deleteUsers: [authMiddleware, deleteUsers] };
