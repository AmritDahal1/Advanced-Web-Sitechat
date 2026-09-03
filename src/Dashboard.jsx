import { Link } from 'react-router-dom';
import { useFetch } from './useFetch';
import { fetchSites } from './api';
import { useApp } from './AppContext';
import { LoadingSpinner, ErrorMessage, Badge } from './UI';

export default function Dashboard() {
  const { user, notifications, notificationsLoading, notificationsError, loadNotifications } = useApp();
  const { data: sites, loading, error, refetch } = useFetch(fetchSites, []);

  const activeCount = sites?.filter((s) => s.status === 'active').length ?? 0;
  const openTasks = sites?.reduce((sum, s) => sum + s.tasksOpen, 0) ?? 0;
  const unreadMessages = sites?.reduce((sum, s) => sum + s.unreadCount, 0) ?? 0;
  const recentNotifications = notifications.slice(0, 4);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="muted">Here&rsquo;s what&rsquo;s happening across your CleanTasker sites today.</p>
        </div>
      </header>

      {loading && <LoadingSpinner label="Loading dashboard…" />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <section className="stat-grid" aria-label="Key metrics">
            <div className="stat-card">
              <span className="stat-value">{sites.length}</span>
              <span className="stat-label">Total sites</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{activeCount}</span>
              <span className="stat-label">Active sites</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{openTasks}</span>
              <span className="stat-label">Open tasks</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{unreadMessages}</span>
              <span className="stat-label">Unread messages</span>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="panel">
              <div className="panel-header">
                <h2>Your sites</h2>
                <Link to="/dashboard/sites" className="link">View all →</Link>
              </div>
              {sites.length === 0 ? (
                <p className="muted empty-state">No sites yet.</p>
              ) : (
                <ul className="list">
                  {sites.slice(0, 4).map((site) => (
                    <li key={site.id}>
                      <Link to={`/dashboard/sites/${site.id}`} className="list-row">
                        <div>
                          <strong>{site.name}</strong>
                          <p className="muted small">{site.address}</p>
                        </div>
                        <div className="list-row-meta">
                          <Badge status={site.status} />
                          <Badge count={site.unreadCount} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>Recent notifications</h2>
                <Link to="/dashboard/notifications" className="link">View all →</Link>
              </div>
              {notificationsLoading ? (
                <LoadingSpinner label="Loading notifications…" />
              ) : notificationsError ? (
                <ErrorMessage message={notificationsError} onRetry={loadNotifications} />
              ) : recentNotifications.length === 0 ? (
                <p className="muted">No notifications yet.</p>
              ) : (
                <ul className="list">
                  {recentNotifications.map((n) => (
                    <li key={n.id} className={`list-row ${n.read ? '' : 'list-row-unread'}`}>
                      <span aria-hidden="true">{n.type === 'message' ? '💬' : n.type === 'task' ? '✅' : '📋'}</span>
                      <p>{n.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
