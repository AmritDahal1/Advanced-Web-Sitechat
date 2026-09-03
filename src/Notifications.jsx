import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from './AppContext';
import { LoadingSpinner } from './UI';

const TYPE_ICON = { message: '💬', task: '✅', status: '📋' };

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function Notifications() {
  const { notifications, notificationsLoading, markRead, markAllRead } = useApp();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const visibleNotifications = useMemo(
    () => (showUnreadOnly ? notifications.filter((n) => !n.read) : notifications),
    [notifications, showUnreadOnly]
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="muted">Stay on top of chat activity, tasks, and site status changes.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={markAllRead}>
          Mark all as read
        </button>
      </header>

      <div className="toolbar">
        <label className="toggle-field">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
          />
          Show unread only
        </label>
      </div>

      {notificationsLoading && <LoadingSpinner label="Loading notifications…" />}

      {!notificationsLoading && visibleNotifications.length === 0 && (
        <p className="muted empty-state">You&rsquo;re all caught up!</p>
      )}

      {!notificationsLoading && visibleNotifications.length > 0 && (
        <ul className="notification-list">
          {visibleNotifications.map((n) => (
            <li key={n.id} className={`notification-item ${n.read ? '' : 'notification-item-unread'}`}>
              <span aria-hidden="true" className="notification-icon">{TYPE_ICON[n.type] || '🔔'}</span>
              <div className="notification-body">
                <p>{n.text}</p>
                <div className="notification-meta">
                  <time dateTime={n.time}>{formatTime(n.time)}</time>
                  {n.siteId && (
                    <Link to={`/dashboard/sites/${n.siteId}`} className="link">Open site →</Link>
                  )}
                </div>
              </div>
              {!n.read && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => markRead(n.id)}>
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
