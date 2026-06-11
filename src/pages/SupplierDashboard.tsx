import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import SensorData from '../components/SensorData';
import Alerts from '../components/Alerts';
import LogsTable from '../components/LogsTable';
import { ReportsView, SearchView, ProfileView, SettingsView } from '../components/Views';
import PaymentsView from '../components/PaymentsView';
import { getLiveData, getAllRecords, getAlerts, getNotifications, analyzeMilk } from '../services/api';
import { DEMO_LIVE, DEMO_RECORDS, DEMO_ALERTS, DEMO_NOTIFICATIONS } from '../demo';
import { MilkRecord, AlertItem, NotificationItem, LiveData, SensorReading } from '../types';
import { isDemoMode } from '../services/storage';

const isDemo = isDemoMode;

// ── Milk status badge ────────────────────────────────────────────────────

interface MilkStatusBadgeProps { status: string }

const MilkStatusBadge = ({ status }: MilkStatusBadgeProps) => {
  const good = status === 'GOOD';
  return (
    <div style={{
      borderRadius: 14,
      padding: '24px 28px',
      background: good ? '#eff6ff' : '#fff1f2',
      border: `2px solid ${good ? '#1d4ed8' : '#dc2626'}`,
      textAlign: 'center',
    }}>
      <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>
        Milk Status
      </p>
      <p style={{ fontSize: 38, fontWeight: 900, color: good ? '#1d4ed8' : '#dc2626', lineHeight: 1 }}>
        {status || '—'}
      </p>
      <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
        {good ? 'Milk meets quality standards' : 'Quality issue detected'}
      </p>
    </div>
  );
};

// ── Adulteration card ────────────────────────────────────────────────────

interface AdulterationCardProps {
  type?: string | null;
  percentage?: number | null;
}

const AdulterationCard = ({ type, percentage }: AdulterationCardProps) => (
  <Card title="Adulteration Details">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#64748b', fontSize: 13 }}>Type Detected</span>
        <span style={{ fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{type || 'None'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#64748b', fontSize: 13 }}>Percentage</span>
        <span style={{ fontWeight: 700, fontSize: 16, color: percentage && percentage > 10 ? '#dc2626' : percentage && percentage > 5 ? '#d97706' : '#16a34a' }}>
          {percentage != null ? `${percentage}%` : '0%'}
        </span>
      </div>
      {percentage != null && (
        <div style={{ width: '100%', background: '#e2e8f0', borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(percentage, 100)}%`,
            background: percentage > 10 ? '#dc2626' : percentage > 5 ? '#d97706' : '#16a34a',
            borderRadius: 99, transition: 'width .4s ease',
          }} />
        </div>
      )}
      <p style={{ fontSize: 11, color: '#94a3b8' }}>Detectable types: Water, Salt, Sugar, Chalk</p>
    </div>
  </Card>
);

// ── Spoilage card ────────────────────────────────────────────────────────

interface SpoilageCardProps { hours?: number | null }

const SpoilageCard = ({ hours }: SpoilageCardProps) => (
  <Card title="Spoilage Prediction">
    {hours != null ? (
      <div>
        <p style={{ fontSize: 13, color: '#64748b' }}>Estimated time until spoilage</p>
        <p style={{ fontSize: 26, fontWeight: 800, color: hours <= 2 ? '#dc2626' : hours <= 6 ? '#d97706' : '#16a34a', marginTop: 4 }}>
          {hours} hour{hours !== 1 ? 's' : ''}
        </p>
      </div>
    ) : (
      <p style={{ color: '#94a3b8', fontSize: 13 }}>No prediction available</p>
    )}
  </Card>
);

// ── Explainable AI card ──────────────────────────────────────────────────

interface ExplainableAIProps { reasons?: string[] | string; status: string }

const ExplainableAI = ({ reasons = [], status }: ExplainableAIProps) => {
  const reasonsList = Array.isArray(reasons) ? reasons : (typeof reasons === 'string' ? [reasons] : []);
  
  return (
  <Card title="Why This Result?">
    {reasonsList.length === 0 ? (
      <p style={{ color: '#94a3b8', fontSize: 13 }}>No explanation available</p>
    ) : (
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Milk is <span style={{ color: status === 'GOOD' ? '#16a34a' : '#dc2626', fontWeight: 800 }}>{status}</span> because:
        </p>
        <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {reasonsList.map((r, i) => (
            <li key={i} style={{ fontSize: 13, color: '#64748b' }}>{r}</li>
          ))}
        </ul>
      </div>
    )}
  </Card>
)};

// ── Area chart for last 20 records ───────────────────────────────────────

interface RecordsAreaChartProps { records: MilkRecord[] }

const RecordsAreaChart = ({ records }: RecordsAreaChartProps) => {
  const data = records.slice(-20).map((r, i) => ({
    idx: i + 1,
    ph: r.ph ?? null,
    temperature: r.temperature ?? null,
  }));
  return (
    <div style={{ background: '#ffffff', borderRadius: 12, boxShadow: '0 1px 12px rgba(0,0,0,.07)', padding: '20px 16px' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 14 }}>pH and Temperature — Last 20 Records</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
          <defs>
            <linearGradient id="gPh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#1d4ed8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="idx" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="ph"          stroke="#1d4ed8" fill="url(#gPh)"   strokeWidth={2} name="pH" dot={false} />
          <Area type="monotone" dataKey="temperature" stroke="#dc2626" fill="url(#gTemp)" strokeWidth={2} name="Temp °C" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Submit reading form ──────────────────────────────────────────────────

const FIELDS: { key: keyof SensorReading; label: string; unit: string; min: number; max: number; step: number; placeholder: string }[] = [
  { key: 'ph',          label: 'pH Level',    unit: '',    min: 0,   max: 14,   step: 0.01, placeholder: 'e.g. 6.7' },
  { key: 'temperature', label: 'Temperature', unit: '°C',  min: 0,   max: 100,  step: 0.1,  placeholder: 'e.g. 5.5' },
  { key: 'taste',       label: 'Taste',       unit: '',    min: 0,   max: 1,    step: 1,    placeholder: '0 = bad, 1 = good' },
  { key: 'odor',        label: 'Odor',        unit: '',    min: 0,   max: 1,    step: 1,    placeholder: '0 = bad, 1 = good' },
  { key: 'fat',         label: 'Fat Content', unit: '%',   min: 0,   max: 10,   step: 0.01, placeholder: 'e.g. 3.5' },
  { key: 'turbidity',   label: 'Turbidity',   unit: 'NTU', min: 0,   max: 100,  step: 0.1,  placeholder: 'e.g. 4.2' },
  { key: 'colour',      label: 'Colour',      unit: '',    min: 0,   max: 9999, step: 1,    placeholder: 'e.g. 253' },
];

function SubmitReadingView({ onSuccess }: { onSuccess: () => void }) {
  const empty: SensorReading = { ph: null, temperature: null, taste: null, odor: null, fat: null, turbidity: null, colour: null };
  const [form, setForm]     = useState<SensorReading>(empty);
  const [result, setResult] = useState<MilkRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const handleChange = (key: keyof SensorReading, value: string) => {
    setForm(prev => ({ ...prev, [key]: value === '' ? null : parseFloat(value) }));
  };

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await analyzeMilk(form);
      setResult(res.data);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : 'Submission failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setForm(empty); setResult(null); setError(null); };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card title="Enter Sensor Reading">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.map(({ key, label, unit, min, max, step, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label} {unit && <span className="text-gray-400 text-xs">({unit})</span>}
                </label>
                <input
                  type="number"
                  step={step}
                  min={min}
                  max={max}
                  placeholder={placeholder}
                  value={form[key] ?? ''}
                  onChange={e => handleChange(key, e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 transition"
            >
              {loading ? 'Analyzing...' : 'Analyze Milk'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </form>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <Card title="Analysis Result">
          <div className={`rounded-xl p-4 mb-4 ${result.status === 'GOOD' ? 'bg-blue-50 border-2 border-blue-400' : 'bg-red-50 border-2 border-red-400'}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Result</p>
            <p className={`text-3xl font-extrabold ${result.status === 'GOOD' ? 'text-blue-700' : 'text-red-600'}`}>
              {result.status}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Adulteration Type</span><p className="font-bold capitalize">{result.adulteration_type || 'None'}</p></div>
            <div><span className="text-gray-500">Percentage</span><p className="font-bold">{result.percentage != null ? `${result.percentage}%` : '0%'}</p></div>
          </div>
          {result.reasons && (Array.isArray(result.reasons) ? result.reasons.length > 0 : typeof result.reasons === 'string') && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Reasons:</p>
              <ul className="list-disc pl-5 space-y-1">
                {Array.isArray(result.reasons) 
                  ? result.reasons.map((r, i) => <li key={i} className="text-sm text-gray-600">{r}</li>)
                  : <li className="text-sm text-gray-600">{result.reasons}</li>}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function SupplierDashboard() {
  const [view, setView]                 = useState('overview');
  const [liveData, setLiveData]         = useState<LiveData | null>(null);
  const [records, setRecords]           = useState<MilkRecord[]>([]);
  const [alerts, setAlerts]             = useState<AlertItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    if (isDemo()) {
      setLiveData(DEMO_LIVE);
      setRecords(DEMO_RECORDS);
      setAlerts(DEMO_ALERTS);
      setNotifications(DEMO_NOTIFICATIONS);
      setLastUpdated(new Date());
      return;
    }
    try {
      const [live, recs, alrts, notifs] = await Promise.allSettled([
        getLiveData(), getAllRecords(), getAlerts(), getNotifications(),
      ]);
      if (live.status  === 'fulfilled') setLiveData(live.value.data);
      if (recs.status  === 'fulfilled') setRecords(recs.value.data);
      if (alrts.status === 'fulfilled') setAlerts(alrts.value.data);
      if (notifs.status === 'fulfilled') setNotifications(notifs.value.data);
      setLastUpdated(new Date());
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const demo = liveData || DEMO_LIVE;

  const applySimulation = useCallback((record: MilkRecord) => {
    const liveRecord: LiveData = { ...record, status: record.status || 'GOOD' };
    setLiveData(liveRecord);
    setRecords(current => [record, ...current].slice(0, 30));
    if (record.status === 'BAD') {
      const alert: AlertItem = {
        type: record.adulteration_type || 'Simulation Alert',
        message: `${record.adulteration_type || 'Quality issue'} detected at ${record.percentage ?? 0}% risk`,
        severity: 'HIGH',
      };
      setAlerts(current => [alert, ...current].slice(0, 10));
    }
    setLastUpdated(new Date());
  }, []);

  const submitSimulation = useCallback(async (reading: SensorReading) => {
    const res = await analyzeMilk(reading);
    return res.data;
  }, []);

  const renderView = () => {
    switch (view) {
      case 'overview':
        return (
          <>
            {/* Status + sensor gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 16 }}>
              <MilkStatusBadge status={demo.status} />
              <SensorData data={demo} />
              <AdulterationCard type={demo.adulteration_type} percentage={demo.percentage} />
            </div>

            {/* Area chart */}
            {records.length > 1 && (
              <div style={{ marginBottom: 16 }}>
                <RecordsAreaChart records={records} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 16 }}>
              <ExplainableAI reasons={demo.reasons} status={demo.status} />
              <SpoilageCard />
              <Alerts alerts={alerts} />
            </div>

            <LogsTable records={records} />
          </>
        );
      case 'submit':
        return <SubmitReadingView onSuccess={fetchAll} />;
      case 'payments':
        return <PaymentsView />;
      case 'live':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            <MilkStatusBadge status={demo.status} />
            <SensorData data={demo} />
            <AdulterationCard type={demo.adulteration_type} percentage={demo.percentage} />
            <SpoilageCard />
          </div>
        );
      case 'records':  return <LogsTable records={records} />;
      case 'alerts':   return <Alerts alerts={alerts} />;
      case 'reports':  return <ReportsView records={records} />;
      case 'search':   return <SearchView records={records} />;
      case 'profile':  return <ProfileView />;
      case 'settings': return <SettingsView />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      <Sidebar role="supplier" active={view} onSelect={setView} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar notifications={notifications} title="Supplier Portal" />

        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: '24px 16px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                {view === 'overview' ? 'Supplier Dashboard' : view.charAt(0).toUpperCase() + view.slice(1)}
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Real-time milk quality monitoring</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} className="animate-pulse" />
              Live {lastUpdated && `· ${lastUpdated.toLocaleTimeString()}`}
            </div>
          </div>

          {renderView()}
        </div>
      </div>
    </div>
  );
}
