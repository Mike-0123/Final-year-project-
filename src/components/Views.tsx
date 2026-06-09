import { useState } from 'react';
import Card from './Card';
import { MilkRecord } from '../types';
import { getUser } from '../services/storage';

interface ReportsViewProps {
  records?: MilkRecord[];
}

export function ReportsView({ records = [] }: ReportsViewProps) {
  const good = records.filter((r) => r.status === 'GOOD').length;
  const bad = records.filter((r) => r.status === 'BAD').length;
  const total = records.length;
  const avgPh = total ? (records.reduce((s, r) => s + (r.ph || 0), 0) / total).toFixed(2) : '—';
  const avgTemp = total ? (records.reduce((s, r) => s + (r.temperature || 0), 0) / total).toFixed(1) : '—';

  const handleExport = () => {
    const csv = [
      ['Time', 'pH', 'Temperature', 'Type', 'Percentage', 'Status'].join(','),
      ...records.map((r) => [
        r.created_at || '',
        r.ph ?? '',
        r.temperature ?? '',
        r.adulteration_type || '',
        r.percentage ?? '',
        r.status || '',
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milk-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Reports</h3>
          <p className="text-sm text-gray-500">Summary of all milk quality records</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-blue-900 hover:bg-blue-950 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><div className="text-sm text-gray-500">Total Records</div><div className="text-2xl font-bold text-gray-800">{total}</div></Card>
        <Card><div className="text-sm text-gray-500">Good</div><div className="text-2xl font-bold text-green-600">{good}</div></Card>
        <Card><div className="text-sm text-gray-500">Bad</div><div className="text-2xl font-bold text-red-600">{bad}</div></Card>
        <Card><div className="text-sm text-gray-500">Avg pH</div><div className="text-2xl font-bold text-blue-900">{avgPh}</div></Card>
        <Card><div className="text-sm text-gray-500">Avg Temp</div><div className="text-2xl font-bold text-blue-900">{avgTemp}°C</div></Card>
      </div>

      <Card title="Quality Breakdown">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Good Quality</span>
              <span className="font-semibold text-green-600">{good} ({total ? Math.round((good / total) * 100) : 0}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${total ? (good / total) * 100 : 0}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Bad Quality</span>
              <span className="font-semibold text-red-600">{bad} ({total ? Math.round((bad / total) * 100) : 0}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${total ? (bad / total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface SearchViewProps {
  records?: MilkRecord[];
}

export function SearchView({ records = [] }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = records.filter((r) => {
    const q = query.toLowerCase();
    const hay = `${r.adulteration_type || ''} ${r.status || ''} ${r.ph || ''} ${r.temperature || ''}`.toLowerCase();
    const matchQ = !q || hay.includes(q);
    const matchS = statusFilter === 'all' || r.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800">Search Records</h3>
        <p className="text-sm text-gray-500">Filter milk quality records by keyword or status</p>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by pH, temperature, adulteration type..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="GOOD">Good only</option>
            <option value="BAD">Bad only</option>
          </select>
        </div>
        <p className="text-xs text-gray-500 mt-3">{filtered.length} of {records.length} records</p>
      </Card>

      <Card title="Results">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Time</th>
                <th className="pb-2 pr-4">pH</th>
                <th className="pb-2 pr-4">Temp (°C)</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">%</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center text-gray-400">No matches</td></tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleTimeString() : '—'}</td>
                    <td className="py-2 pr-4">{r.ph ?? '—'}</td>
                    <td className="py-2 pr-4">{r.temperature ?? '—'}</td>
                    <td className="py-2 pr-4 capitalize">{r.adulteration_type || '—'}</td>
                    <td className="py-2 pr-4">{r.percentage != null ? `${r.percentage}%` : '—'}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === 'GOOD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {r.status || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function ProfileView() {
  const user = getUser<{ name?: string; role?: string; email?: string; id?: number }>();
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800">Profile</h3>
        <p className="text-sm text-gray-500">Your account information</p>
      </div>
      <Card>
        <div className="mb-5">
          <p className="text-xl font-bold text-gray-800">{user?.name || 'User'}</p>
          <p className="text-sm text-gray-500 capitalize">{user?.role || 'user'}</p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-800">{user?.email || '—'}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Role</span>
            <span className="font-medium text-gray-800 capitalize">{user?.role || '—'}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Account ID</span>
            <span className="font-medium text-gray-800">#{user?.id || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="font-medium text-green-600">Active</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function SettingsView() {
  const [notif, setNotif] = useState(true);
  const [alertSound, setAlertSound] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  interface ToggleProps {
    label: string;
    hint: string;
    value: boolean;
    onChange: (val: boolean) => void;
  }

  const Toggle = ({ label, hint, value, onChange }: ToggleProps) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition relative ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800">Settings</h3>
        <p className="text-sm text-gray-500">Manage your preferences</p>
      </div>
      <Card title="Preferences">
        <Toggle label="Push Notifications" hint="Receive alerts when quality drops" value={notif} onChange={setNotif} />
        <Toggle label="Alert Sound"        hint="Play a sound on critical alerts"  value={alertSound} onChange={setAlertSound} />
        <Toggle label="Auto-refresh"       hint="Refresh dashboard data every 5s"  value={autoRefresh} onChange={setAutoRefresh} />
      </Card>
      <Card title="Account">
        <button className="text-sm text-blue-900 font-semibold hover:underline mr-4">Change Password</button>
        <button className="text-sm text-red-600 font-semibold hover:underline">Delete Account</button>
      </Card>
    </div>
  );
}

interface PlaceholderViewProps {
  title: string;
  description: string;
}

export function PlaceholderView({ title, description }: PlaceholderViewProps) {
  return (
    <Card>
      <div className="py-16 text-center">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </Card>
  );
}
