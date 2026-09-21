const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const MAX_ATTACHMENT_DATA_URL_BYTES = 5 * 1024 * 1024;
const IMAGE_DATA_URL_PATTERN = /^data:image\/(?:png|jpe?g|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/i;

// GET /api/sites/:siteId/messages
router.get('/sites/:siteId/messages', (req, res) => {
  const site = db.prepare('SELECT id FROM sites WHERE id = ?').get(req.params.siteId);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  const messages = db
    .prepare('SELECT * FROM messages WHERE site_id = ? ORDER BY created_at ASC')
    .all(req.params.siteId);
  res.json(messages);
});

// POST /api/sites/:siteId/messages
router.post('/sites/:siteId/messages', (req, res) => {
  const site = db.prepare('SELECT id FROM sites WHERE id = ?').get(req.params.siteId);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const { text, attachmentDataUrl } = req.body || {};
  const messageText = typeof text === 'string' ? text.trim() : '';
  const attachment = attachmentDataUrl || null;
  if (!messageText && !attachment) {
    return res.status(400).json({ error: 'Message must contain text or an attachment' });
  }
  if (attachment && (
    typeof attachment !== 'string' ||
    Buffer.byteLength(attachment, 'utf8') > MAX_ATTACHMENT_DATA_URL_BYTES ||
    !IMAGE_DATA_URL_PATTERN.test(attachment)
  )) {
    return res.status(400).json({ error: 'Attachment must be a valid PNG, JPEG, GIF, or WebP image under 5MB' });
  }
  const info = db
    .prepare(
      'INSERT INTO messages (site_id, user_id, sender_name, text, attachment_data_url) VALUES (?, ?, ?, ?, ?)'
    )
    .run(req.params.siteId, req.user.id, req.user.name, messageText || null, attachment);

  db.prepare('UPDATE sites SET last_activity = datetime(\'now\') WHERE id = ?').run(req.params.siteId);
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(message);
});

// PUT /api/messages/:id/react  (toggle current user's reaction on a message)
router.put('/messages/:id/react', (req, res) => {
  const existing = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Message not found' });

  const reactions = JSON.parse(existing.reactions || '[]');
  const uid = req.user.id;
  const next = reactions.includes(uid) ? reactions.filter((id) => id !== uid) : [...reactions, uid];

  db.prepare('UPDATE messages SET reactions = ? WHERE id = ?').run(JSON.stringify(next), req.params.id);
  const updated = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
