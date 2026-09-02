import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/dashboard/sites', label: 'Sites', icon: '🏢' },
  { to: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/dashboard/profile', label: 'Profile & Settings', icon: '⚙️' }
];

export default function Sidebar({ isOpen, onNavigate }) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} aria-label="Primary">
      <nav>
        <ul>
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                onClick={onNavigate}
                className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              >
                <span aria-hidden="true">{link.icon}</span>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <p>SiteChat v1.0</p>
        <p>ICT930 · MIT ACT Crennotech</p>
      </div>
    </aside>
  );
}
