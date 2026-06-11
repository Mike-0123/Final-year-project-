import { useState } from 'react';
import { Link } from 'react-router-dom';
import SimulationWorkspace from '../components/SimulationWorkspace';
import { MilkRecord, SensorReading } from '../types';
import { analyzeMilk } from '../services/api';

export default function SimulationWorkspaceStandalone() {
  const [records, setRecords] = useState<MilkRecord[]>([]);

  const applySimulation = (record: MilkRecord) => {
    setRecords((current) => [record, ...current].slice(0, 30));
  };

  const submitSimulation = async (reading: SensorReading) => {
    const res = await analyzeMilk(reading);
    return res.data;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-blue-900 tracking-tight">Standalone Simulation Workspace</h1>
          <p className="text-xs text-gray-500 mt-1">Independent parameter testing environment</p>
        </div>
        <Link 
          to="/login" 
          className="text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full border border-blue-200 transition"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
      
      <div className="flex-1 max-w-7xl w-full mx-auto p-6">
        <SimulationWorkspace
          initialData={null}
          onSimulate={applySimulation}
          onSubmit={submitSimulation}
          isDemo={false} // Allow real backend submission from standalone mode if needed
        />
        
        {records.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Standalone Simulations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="py-3 pr-4 font-medium">Time</th>
                    <th className="py-3 pr-4 font-medium">pH</th>
                    <th className="py-3 pr-4 font-medium">Temp °C</th>
                    <th className="py-3 pr-4 font-medium">Fat %</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Adulteration</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 text-gray-500">{new Date(r.created_at || '').toLocaleTimeString()}</td>
                      <td className="py-3 pr-4 font-mono">{r.ph}</td>
                      <td className="py-3 pr-4 font-mono">{r.temperature}</td>
                      <td className="py-3 pr-4 font-mono">{r.fat}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'GOOD' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600 font-medium capitalize">{r.adulteration_type || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
