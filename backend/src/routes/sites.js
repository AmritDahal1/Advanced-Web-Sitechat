const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { parsePositiveInt } = require('./validation');

const router = express.Router();
router.use(requireAuth);

const VALID_STATUSES = ['active', 'paused', 'completed'];

function withOpenTaskCount(site) {
  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM tasks WHERE site_id = ? AND completed = 0')
    .get(site.id);
  const { count: memberCount } = db
    .prepare('SELECT COUNT(*) AS count FROM site_members WHERE site_id = ?')
    .get(site.id);
  return { ...site, openTaskCount: count, memberCount };
}

function withUserUnreadCount(site, userId) {
  const readState = db
    .prepare('SELECT last_read_at FROM site_message_reads WHERE site_id = ? AND user_id = ?')
    .get(site.id, userId);
  const unread = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM messages
      WHERE site_id = ?
        AND user_id != ?
        AND (? IS NULL OR created_at > ?)
    `)
    .get(site.id, userId, readState?.last_read_at || null, readState?.last_read_at || null);
  return { ...site, unreadCount: unread.count };
}

function getMemberIds(memberIds, currentUserId) {
  const ids = Array.isArray(memberIds) ? memberIds : [currentUserId];
  const uniqueIds = [...new Set(ids.map((id) => Number(id)))];
  if (uniqueIds.some((id) => !Number.isInteger(id) || id < 1)) return null;
  if (!uniqueIds.includes(currentUserId)) uniqueIds.push(currentUserId);
  const placeholders = uniqueIds.map(() => '?').join(', ');
  const users = db.prepare(`SELECT id FROM users WHERE id IN (${placeholders})`).all(...uniqueIds);
  return users.length === uniqueIds.length ? uniqueIds : null;
}

// GET /api/sites
router.get('/', (req, res) => {
  const sites = db.prepare('SELECT * FROM sites ORDER BY last_activity DESC').all();
  res.json(sites.map((site) => withUserUnreadCount(withOpenTaskCount(site), req.user.id)));
});

// GET /api/sites/:id
router.get('/:id', (req, res) => {
  const siteId = parsePositiveInt(req.params.id);
  if (siteId === null) return res.status(400).json({ error: 'Invalid site ID' });
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(siteId);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  res.json(withUserUnreadCount(withOpenTaskCount(site), req.user.id));
});

// POST /api/sites
router.post('/', (req, res) => {
  const { name, address, facilityType, status = 'active', memberIds } = req.body || {};
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Site name is required' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid site status' });
  }
  const members = getMemberIds(memberIds, req.user.id);
  if (!members) return res.status(400).json({ error: 'Invalid site member list' });
  const createSite = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO sites (name, address, facility_type, status, created_by) VALUES (?, ?, ?, ?, ?)')
      .run(name.trim(), address || null, facilityType || null, status, req.user.id);
    const addMember = db.prepare('INSERT INTO site_members (site_id, user_id) VALUES (?, ?)');
    members.forEach((userId) => addMember.run(info.lastInsertRowid, userId));
    return info;
  });
  const info = createSite();
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(withOpenTaskCount(site));
});

// PUT /api/sites/:id
router.put('/:id', (req, res) => {
  const siteId = parsePositiveInt(req.params.id);
  if (siteId === null) return res.status(400).json({ error: 'Invalid site ID' });
  const existing = db.prepare('SELECT * FROM sites WHERE id = ?').get(siteId);
  if (!existing) return res.status(404).json({ error: 'Site not found' });
  const { name, address, facilityType, status, memberIds } = req.body || {};
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({ error: 'Site name cannot be empty' });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid site status' });
  }
  const members = memberIds === undefined ? null : getMemberIds(memberIds, req.user.id);
  if (memberIds !== undefined && !members) return res.status(400).json({ error: 'Invalid site member list' });
  const updateSite = db.transaction(() => {
    db.prepare(
      'UPDATE sites SET name = ?, address = ?, facility_type = ?, status = ? WHERE id = ?'
    ).run(
      name !== undefined ? name.trim() : existing.name,
      address !== undefined ? address : existing.address,
      facilityType !== undefined ? facilityType : existing.facility_type,
      status !== undefined ? status : existing.status,
      siteId
    );
    if (members) {
      db.prepare('DELETE FROM site_members WHERE site_id = ?').run(siteId);
      const addMember = db.prepare('INSERT INTO site_members (site_id, user_id) VALUES (?, ?)');
      members.forEach((userId) => addMember.run(siteId, userId));
    }
  });
  updateSite();
  const updated = db.prepare('SELECT * FROM sites WHERE id = ?').get(siteId);
  res.json(withOpenTaskCount(updated));
});

// DELETE /api/sites/:id
router.delete('/:id', (req, res) => {
  const siteId = parsePositiveInt(req.params.id);
  if (siteId === null) return res.status(400).json({ error: 'Invalid site ID' });
  const existing = db.prepare('SELECT * FROM sites WHERE id = ?').get(siteId);
  if (!existing) return res.status(404).json({ error: 'Site not found' });
  db.prepare('DELETE FROM sites WHERE id = ?').run(siteId);
  res.status(204).send();
});

module.exports = router;
