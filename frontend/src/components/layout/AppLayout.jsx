import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { Logo } from './Nav';
import { TopbarSlotContext } from '../../context/topbarSlot';

/**
 * Persistent shell for every signed-in page: full-height sidebar (with the logo) on the left,
 * top bar + routed page on the right. Pages can portal their own header into the top bar
 * via useTopbarSlot() (the group page puts the group name / members / share there).
 */
export default function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [slotEl, setSlotEl] = useState(null);
  const isChat = /^\/groups\/[^/]+/.test(pathname);

  return (
    <div className={`app-shell ${isChat ? 'chat-mode' : ''}`}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-col">
        <header className="topbar">
          {!isChat && (
            <>
              <button className="nav-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <Bars3Icon style={{ width: 18, height: 18 }} />
              </button>
              <span className="topbar-logo"><Logo onClick={() => navigate('/dashboard')} /></span>
            </>
          )}
          <div className="topbar-slot" ref={setSlotEl} />
        </header>
        <div className="app-layout">
          <TopbarSlotContext.Provider value={slotEl}>
            <Outlet />
          </TopbarSlotContext.Provider>
        </div>
        {!isChat && <BottomNav />}
      </div>
    </div>
  );
}