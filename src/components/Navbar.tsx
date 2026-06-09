import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import { NotificationItem } from '../types';
import { getUser, clearStorage } from '../services/storage';

interface NavbarProps {
  notifications?: NotificationItem[];
  title?: string;
}

export default function Navbar({ notifications = [], title }: NavbarProps) {
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const user = getUser<{ role?: string; name?: string }>();
  const unread = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {
      // Ignore errors
    }
    clearStorage();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-900 text-white shadow-md border-b border-blue-950">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tracking-wide">
            {title || 'Milk Quality Detection'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm capitalize hidden sm:block">
            {user?.role || 'user'} — {user?.name || ''}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative px-3 py-1.5 rounded-md hover:bg-blue-800 transition text-sm font-medium"
            >
              Notifications
              {unread > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unread}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded-lg shadow-xl z-50 border">
                <div className="p-3 border-b font-semibold text-sm">Notifications</div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">No notifications</p>
                ) : (
                  notifications.slice(0, 5).map((n, i) => (
                    <div key={i} className={`p-3 text-sm border-b last:border-0 ${!n.read ? 'bg-blue-50' : ''}`}>
                      {n.message}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="bg-white text-blue-900 text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-blue-50 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
