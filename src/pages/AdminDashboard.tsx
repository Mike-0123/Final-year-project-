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

const RoleBadge = ({ role }: { role: string }) => {
  const normalizedRole = role?.toLowerCase() || 'supplier';

  const styles: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    seller: 'bg-blue-100 text-blue-700 border-blue-200',
    supplier: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  const style = styles[normalizedRole] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${style} uppercase tracking-wider`}>
      {normalizedRole}
    </span>
  );
};

const getInitials = (email: string) => {
  if (!email) return 'U';
  return email.charAt(0).toUpperCase();
};

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
    <div className="space-y-6 relative animate-fade-in-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl shadow-inner">
            👥
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">User Management</h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Manage system access, roles, and user accounts</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New User
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">User Details</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-4xl mb-3">📭</span>
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-sm border border-white">
                        {getInitials(u.email)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{u.email}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">ID: #{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <RoleBadge role={u.role || 'supplier'} />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-sm font-medium text-gray-600">Active</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
                        title="Edit User"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(u.id!)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center"
                        title="Delete User"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Section */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-modal-pop">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h3 className="text-2xl font-bold">{editingUser ? 'Edit User Profile' : 'Create New User'}</h3>
              <p className="text-blue-100 text-sm mt-1">
                {editingUser ? 'Update role or reset password' : 'Add a new member to the system'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">System Role</label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full appearance-none border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 text-sm bg-white outline-none transition-all font-medium text-gray-700"
                  >
                    <option value="SUPPLIER">👨‍🌾 Supplier</option>
                    <option value="SELLER">🏪 Seller</option>
                    <option value="ADMIN">🛡️ Admin</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex justify-between items-center">
                  <span>Password</span>
                  {editingUser && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-medium">Optional</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    required={!editingUser}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                    placeholder={editingUser ? "Leave blank to keep current" : "••••••••"}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors focus:ring-4 focus:ring-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-70 transition-all shadow-lg hover:shadow-blue-500/30 focus:ring-4 focus:ring-blue-500/40 relative overflow-hidden flex justify-center items-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
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
    { time: '12:42:01', level: 'INFO', msg: 'Sensor stream connected' },
    { time: '12:40:33', level: 'WARN', msg: 'High temperature spike detected' },
    { time: '12:39:18', level: 'INFO', msg: 'User supplier@milk.rw logged in' },
    { time: '12:35:09', level: 'ERROR', msg: 'Adulteration model latency > 500ms' },
    { time: '12:31:55', level: 'INFO', msg: 'Daily report generated successfully' },
    { time: '12:28:42', level: 'INFO', msg: 'Backup completed' },
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
    { name: 'SUP-144', volume: 980, quality: 98 },
    { name: 'SUP-051', volume: 840, quality: 74 },
    { name: 'SUP-201', volume: 650, quality: 89 },
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
            <Bar dataKey="Bad" fill="#dc2626" radius={[3, 3, 0, 0]} />
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
      setNotifications(DEMO_NOTIFICATIONS as any);
      return;
    }
    try {
      const [recs, alrts, notifs, , usrs] = await Promise.allSettled([
        getAllRecords(), getAlerts(), getNotifications(), getDashboard(), getUsers(),
      ]);
      if (recs.status === 'fulfilled') setRecords(recs.value.data);
      if (alrts.status === 'fulfilled') setAlerts(alrts.value.data);
      if (notifs.status === 'fulfilled') setNotifications(notifs.value.data);
      if (usrs.status === 'fulfilled') setUsers(usrs.value.data);
    } catch (_) { }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);


  const goodCount = records.filter(r => r.status === 'GOOD').length;
  const badCount = records.filter(r => r.status === 'BAD').length;

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
      case 'users': return <UsersView users={users} onRefresh={fetchAll} />;
      case 'devices': return <DeviceManagement />;
      case 'records': return <LogsTable records={records} />;
      case 'alerts': return <Alerts alerts={alerts} />;
      case 'logs': return <SystemLogsView />;
      case 'reports': return <ReportsView records={records} />;
      case 'search': return <SearchView records={records} />;
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
