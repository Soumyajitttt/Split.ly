import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Nav from './Nav';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

/**
 * Persistent shell for every signed-in page. The nav and sidebar stay mounted while
 * the routed page (<Outlet />) swaps, so only the page content ever shows loading state.
 */
export default function AppLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isChat = /^\/groups\/[^/]+/.test(pathname);

  return (
    <div
      className={`app-page ${isChat ? 'chat-page' : ''}`}
      style={isChat ? undefined : { display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      <Nav showMenu onMenuClick={() => setSidebarOpen(true)} />
      <div className="app-layout">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Outlet />
      </div>
      {!isChat && <BottomNav />}
    </div>
  );
}