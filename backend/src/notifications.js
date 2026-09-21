const db = require('./db');

const VALID_NOTIFICATION_TYPES = ['message', 'task', 'status', 'system'];

function notifySiteMembers({ siteId, actorId, type, message }) {
  if (!VALID_NOTIFICATION_TYPES.includes(type)) {
    throw new Error('Invalid notification type');
  }
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('Notification message is required');
  }

  const members = db
    .prepare('SELECT user_id FROM site_members WHERE site_id = ? AND user_id != ?')
    .all(siteId, actorId);
  const insert = db.prepare(
    'INSERT INTO notifications (user_id, site_id, message, type) VALUES (?, ?, ?, ?)'
  );
  const createNotifications = db.transaction(() => {
    members.forEach(({ user_id: userId }) => insert.run(userId, siteId, message.trim(), type));
  });
  createNotifications();
}

module.exports = { notifySiteMembers };
