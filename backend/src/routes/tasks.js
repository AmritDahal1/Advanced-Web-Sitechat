const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const VALID_PRIORITIES = ['High', 'Medium', 'Low'];

// GET /api/sites/:siteId/tasks
router.get('/sites/:siteId/tasks', (req, res) => {
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE site_id = ? ORDER BY created_at DESC')
    .all(req.params.siteId);
  res.json(tasks);
});

// POST /api/sites/:siteId/tasks
router.post('/sites/:siteId/tasks', (req, res) => {
  const site = db.prepare('SELECT id FROM sites WHERE id = ?').get(req.params.siteId);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const { text, priority, assignee } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Task text is required' });
  }
  const pr = VALID_PRIORITIES.includes(priority) ? priority : 'Medium';
  const info = db
    .prepare(
      'INSERT INTO tasks (site_id, text, priority, assignee, created_by) VALUES (?, ?, ?, ?, ?)'
    )
    .run(req.params.siteId, text.trim(), pr, assignee || null, req.user.id);

  db.prepare('UPDATE sites SET last_activity = datetime(\'now\') WHERE id = ?').run(req.params.siteId);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(task);
});

// PUT /api/tasks/:id  (toggle complete / edit)
router.put('/tasks/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const { text, priority, assignee, completed } = req.body || {};
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority value' });
  }
  db.prepare(
    'UPDATE tasks SET text = ?, priority = ?, assignee = ?, completed = ? WHERE id = ?'
  ).run(
    text !== undefined ? text.trim() : existing.text,
    priority !== undefined ? priority : existing.priority,
    assignee !== undefined ? assignee : existing.assignee,
    completed !== undefined ? (completed ? 1 : 0) : existing.completed,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// PUT /api/tasks/:id/toggle  (flip completed server-side, avoids race conditions)
router.put('/tasks/:id/toggle', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });
  const next = existing.completed ? 0 : 1;
  db.prepare('UPDATE tasks SET completed = ? WHERE id = ?').run(next, req.params.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});

// DELETE /api/tasks/:id
router.delete('/tasks/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
