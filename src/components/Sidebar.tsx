import { Role } from '../types';
import { getUser } from '../services/storage';

const MILK_GRADIENT = 'from-blue-800 via-blue-900 to-blue-950';

interface MenuItem {
  id: string;
  label: string;
}

interface MenuConfig {
  title: string;
  accent: string;
  items: MenuItem[];
}

const MENUS: Record<Role, MenuConfig> = {
  supplier: {
    title: 'Supplier',
    accent: MILK_GRADIENT,
    items: [
      { id: 'overview', label: 'Dashboard'       },
      { id: 'simulation', label: 'Simulation'     },
      { id: 'submit',   label: 'Submit Reading'  },
      { id: 'live',     label: 'Live Sensors'    },
      { id: 'records',  label: 'Records'         },
      { id: 'alerts',   label: 'Alerts'          },
      { id: 'reports',  label: 'Reports'         },
      { id: 'search',   label: 'Search'          },
      { id: 'profile',  label: 'Profile'         },
      { id: 'settings', label: 'Settings'        },
    ],
  },
  seller: {
    title: 'Seller',
    accent: MILK_GRADIENT,
    items: [
      { id: 'overview',  label: 'Dashboard'        },
      { id: 'inventory', label: 'Inventory'        },
      { id: 'decision',  label: 'Decision Support' },
      { id: 'trends',    label: 'Trends'           },
      { id: 'records',   label: 'Records'          },
      { id: 'alerts',    label: 'Alerts'           },
      { id: 'reports',   label: 'Reports'          },
      { id: 'search',    label: 'Search'           },
      { id: 'profile',   label: 'Profile'          },
      { id: 'settings',  label: 'Settings'         },
    ],
  },
  admin: {
    title: 'Admin',
    accent: MILK_GRADIENT,
    items: [
      { id: 'overview', label: 'Dashboard'   },
      { id: 'users',    label: 'Users'       },
      { id: 'records',  label: 'All Records' },
      { id: 'alerts',   label: 'Alerts'      },
      { id: 'logs',     label: 'System Logs' },
      { id: 'reports',  label: 'Reports'     },
      { id: 'search',   label: 'Search'      },
      { id: 'settings', label: 'Settings'    },
    ],
  },
};

interface SidebarProps {
  role: Role;
  active: string;
  onSelect: (id: string) => void;
}

export default function Sidebar({ role, active, onSelect }: SidebarProps) {
  const menu = MENUS[role] || MENUS.supplier;
  const user = getUser<{ name?: string; email?: string }>();

  return (
    <aside className={`w-64 min-h-screen bg-gradient-to-b ${menu.accent} text-white shadow-xl flex flex-col`}>
      {/* Header */}
      <div className="px-5 py-5 border-b border-white/10">
        <p className="font-bold text-lg leading-none">{menu.title}</p>
        <p className="text-xs text-white/70 mt-1">Panel</p>
      </div>

      {/* User card */}
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
        <p className="text-xs text-white/70 truncate">{user?.email || ''}</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menu.items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-white text-blue-900 shadow-lg shadow-blue-950/40'
                  : 'text-white/85 hover:bg-white/15'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10 text-xs text-white/60">
        v1.0 · Milk Quality System
      </div>
    </aside>
  );
}
