import React, { useState, useEffect } from 'react';
import Card from './Card';
import { getBatches } from '../services/api';
import { Batch } from '../types';

export default function PaymentsView() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBatches()
      .then(res => {
        setBatches(res.data || []);
      })
      .catch(err => {
        console.error('Error fetching batches for payments', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Simple pricing logic: $0.50 base per liter. Bonus of $0.10 for GOOD, penalty of -$0.30 for BAD.
  const BASE_PRICE = 0.50;
  const GOOD_BONUS = 0.10;
  const BAD_PENALTY = -0.30;

  const calculatePayment = (batch: Batch) => {
    const qty = batch.milk_quantity || 0;
    const isGood = batch.status === 'GOOD';
    const rate = BASE_PRICE + (isGood ? GOOD_BONUS : BAD_PENALTY);
    return Math.max(0, qty * rate);
  };

  const totalPayment = batches.reduce((sum, b) => sum + calculatePayment(b), 0);
  const totalVolume = batches.reduce((sum, b) => sum + (b.milk_quantity || 0), 0);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading payment data...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-500 uppercase tracking-wide">Estimated Balance</div>
          <div className="text-3xl font-bold text-green-700">${totalPayment.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500 uppercase tracking-wide">Total Volume Supplied</div>
          <div className="text-3xl font-bold text-blue-900">{totalVolume.toFixed(1)} L</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500 uppercase tracking-wide">Avg Price / Liter</div>
          <div className="text-3xl font-bold text-gray-800">
            ${totalVolume > 0 ? (totalPayment / totalVolume).toFixed(2) : '0.00'}
          </div>
        </Card>
      </div>

      <Card title="Payment History & Estimates">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-3 pr-4 font-medium">Batch ID</th>
                <th className="py-3 pr-4 font-medium">Volume</th>
                <th className="py-3 pr-4 font-medium">Quality</th>
                <th className="py-3 pr-4 font-medium">Rate / L</th>
                <th className="py-3 font-medium">Estimated Payment</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">No deliveries recorded yet.</td>
                </tr>
              ) : (
                batches.map(b => {
                  const rate = BASE_PRICE + (b.status === 'GOOD' ? GOOD_BONUS : BAD_PENALTY);
                  const pay = calculatePayment(b);
                  return (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">#{b.id}</td>
                      <td className="py-3 pr-4">{b.milk_quantity} L</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.status === 'GOOD' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">${rate.toFixed(2)}</td>
                      <td className="py-3 font-semibold text-gray-900">${pay.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg">
          <strong>Note:</strong> Payments are calculated automatically based on your milk's predicted quality status. Maintaining a 'GOOD' status grants a bonus, while 'BAD' status reduces the rate significantly.
        </div>
      </Card>
    </div>
  );
}
