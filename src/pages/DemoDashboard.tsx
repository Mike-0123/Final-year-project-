import { useState, useEffect } from 'react';
import SupplierDashboard from './SupplierDashboard';
import { setDemoMode, setRefreshToken, setToken, setUser } from '../services/storage';
import { DEMO_TOKEN, DEMO_USERS } from '../demo';

export default function DemoDashboard() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDemoMode(true);
    setToken(DEMO_TOKEN);
    setRefreshToken('demo-refresh-token');
    setUser(DEMO_USERS.supplier);
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="rounded-xl bg-white p-8 shadow-xl text-center">
          <p className="text-lg font-semibold text-blue-900">Loading demo dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing public demo data for you.</p>
        </div>
      </div>
    );
  }

  return <SupplierDashboard />;
}
