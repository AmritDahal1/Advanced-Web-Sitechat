const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/users  (safe fields only - never returns password_hash)
router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users').all();
  res.json(users);
});

// PUT /api/users/me
router.put('/me', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }

  const duplicate = db
    .prepare('SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?')
    .get(email, req.user.id);
  if (duplicate) return res.status(409).json({ error: 'An account with this email already exists' });

  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, req.user.id);
  const user = db
    .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  res.json(user);
});

module.exports = router;
