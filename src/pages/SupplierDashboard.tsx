import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Alerts from '../components/Alerts';
import { ReportsView, SearchView, ProfileView, SettingsView } from '../components/Views';
import PaymentsView from '../components/PaymentsView';
import { getAlerts, getNotifications, getBatches } from '../services/api';
import { DEMO_ALERTS, DEMO_NOTIFICATIONS, DEMO_BATCHES } from '../demo';
import { AlertItem, NotificationItem, Batch } from '../types';
import { isDemoMode } from '../services/storage';

const isDemo = isDemoMode;

// ── New Components for Supplier ──────────────────────────────────────────

const DeliverySummary = ({ batches }: { batches: Batch[] }) => {
  const totalVolume = batches.reduce((sum, b) => sum + (b.milk_quantity || 0), 0);
  const accepted = batches.filter(b => b.status === 'GOOD').length;
  const acceptanceRate = batches.length > 0 ? Math.round((accepted / batches.length) * 100) : 0;
  const estimatedEarnings = totalVolume * 0.45; // Just a dummy calculation for demo, 0.45 per liter

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <p className="text-sm text-gray-500 font-medium">Total Volume Delivered</p>
        <p className="text-3xl font-extrabold text-blue-800 mt-2">{totalVolume.toFixed(1)} L</p>
        <p className="text-xs text-gray-400 mt-1">This month</p>
      </Card>
      <Card>
        <p className="text-sm text-gray-500 font-medium">Acceptance Rate</p>
        <p className={`text-3xl font-extrabold mt-2 ${acceptanceRate > 90 ? 'text-green-600' : 'text-orange-600'}`}>
          {acceptanceRate}%
        </p>
        <p className="text-xs text-gray-400 mt-1">{accepted} of {batches.length} batches accepted</p>
      </Card>
      <Card>
        <p className="text-sm text-gray-500 font-medium">Estimated Earnings</p>
        <p className="text-3xl font-extrabold text-gray-800 mt-2">${estimatedEarnings.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mt-1">Pending payout</p>
      </Card>
    </div>
  );
};

const RestockInbox = ({ notifications, onReplied }: { notifications: NotificationItem[], onReplied: () => void }) => {
  const restocks = notifications.filter(n => n.message.toLowerCase().includes('restock') && !n.read);
  const [replyingId, setReplyingId] = useState<number | string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent, notifId: number | string) => {
    e.preventDefault();
    if (!quantity) return;
    setLoading(true);
    try {
      if (isDemo()) {
        await new Promise(r => setTimeout(r, 500));
      } else {
        await import('../services/api').then(m => m.replyRestockRequest({
          notification_id: Number(notifId),
          quantity: Number(quantity)
        }));
      }
      setReplyingId(null);
      setQuantity('');
      onReplied();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Restock Requests Inbox">
      {restocks.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">No restock requests from the MCC right now.</p>
      ) : (
        <div className="space-y-3 mt-2">
          {restocks.map((n) => (
            <div key={n.id} className="p-3 border rounded-lg bg-orange-50 border-orange-200 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-orange-900">New Restock Request</p>
                  <p className="text-xs text-orange-700">{n.message}</p>
                </div>
                {replyingId !== n.id && (
                  <button 
                    onClick={() => setReplyingId(n.id)}
                    className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold py-1.5 px-3 rounded shadow-sm transition"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
              
              {replyingId === n.id && (
                <form onSubmit={(e) => handleSubmit(e, n.id)} className="mt-2 pt-2 border-t border-orange-200 flex gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Liters to deliver"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded shadow-sm transition disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyingId(null)}
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1.5 px-3 rounded transition"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const DeliveriesTable = ({ batches }: { batches: Batch[] }) => (
  <Card title="Recent Deliveries">
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
          <tr>
            <th className="px-4 py-3">Batch ID</th>
            <th className="px-4 py-3">Quantity</th>
            <th className="px-4 py-3">Status (MCC)</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {batches.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No deliveries found.</td></tr>
          ) : batches.map(b => (
            <tr key={b.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">#{b.id}</td>
              <td className="px-4 py-3">{b.milk_quantity} L</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${b.status === 'GOOD' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {b.status === 'GOOD' ? 'Accepted' : 'Rejected'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {b.updated_at ? new Date(b.updated_at).toLocaleDateString() : 'Recent'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const QualityFeedback = ({ batches }: { batches: Batch[] }) => {
  const rejected = batches.filter(b => b.status !== 'GOOD');
  if (rejected.length === 0) return null;
  
  return (
    <Card title="Quality Improvement Feedback">
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-sm font-bold text-red-800 mb-2">Notice: Recent delivery rejected by MCC</p>
        <p className="text-xs text-red-700">
          Your last rejected delivery was flagged for potential adulteration by the MCC sensors. 
          Please ensure all milk handling containers are completely dry to prevent water detection, and maintain cold chain storage to prevent early spoilage.
        </p>
      </div>
    </Card>
  );
};


// ── Main component ────────────────────────────────────────────────────────

export default function SupplierDashboard() {
  const [view, setView]                   = useState('overview');
  const [alerts, setAlerts]               = useState<AlertItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [batches, setBatches]             = useState<Batch[]>([]);
  const [lastUpdated, setLastUpdated]     = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    if (isDemo()) {
      setAlerts(DEMO_ALERTS);
      setNotifications(DEMO_NOTIFICATIONS);
      setBatches(DEMO_BATCHES);
      setLastUpdated(new Date());
      return;
    }
    try {
      const [alrts, notifs, batchRes] = await Promise.allSettled([
        getAlerts(), getNotifications(), getBatches()
      ]);
      if (alrts.status    === 'fulfilled') setAlerts(alrts.value.data);
      if (notifs.status   === 'fulfilled') setNotifications(notifs.value.data);
      if (batchRes.status === 'fulfilled') setBatches(batchRes.value.data);
      setLastUpdated(new Date());
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const renderView = () => {
    switch (view) {
      case 'overview':
        return (
          <>
            <DeliverySummary batches={batches} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 space-y-6">
                <DeliveriesTable batches={batches} />
                <QualityFeedback batches={batches} />
              </div>
              <div className="space-y-6">
                <RestockInbox notifications={notifications} onReplied={fetchAll} />
                <Alerts alerts={alerts} />
              </div>
            </div>
          </>
        );
      case 'payments': return <PaymentsView />;
      case 'records':  return <DeliveriesTable batches={batches} />;
      case 'alerts':   return <Alerts alerts={alerts} />;
      case 'reports':  return <ReportsView records={[]} />;
      case 'search':   return <SearchView records={[]} />;
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
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Delivery tracking and earnings</p>
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
