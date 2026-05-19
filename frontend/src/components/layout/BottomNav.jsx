import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, UserGroupIcon as UserGroupIconSolid } from '@heroicons/react/24/solid';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const items = [
    {
      path: '/dashboard',
      icon: HomeIcon,
      iconActive: HomeIconSolid,
      label: 'Home',
    },
    {
      path: '/groups',
      icon: UserGroupIcon,
      iconActive: UserGroupIconSolid,
      label: 'Groups',
    },
  ];

  return (
    <div className="bottom-nav">
      <div className="bottom-nav-items">
        {items.map(item => {
          const active = isActive(item.path);
          const Icon = active ? item.iconActive : item.icon;
          return (
            <div
              key={item.path}
              className={`bottom-nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon style={{ width: 22, height: 22 }} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}