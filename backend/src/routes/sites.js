const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function withOpenTaskCount(site) {
  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM tasks WHERE site_id = ? AND completed = 0')
    .get(site.id);
  return { ...site, openTaskCount: count };
}

// GET /api/sites
router.get('/', (req, res) => {
  const sites = db.prepare('SELECT * FROM sites ORDER BY last_activity DESC').all();
  res.json(sites.map(withOpenTaskCount));
});

// GET /api/sites/:id
router.get('/:id', (req, res) => {
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  res.json(withOpenTaskCount(site));
});

// POST /api/sites
router.post('/', (req, res) => {
  const { name, address, facilityType } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Site name is required' });
  }
  const info = db
    .prepare('INSERT INTO sites (name, address, facility_type, created_by) VALUES (?, ?, ?, ?)')
    .run(name.trim(), address || null, facilityType || null, req.user.id);
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(withOpenTaskCount(site));
});

// PUT /api/sites/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Site not found' });
  const { name, address, facilityType } = req.body || {};
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Site name cannot be empty' });
  }
  db.prepare(
    'UPDATE sites SET name = ?, address = ?, facility_type = ? WHERE id = ?'
  ).run(
    name !== undefined ? name.trim() : existing.name,
    address !== undefined ? address : existing.address,
    facilityType !== undefined ? facilityType : existing.facility_type,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  res.json(withOpenTaskCount(updated));
});

// DELETE /api/sites/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Site not found' });
  db.prepare('DELETE FROM sites WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
