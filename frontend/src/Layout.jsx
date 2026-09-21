import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Toast } from './UI';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButtonRef = useRef(null);

  function closeSidebar() {
    setSidebarOpen(false);
    menuButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') closeSidebar();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="app-shell">
      <Navbar
        menuOpen={sidebarOpen}
        menuButtonRef={menuButtonRef}
        onMenuClick={() => (sidebarOpen ? closeSidebar() : setSidebarOpen(true))}
      />
      <div className="app-body">
        <Sidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />
        {sidebarOpen && (
          <div
            className="sidebar-scrim hide-desktop"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
        <main className="app-content" id="main-content">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}
