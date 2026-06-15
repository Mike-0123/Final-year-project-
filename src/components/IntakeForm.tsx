import React, { useState, useEffect } from 'react';
import Card from './Card';
import { createBatch, getLiveData, getTanks, addMilkToTank } from '../services/api';
import { Batch, StorageTank } from '../types';

export default function IntakeForm() {
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [tankId, setTankId] = useState('');
  const [tanks, setTanks] = useState<StorageTank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [liveReading, setLiveReading] = useState<any>(null);

  useEffect(() => {
    getTanks().then(res => setTanks(res.data)).catch(console.error);
  }, []);

  const fetchSensorData = async () => {
    try {
      const res = await getLiveData();
      setLiveReading(res.data);
      setError('');
    } catch (err) {
      setError('Could not fetch live sensor data.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !quantity || !tankId) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const parsedQuantity = parseFloat(quantity);
      const selectedTank = tanks.find(t => t.id === Number(tankId));
      if (selectedTank && selectedTank.current_level + parsedQuantity > selectedTank.capacity) {
        throw new Error('Tank capacity exceeded! Cannot fit that much milk.');
      }

      // 1. Create Batch
      const payload: Partial<Batch> & { supplier_id?: string; quality_status?: string } = {
        milk_quantity: parsedQuantity,
        status: liveReading ? liveReading.status : 'PENDING',
        supplier_id: supplierId,
        quality_status: liveReading ? liveReading.status : undefined,
      };

      await createBatch(payload);

      // 2. Route Milk to Tank
      await addMilkToTank(Number(tankId), parsedQuantity);

      setSuccess(`Successfully logged batch and routed ${parsedQuantity}L to the tank!`);
      setSupplierId('');
      setQuantity('');
      setTankId('');
      setLiveReading(null);
      // Refresh tanks to get updated levels
      getTanks().then(res => setTanks(res.data)).catch(console.error);
    } catch (err: any) {
      setError(err.message || err.response?.data?.error || err.response?.data?.detail || 'Failed to log intake');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="New Milk Intake">
      <div className="p-2">
        <p className="text-sm text-gray-500 mb-4">Log a new milk delivery from a supplier and read live sensor data.</p>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier ID</label>
            <input 
              type="text" 
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. SUP-102"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Liters)</label>
              <input 
                type="number" 
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Tank</label>
              <select 
                value={tankId}
                onChange={(e) => setTankId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a tank...</option>
                {tanks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Free: {t.capacity - t.current_level}L)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Live Sensor Reading</label>
              <button 
                type="button"
                onClick={fetchSensorData}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded transition"
              >
                Fetch Latest Reading
              </button>
            </div>
            
            {liveReading ? (
              <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-bold ${liveReading.status === 'GOOD' ? 'text-blue-700' : 'text-red-600'}`}>{liveReading.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">pH:</span>
                  <span className="font-medium">{liveReading.ph}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Temp:</span>
                  <span className="font-medium">{liveReading.temperature}°C</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">No reading attached. Fetching is recommended before logging.</div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Routing Milk...' : 'Log Intake Batch'}
          </button>
        </form>
      </div>
    </Card>
  );
}
