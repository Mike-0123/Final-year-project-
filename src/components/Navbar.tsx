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
  const [localReads, setLocalReads] = useState<Set<number | string>>(new Set());
  const user = getUser<{ role?: string; name?: string }>();
  
  // A notification is unread if it is NOT read in DB and NOT locally marked read
  const unread = notifications.filter((n) => !n.read && !localReads.has(n.id)).length;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {
      // Ignore errors
    }
    clearStorage();
    navigate('/login');
  };

  const handleMarkRead = async (id: number | string) => {
    if (localReads.has(id)) return;
    setLocalReads(prev => new Set(prev).add(id));
    try {
      // Wait for API method to be imported correctly. Oh wait, `markNotificationRead` is not imported!
      // I'll need to make sure to import it.
      const { markNotificationRead } = await import('../services/api');
      await markNotificationRead(id);
    } catch (e) {
      console.error(e);
    }
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
              <div className="absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded-lg shadow-xl z-50 border max-h-[80vh] overflow-y-auto">
                <div className="p-3 border-b font-semibold text-sm flex justify-between items-center">
                  <span>Notifications</span>
                  {unread > 0 && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{unread} New</span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 text-center">No notifications yet</p>
                ) : (
                  notifications.map((n, i) => {
                    const isUnread = !n.read && !localReads.has(n.id);
                    return (
                      <div 
                        key={i} 
                        onClick={() => handleMarkRead(n.id)}
                        className={`p-3 text-sm border-b last:border-0 cursor-pointer transition-colors ${isUnread ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <div className="flex items-start gap-2">
                          {isUnread && <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />}
                          <div className="flex-1">
                            <p className={isUnread ? "font-medium text-gray-900" : "text-gray-600"}>{n.message}</p>
                            {n.created_at && (
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(n.created_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
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
