import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Alerts from '../components/Alerts';
import LogsTable from '../components/LogsTable';
import { ReportsView, SearchView, ProfileView, SettingsView } from '../components/Views';
import IntakeForm from '../components/IntakeForm';
import {
  getLiveData, getAllRecords, getAlerts, getNotifications, getBatches,
  getTanks, sellMilk, getSuppliers, requestRestock
} from '../services/api';
import { DEMO_LIVE, DEMO_RECORDS, DEMO_ALERTS, DEMO_NOTIFICATIONS, DEMO_BATCHES } from '../demo';
import { MilkRecord, AlertItem, NotificationItem, Batch, LiveData, StorageTank } from '../types';
import { isDemoMode } from '../services/storage';

const isDemo = isDemoMode;

// ── Decision card — large SELL / REJECT ──────────────────────────────────

interface DecisionCardProps { status: string }

const DecisionCard = ({ status }: DecisionCardProps) => {
  const sell = status === 'GOOD';
  return (
    <div style={{
      borderRadius: 16,
      padding: '32px 28px',
      background: sell ? '#eff6ff' : '#fff1f2',
      border: `2px solid ${sell ? '#1d4ed8' : '#dc2626'}`,
      textAlign: 'center',
    }}>
      <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8, fontWeight: 'bold' }}>
        Live Intake Quality Scan
      </p>
      <p style={{ fontSize: 48, fontWeight: 900, color: sell ? '#1d4ed8' : '#dc2626', lineHeight: 1, marginBottom: 8 }}>
        {sell ? 'SELL' : 'REJECT'}
      </p>
      <p style={{ fontSize: 13, color: '#64748b' }}>
        {sell ? 'Milk meets quality standards' : 'Milk does not meet standards'}
      </p>
    </div>
  );
};

// ── Adulteration summary with progress bar ───────────────────────────────

interface AdulterationSummaryProps {
  type?: string | null;
  percentage?: number | null;
}

const AdulterationSummary = ({ type, percentage }: AdulterationSummaryProps) => (
  <Card title="Adulteration Summary">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {type ? (
        <>
          <div style={{
            borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600,
            background: percentage && percentage > 10 ? '#fff1f2' : '#fefce8',
            color: percentage && percentage > 10 ? '#dc2626' : '#d97706',
          }}>
            {type} detected ({percentage}%)
          </div>
          <div style={{ width: '100%', background: '#e2e8f0', borderRadius: 99, height: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(percentage || 0, 100)}%`,
              background: percentage && percentage > 10 ? '#dc2626' : '#d97706',
              borderRadius: 99, transition: 'width .4s ease',
            }} />
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>{percentage}% contamination level</p>
        </>
      ) : (
        <div style={{ borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, background: '#eff6ff', color: '#1d4ed8' }}>
          No adulteration detected
        </div>
      )}
    </div>
  </Card>
);

// ── Decision support card ────────────────────────────────────────────────

interface DecisionSupportProps { data?: LiveData | null }

const DecisionSupport = ({ data }: DecisionSupportProps) => {
  if (!data) return null;
  const sell = data.status === 'GOOD';
  return (
    <Card title="Decision Support">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Recommendation:</p>
        <p style={{ fontWeight: 700, color: sell ? '#1d4ed8' : '#dc2626', fontSize: 14 }}>
          {sell ? 'You may sell this milk' : 'Do NOT sell this milk'}
        </p>
        {!sell && data.reasons && (Array.isArray(data.reasons) ? data.reasons : [data.reasons]).map((r: string, i: number) => (
          <p key={i} style={{ fontSize: 12, color: '#dc2626' }}>{r}</p>
        ))}
        {data.adulteration_type && (
          <p style={{ fontSize: 12, color: '#d97706' }}>Reduce {data.adulteration_type} contamination</p>
        )}
      </div>
    </Card>
  );
};

// ── Inventory view ───────────────────────────────────────────────────────

const TanksManager = ({ tanks, suppliers, onUpdate }: { tanks: StorageTank[], suppliers: any[], onUpdate: () => void }) => {
  const [sellTankId, setSellTankId] = useState<number | ''>('');
  const [sellQty, setSellQty] = useState('');
  const [restockSupplierId, setRestockSupplierId] = useState<number | ''>('');
  const [restockMessage, setRestockMessage] = useState('');
  
  const [newTankName, setNewTankName] = useState('');
  const [newTankCapacity, setNewTankCapacity] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSell = async () => {
    if (!sellTankId || !sellQty) return;
    try {
      await import('../services/api').then(m => m.sellMilk(Number(sellTankId), Number(sellQty)));
      setSellQty('');
      onUpdate();
    } catch (e) { alert("Failed to sell milk"); }
  };
  
  const handleRestock = async () => {
    if (!restockSupplierId) return;
    try {
      await import('../services/api').then(m => m.requestRestock(Number(restockSupplierId), restockMessage));
      alert('Restock requested!');
      setRestockMessage('');
      onUpdate();
    } catch (e) { alert("Failed to request restock"); }
  };

  const handleCreateTank = async () => {
    if (!newTankName || !newTankCapacity) return;
    try {
      await import('../services/api').then(m => m.createTank({
        name: newTankName,
        capacity: Number(newTankCapacity),
        current_level: 0
      }));
      setNewTankName('');
      setNewTankCapacity('');
      setIsAdding(false);
      onUpdate();
    } catch (e) { alert("Failed to create tank"); }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Storage Tanks</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
        >
          {isAdding ? 'Cancel' : '+ Add Tank'}
        </button>
      </div>

      {isAdding && (
        <div className="flex gap-3 items-end bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-blue-900 mb-1">Tank Name</label>
            <input type="text" placeholder="e.g. Tank A" value={newTankName} onChange={e => setNewTankName(e.target.value)} className="w-full border border-blue-200 p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-blue-900 mb-1">Capacity (Liters)</label>
            <input type="number" placeholder="e.g. 500" value={newTankCapacity} onChange={e => setNewTankCapacity(e.target.value)} className="w-full border border-blue-200 p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <button onClick={handleCreateTank} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded text-sm transition h-[38px]">
            Save Tank
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tanks.length === 0 ? <p className="text-sm text-gray-400">No tanks configured.</p> : tanks.map(tank => {
          const fill = tank.fill_percentage || 0;
          const isLow = fill < 20;
          return (
            <div key={tank.id} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-700">{tank.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {isLow ? 'Low Level' : 'Normal'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                <div className={`h-4 rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(fill, 100)}%` }}></div>
              </div>
              <div className="text-sm text-gray-500 flex justify-between font-medium">
                <span>{tank.current_level} L / {tank.capacity} L</span>
                <span>{fill.toFixed(1)}%</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="border p-4 rounded-lg">
           <h4 className="font-bold text-gray-700 mb-2">Sell Milk</h4>
           <div className="flex flex-col gap-3">
              <select className="border border-gray-300 p-2 rounded text-sm outline-none focus:border-blue-500" value={sellTankId} onChange={e => setSellTankId(Number(e.target.value))}>
                <option value="">Select Tank</option>
                {tanks.map(t => <option key={t.id} value={t.id}>{t.name} ({t.current_level}L)</option>)}
              </select>
              <input type="number" placeholder="Quantity (Liters)" className="border border-gray-300 p-2 rounded text-sm outline-none focus:border-blue-500" value={sellQty} onChange={e => setSellQty(e.target.value)} />
              <button className="bg-blue-600 hover:bg-blue-700 transition-colors text-white p-2 rounded text-sm font-bold shadow-sm" onClick={handleSell}>Sell Milk</button>
           </div>
        </div>
        <div className="border p-4 rounded-lg">
           <h4 className="font-bold text-gray-700 mb-2">Request Restock</h4>
           <div className="flex flex-col gap-3">
              <select className="border border-gray-300 p-2 rounded text-sm outline-none focus:border-blue-500" value={restockSupplierId} onChange={e => setRestockSupplierId(Number(e.target.value))}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
              </select>
              <input type="text" placeholder="Message (optional)" className="border border-gray-300 p-2 rounded text-sm outline-none focus:border-blue-500" value={restockMessage} onChange={e => setRestockMessage(e.target.value)} />
              <button className="bg-orange-500 hover:bg-orange-600 transition-colors text-white p-2 rounded text-sm font-bold shadow-sm" onClick={handleRestock}>Request Restock</button>
           </div>
        </div>
      </div>
    </div>
  );
};

interface InventoryViewProps { batches?: Batch[]; tanks?: StorageTank[]; suppliers?: any[]; onUpdate: () => void; }

const InventoryView = ({ batches = [], tanks = [], suppliers = [], onUpdate }: InventoryViewProps) => {
  const total = batches.reduce((s, b) => s + (b.milk_quantity || 0), 0);
  return (
    <div className="space-y-8">
      <TanksManager tanks={tanks} suppliers={suppliers} onUpdate={onUpdate} />
      <div>
        <h3 className="text-lg font-bold text-gray-800">Inventory Batches</h3>
        <p className="text-sm text-gray-500">Milk batches currently in stock</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-500">Total Volume</div>
          <div className="text-3xl font-bold text-blue-900">{total} L</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Active Batches</div>
          <div className="text-3xl font-bold text-gray-800">{batches.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Avg Batch Size</div>
          <div className="text-3xl font-bold text-gray-800">
            {batches.length ? Math.round(total / batches.length) : 0} L
          </div>
        </Card>
      </div>
      <Card title="Batch List">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-4">Batch ID</th>
              <th className="pb-2 pr-4">Quantity</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 ? (
              <tr><td colSpan={3} className="py-4 text-center text-gray-400">No batches in stock</td></tr>
            ) : batches.map(b => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">#{b.id}</td>
                <td className="py-2 pr-4">{b.milk_quantity} L</td>
                <td className="py-2">
                  <span className="bg-blue-100 text-blue-900 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ── Quality Pie Chart ────────────────────────────────────────────────────

interface QualityPieChartProps { records: MilkRecord[] }

const QualityPieChart = ({ records }: QualityPieChartProps) => {
  const good = records.filter(r => r.status === 'GOOD').length;
  const bad  = records.filter(r => r.status === 'BAD').length;
  const total = records.length;

  const pieData = [
    { name: 'Good',    value: good },
    { name: 'Bad',     value: bad  },
  ];
  const COLORS = ['#1d4ed8', '#dc2626'];

  return (
    <div style={{
      background: '#ffffff', borderRadius: 14,
      boxShadow: '0 1px 12px rgba(0,0,0,.07)',
      padding: '20px 20px 10px',
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
        Quality Ratio
      </p>
      <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
        {total} total records
      </p>

      {total === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No records yet</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={84}
                dataKey="value"
                paddingAngle={3}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} batches`, '']} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend below the chart */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 4 }}>
            {pieData.map((entry, i) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i] }} />
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {entry.name} — <strong style={{ color: COLORS[i] }}>{entry.value}</strong>
                  <span style={{ color: '#94a3b8', marginLeft: 4 }}>
                    ({total ? Math.round((entry.value / total) * 100) : 0}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Trend line chart ─────────────────────────────────────────────────────

interface TrendChartProps { records: MilkRecord[] }

const TrendChart = ({ records }: TrendChartProps) => {
  const chartData = records.slice(-20).map((r, i) => ({
    name: i + 1, ph: r.ph, temperature: r.temperature, turbidity: r.turbidity,
  }));
  return (
    <div style={{ background: '#ffffff', borderRadius: 12, boxShadow: '0 1px 12px rgba(0,0,0,.07)', padding: '20px 16px' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 14 }}>
        pH, Temperature and Turbidity — Last 20 Records
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="ph"          stroke="#1d4ed8" strokeWidth={2} dot={false} name="pH" />
          <Line type="monotone" dataKey="temperature" stroke="#dc2626" strokeWidth={2} dot={false} name="Temp °C" />
          <Line type="monotone" dataKey="turbidity"   stroke="#0891b2" strokeWidth={2} dot={false} name="Turbidity" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Inventory summary stat ───────────────────────────────────────────────

interface InventoryStatProps { batches: Batch[] }

const InventoryStat = ({ batches }: InventoryStatProps) => {
  const total = batches.reduce((s, b) => s + (b.milk_quantity || 0), 0);
  return (
    <Card title="Inventory Total">
      <p style={{ fontSize: 30, fontWeight: 800, color: '#1d4ed8', lineHeight: 1 }}>{total} L</p>
      <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{batches.length} batch{batches.length !== 1 ? 'es' : ''} in stock</p>
    </Card>
  );
};

// ── Main component ────────────────────────────────────────────────────────

export default function SellerDashboard() {
  const [view, setView]                   = useState('overview');
  const [liveData, setLiveData]           = useState<LiveData | null>(null);
  const [records, setRecords]             = useState<MilkRecord[]>([]);
  const [alerts, setAlerts]               = useState<AlertItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [batches, setBatches]             = useState<Batch[]>([]);
  const [tanks, setTanks]                 = useState<StorageTank[]>([]);
  const [suppliers, setSuppliers]         = useState<any[]>([]);
  const [lastUpdated, setLastUpdated]     = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    if (isDemo()) {
      setLiveData(DEMO_LIVE);
      setRecords(DEMO_RECORDS);
      setAlerts(DEMO_ALERTS);
      setNotifications(DEMO_NOTIFICATIONS);
      setBatches(DEMO_BATCHES);
      setLastUpdated(new Date());
      return;
    }
    try {
      const [live, recs, alrts, notifs, batchRes, tanksRes, suppRes] = await Promise.allSettled([
        getLiveData(), getAllRecords(), getAlerts(), getNotifications(), getBatches(), getTanks(), getSuppliers()
      ]);
      if (live.status     === 'fulfilled') setLiveData(live.value.data);
      if (recs.status     === 'fulfilled') setRecords(recs.value.data);
      if (alrts.status    === 'fulfilled') setAlerts(alrts.value.data);
      if (notifs.status   === 'fulfilled') setNotifications(notifs.value.data);
      if (batchRes.status === 'fulfilled') setBatches(batchRes.value.data);
      if (tanksRes.status === 'fulfilled') setTanks(tanksRes.value.data);
      if (suppRes.status  === 'fulfilled') setSuppliers(suppRes.value.data);
      setLastUpdated(new Date());
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const demo = liveData || DEMO_LIVE;

  const renderView = () => {
    switch (view) {
      case 'overview':
        return (
          <div className="space-y-6">
            <TanksManager tanks={tanks} suppliers={suppliers} onUpdate={fetchAll} />

            {/* Business Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="text-sm text-gray-500 font-medium">Total Volume in Stock</div>
                <div className="text-3xl font-extrabold text-blue-900 mt-2">
                  {batches.reduce((s, b) => s + (b.milk_quantity || 0), 0).toFixed(1)} L
                </div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 font-medium">Active Batches</div>
                <div className="text-3xl font-extrabold text-gray-800 mt-2">{batches.length}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 font-medium">Active Alerts</div>
                <div className="text-3xl font-extrabold text-orange-600 mt-2">{alerts.length}</div>
              </Card>
            </div>

            {/* Live Intake Decision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DecisionCard status={demo.status} />
              <div className="flex flex-col gap-4">
                <DecisionSupport data={demo} />
                <AdulterationSummary type={demo.adulteration_type} percentage={demo.percentage} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <QualityPieChart records={records} />
              </div>
              <div className="lg:col-span-2">
                <Alerts alerts={alerts} />
              </div>
            </div>
          </div>
        );
      case 'inventory': return <InventoryView batches={batches} tanks={tanks} suppliers={suppliers} onUpdate={fetchAll} />;
      case 'intake': return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <IntakeForm />
        </div>
      );
      case 'decision':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            <DecisionCard status={demo.status} />
            <DecisionSupport data={demo} />
            <AdulterationSummary type={demo.adulteration_type} percentage={demo.percentage} />
          </div>
        );
      case 'trends':
        return records.length > 1
          ? <TrendChart records={records} />
          : <p style={{ color: '#64748b' }}>Not enough data yet.</p>;
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
      <Sidebar role="seller" active={view} onSelect={setView} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar notifications={notifications} title="Seller Portal" />

        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: '24px 16px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                {view === 'overview' ? 'Seller Dashboard' : view.charAt(0).toUpperCase() + view.slice(1)}
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Decision-making and business monitoring</p>
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
