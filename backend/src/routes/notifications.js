const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/notifications  (current user's notifications)
router.get('/', (req, res) => {
  const notifications = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(notifications);
});

// PUT /api/notifications/read-all
router.put('/read-all', (req, res) => {
  const result = db
    .prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0')
    .run(req.user.id);
  res.json({ updatedCount: result.changes });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Notification not found' });
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ...existing, read: 1 });
});

// DELETE /api/notifications/:id
router.delete('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Notification not found' });
  db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
