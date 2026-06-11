import React, { useState } from 'react';
import Card from './Card';
import { createBatch, getLiveData } from '../services/api';
import { Batch } from '../types';

export default function IntakeForm() {
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [liveReading, setLiveReading] = useState<any>(null);

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
    if (!supplierId || !quantity) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Normally you'd pass supplierId to the backend here, but our current Batch type
      // doesn't explicitly have it. We'll send it anyway assuming backend handles it or ignores it.
      const payload: Partial<Batch> & { supplier_id?: string; quality_status?: string } = {
        milk_quantity: parseFloat(quantity),
        status: liveReading ? liveReading.status : 'PENDING',
        supplier_id: supplierId,
        quality_status: liveReading ? liveReading.status : undefined,
      };

      await createBatch(payload);
      setSuccess('Batch logged successfully!');
      setSupplierId('');
      setQuantity('');
      setLiveReading(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to log intake');
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

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Live Sensor Reading</label>
              <button 
                type="button"
                onClick={fetchSensorData}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded"
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
            {loading ? 'Logging...' : 'Log Intake Batch'}
          </button>
        </form>
      </div>
    </Card>
  );
}
