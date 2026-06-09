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
import { getAllRecords, getAlerts, getNotifications, getDashboard } from '../services/api';
import { DEMO_RECORDS, DEMO_ALERTS, DEMO_NOTIFICATIONS } from '../demo';
import { MilkRecord, AlertItem, NotificationItem, User } from '../types';
import { isDemoMode } from '../services/storage';

const isDemo = isDemoMode;

// ── Stat card with coloured left border ──────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  borderColor: string;
  sub?: string;
}

const StatCard = ({ label, value, borderColor, sub }: StatCardProps) => (
  <div style={{
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 1px 12px rgba(0,0,0,.07)',
    padding: '20px 22px',
    borderLeft: `4px solid ${borderColor}`,
    display: 'flex', flexDirection: 'column', gap: 4,
  }}>
    <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</p>
    <p style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</p>}
  </div>
);

// ── Users view ──────────────────────────────────────────────────────────

interface UsersViewProps { users: User[] }

const UsersView = ({ users }: UsersViewProps) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-bold text-gray-800">Users</h3>
      <p className="text-sm text-gray-500">Manage system users and roles</p>
    </div>
    <Card title="All Users">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2 pr-4">ID</th>
            <th className="pb-2 pr-4">Email</th>
            <th className="pb-2 pr-4">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan={3} className="py-4 text-center text-gray-400">No users found</td></tr>
          ) : users.map((u) => (
            <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-2 pr-4 text-gray-500">#{u.id}</td>
              <td className="py-2 pr-4 text-gray-600">{u.email}</td>
              <td className="py-2 pr-4">
                <span className="bg-blue-100 text-blue-900 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
                  {u.role?.toLowerCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

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
      const [recs, alrts, notifs, dash] = await Promise.allSettled([
        getAllRecords(), getAlerts(), getNotifications(), getDashboard(),
      ]);
      if (recs.status === 'fulfilled') setRecords(recs.value.data);
      if (alrts.status === 'fulfilled') setAlerts(alrts.value.data);
      if (notifs.status === 'fulfilled') setNotifications(notifs.value.data);
      if (dash.status === 'fulfilled') {
        const d = dash.value.data as { users?: User[] };
        setUsers(d.users ?? []);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const goodCount = records.filter(r => r.status === 'GOOD').length;
  const badCount  = records.filter(r => r.status === 'BAD').length;

  const renderView = () => {
    switch (view) {
      case 'overview':
        return (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16, marginBottom: 20 }}>
              <StatCard label="Total Records" value={records.length} borderColor="#1d4ed8" sub="All time" />
              <StatCard label="Good Quality"  value={goodCount}      borderColor="#16a34a" sub="Passed checks" />
              <StatCard label="Bad Quality"   value={badCount}       borderColor="#dc2626" sub="Failed checks" />
              <StatCard label="Active Alerts" value={alerts.length}  borderColor="#d97706" sub="Unresolved" />
            </div>

            <OverviewCharts records={records} goodCount={goodCount} badCount={badCount} />

            <div className="mb-4"><Alerts alerts={alerts} /></div>
            <LogsTable records={records} />
          </>
        );
      case 'users':    return <UsersView users={users} />;
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
