import { Link, useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { Logo } from './UI';

export default function Navbar({ onMenuClick }) {
  const { user, logout, theme, toggleTheme, unreadCount } = useApp();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="icon-btn hide-desktop"
          aria-label="Toggle navigation menu"
          onClick={onMenuClick}
        >
          ☰
        </button>
        <Link to="/dashboard" className="brand">
          <Logo />
          SiteChat
        </Link>
      </div>

      <div className="navbar-right">
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <Link
          to="/dashboard/notifications"
          className="icon-btn notification-link"
          aria-label={`Notifications, ${unreadCount} unread`}
        >
          🔔
          {unreadCount > 0 && <span className="badge badge-count nav-badge">{unreadCount}</span>}
        </Link>

        {user && (
          <div className="user-chip">
            <span className="avatar" style={{ background: user.avatarColor }} aria-hidden="true">
              {user.name.charAt(0)}
            </span>
            <div className="user-chip-meta hide-mobile">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
