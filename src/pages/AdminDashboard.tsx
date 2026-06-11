import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import LogsTable from '../components/LogsTable';
import Alerts from '../components/Alerts';
import { ReportsView, SearchView, SettingsView } from '../components/Views';
import DeviceManagement from '../components/DeviceManagement';
import { getAllRecords, getAlerts, getNotifications, getDashboard, getUsers, createUser, updateUser, deleteUser, analyzeMilk } from '../services/api';
import { DEMO_RECORDS, DEMO_ALERTS, DEMO_NOTIFICATIONS } from '../demo';
import { MilkRecord, AlertItem, NotificationItem, User, SensorReading } from '../types';
import { isDemoMode } from '../services/storage';

const isDemo = isDemoMode;

// ── Premium Stat Card ──────────────────────────────────────────────────

interface PremiumStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  gradientFrom: string;
  gradientTo: string;
}

const PremiumStatCard = ({ title, value, subtitle, icon, gradientFrom, gradientTo }: PremiumStatCardProps) => (
  <div style={{
    background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
    borderRadius: 24,
    padding: '28px 24px',
    color: '#fff',
    boxShadow: `0 12px 30px -8px ${gradientFrom}80`,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 160,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'default',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-6px)';
    e.currentTarget.style.boxShadow = `0 20px 40px -10px ${gradientFrom}90`;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = `0 12px 30px -8px ${gradientFrom}80`;
  }}
  >
    <div style={{
      position: 'absolute', top: -20, right: -20, opacity: 0.15, 
      transform: 'rotate(-15deg)', fontSize: 110, userSelect: 'none'
    }}>
      {icon}
    </div>
    
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 700, opacity: 0.95, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</p>
        <div style={{ fontSize: 24, opacity: 0.9, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>{icon}</div>
      </div>
      <h3 style={{ fontSize: 42, fontWeight: 900, margin: 0, lineHeight: 1.1, letterSpacing: '-1px', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>{value}</h3>
      {subtitle && <p style={{ fontSize: 13, opacity: 0.85, marginTop: 10, fontWeight: 500 }}>{subtitle}</p>}
    </div>
  </div>
);

// ── Users view ──────────────────────────────────────────────────────────

interface UsersViewProps {
  users: User[];
  onRefresh: () => void;
}

const UsersView = ({ users, onRefresh }: UsersViewProps) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ email: '', role: 'SUPPLIER', password: '' });
  const [loading, setLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setForm({ email: '', role: 'SUPPLIER', password: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setForm({ email: user.email, role: (user.role?.toUpperCase() || 'SUPPLIER'), password: '' });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        onRefresh();
      } catch (err) {
        alert('Failed to delete user.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        const payload: any = { email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await updateUser(editingUser.id!, payload);
      } else {
        await createUser({ ...form, username: form.email.split('@')[0] } as any);
      }
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Operation failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Users</h3>
          <p className="text-sm text-gray-500">Manage system users and roles</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
          + Add User
        </button>
      </div>
      <Card title="All Users">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-4">ID</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Role</th>
              <th className="pb-2 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={4} className="py-4 text-center text-gray-400">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 pr-4 text-gray-500">#{u.id}</td>
                <td className="py-2 pr-4 text-gray-600">{u.email}</td>
                <td className="py-2 pr-4">
                  <span className="bg-blue-100 text-blue-900 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
                    {u.role?.toLowerCase()}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right space-x-2">
                  <button onClick={() => handleOpenEdit(u)} className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 bg-blue-50 rounded transition">Edit</button>
                  <button onClick={() => handleDelete(u.id!)} className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1 bg-red-50 rounded transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4 text-gray-900">{editingUser ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm bg-white outline-none transition">
                  <option value="SUPPLIER">Supplier</option>
                  <option value="SELLER">Seller</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && <span className="text-xs text-gray-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <input type="password" required={!editingUser} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm outline-none transition" placeholder="••••••••" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition shadow-md hover:shadow-lg">
                  {loading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── System logs view ─────────────────────────────────────────────────────

interface LogEntry {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  msg: string;
}

const SystemLogsView = () => {
  const logs: LogEntry[] = [
    { time: '12:42:01', level: 'INFO',  msg: 'Sensor stream connected'             },
    { time: '12:40:33', level: 'WARN',  msg: 'High temperature spike detected'     },
    { time: '12:39:18', level: 'INFO',  msg: 'User supplier@milk.rw logged in'     },
    { time: '12:35:09', level: 'ERROR', msg: 'Adulteration model latency > 500ms'  },
    { time: '12:31:55', level: 'INFO',  msg: 'Daily report generated successfully' },
    { time: '12:28:42', level: 'INFO',  msg: 'Backup completed'                    },
  ];
  const color = (lvl: string) =>
    lvl === 'ERROR' ? 'bg-red-100 text-red-700'
    : lvl === 'WARN' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-blue-100 text-blue-900';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800">System Logs</h3>
        <p className="text-sm text-gray-500">Recent system events and errors</p>
      </div>
      <Card>
        <div className="space-y-2">
          {logs.map((l, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
              <span className="text-xs text-gray-400 font-mono w-20">{l.time}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color(l.level)}`}>{l.level}</span>
              <span className="text-sm text-gray-700 flex-1">{l.msg}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────

/** Group records by date and count good/bad per day */
function buildDailyData(records: MilkRecord[]) {
  const map: Record<string, { date: string; Good: number; Bad: number }> = {};
  records.forEach(r => {
    const date = r.created_at ? r.created_at.slice(0, 10) : 'Unknown';
    if (!map[date]) map[date] = { date, Good: 0, Bad: 0 };
    if (r.status === 'GOOD') map[date].Good += 1;
    else map[date].Bad += 1;
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
}

const PIE_COLORS = ['#1d4ed8', '#dc2626'];

// ── Overview charts ──────────────────────────────────────────────────────

interface OverviewChartsProps {
  records: MilkRecord[];
  goodCount: number;
  badCount: number;
}

const OverviewCharts = ({ records, goodCount, badCount }: OverviewChartsProps) => {
  const dailyData = buildDailyData(records);
  const pieData = [
    { name: 'Good', value: goodCount },
    { name: 'Bad', value: badCount },
  ];

  // Mock data for Supplier Comparison since backend doesn't provide supplier quality aggregations yet
  const supplierData = [
    { name: 'SUP-102', volume: 1450, quality: 92 },
    { name: 'SUP-088', volume: 1120, quality: 85 },
    { name: 'SUP-144', volume: 980,  quality: 98 },
    { name: 'SUP-051', volume: 840,  quality: 74 },
    { name: 'SUP-201', volume: 650,  quality: 89 },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 20, marginBottom: 20 }}>
      {/* Bar chart */}
      <div style={{ background: '#ffffff', borderRadius: 12, boxShadow: '0 1px 12px rgba(0,0,0,.07)', padding: '20px 16px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 14 }}>Daily Good vs Bad</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dailyData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Good" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Bad"  fill="#dc2626" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart */}
      <div style={{ background: '#ffffff', borderRadius: 12, boxShadow: '0 1px 12px rgba(0,0,0,.07)', padding: '20px 16px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 14 }}>Good vs Bad Ratio</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Supplier Comparison chart */}
      <div style={{ background: '#ffffff', borderRadius: 12, boxShadow: '0 1px 12px rgba(0,0,0,.07)', padding: '20px 16px', gridColumn: '1 / -1' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 14 }}>Top Suppliers (Volume & Quality Est.)</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={supplierData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="volume" name="Volume (L)" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
            <Bar yAxisId="right" dataKey="quality" name="Avg Quality Score" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [view, setView] = useState('overview');
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const fetchAll = useCallback(async () => {
    if (isDemo()) {
      setRecords(DEMO_RECORDS);
      setAlerts(DEMO_ALERTS);
      setNotifications(DEMO_NOTIFICATIONS);
      return;
    }
    try {
      const [recs, alrts, notifs, _, usrs] = await Promise.allSettled([
        getAllRecords(), getAlerts(), getNotifications(), getDashboard(), getUsers(),
      ]);
      if (recs.status === 'fulfilled') setRecords(recs.value.data);
      if (alrts.status === 'fulfilled') setAlerts(alrts.value.data);
      if (notifs.status === 'fulfilled') setNotifications(notifs.value.data);
      if (usrs.status === 'fulfilled') setUsers(usrs.value.data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const applySimulation = useCallback((record: MilkRecord) => {
    setRecords(current => [record, ...current].slice(0, 30));
  }, []);

  const submitSimulation = useCallback(async (reading: SensorReading) => {
    const res = await analyzeMilk(reading);
    return res.data;
  }, []);

  const goodCount = records.filter(r => r.status === 'GOOD').length;
  const badCount  = records.filter(r => r.status === 'BAD').length;

  const renderView = () => {
    switch (view) {
      case 'overview':
        return (
          <>
            {/* Premium Dashboard Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
              <PremiumStatCard 
                title="Milk Status" 
                value={goodCount >= badCount ? 'Good' : 'Critical'} 
                subtitle={goodCount >= badCount ? 'Meeting quality standards' : 'High adulteration rate'}
                gradientFrom="#0ea5e9" gradientTo="#2563eb"
                icon="🥛"
              />
              <PremiumStatCard 
                title="Milk Quantity" 
                value="850 L" 
                subtitle="Total collected today"
                gradientFrom="#8b5cf6" gradientTo="#6d28d9"
                icon="📊"
              />
              <PremiumStatCard 
                title="Alerts Today" 
                value={alerts.length} 
                subtitle="Requires attention"
                gradientFrom="#f59e0b" gradientTo="#d97706"
                icon="⚠️"
              />
              <PremiumStatCard 
                title="Adulterated" 
                value={badCount} 
                subtitle="Failed samples"
                gradientFrom="#ef4444" gradientTo="#b91c1c"
                icon="❌"
              />
              <PremiumStatCard 
                title="Active Sensors" 
                value="7" 
                subtitle="All systems online"
                gradientFrom="#10b981" gradientTo="#047857"
                icon="📡"
              />
            </div>

            <OverviewCharts records={records} goodCount={goodCount} badCount={badCount} />

            <div className="mb-4"><Alerts alerts={alerts} /></div>
            <LogsTable records={records} />
          </>
        );
      case 'users':    return <UsersView users={users} onRefresh={fetchAll} />;
      case 'devices':  return <DeviceManagement />;
      case 'records':  return <LogsTable records={records} />;
      case 'alerts':   return <Alerts alerts={alerts} />;
      case 'logs':     return <SystemLogsView />;
      case 'reports':  return <ReportsView records={records} />;
      case 'search':   return <SearchView records={records} />;
      case 'settings': return <SettingsView />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      <Sidebar role="admin" active={view} onSelect={setView} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar notifications={notifications} title="Admin Portal" />

        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: '24px 16px', flex: 1 }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
              {view === 'overview' ? 'Admin Dashboard' : view.charAt(0).toUpperCase() + view.slice(1)}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>System performance and user management</p>
          </div>

          {renderView()}
        </div>
      </div>
    </div>
  );
}
