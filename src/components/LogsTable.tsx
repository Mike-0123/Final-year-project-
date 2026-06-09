import Card from './Card';
import { MilkRecord } from '../types';

interface LogsTableProps {
  records?: MilkRecord[];
}

export default function LogsTable({ records = [] }: LogsTableProps) {
  return (
    <Card title="Logs Table">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-blue-900/70 border-b border-blue-100 bg-blue-50/60">
              <th className="pb-2 pt-2 pl-3 pr-4">Time</th>
              <th className="pb-2 pt-2 pr-4">pH</th>
              <th className="pb-2 pt-2 pr-4">Temp (°C)</th>
              <th className="pb-2 pt-2 pr-4">Type</th>
              <th className="pb-2 pt-2 pr-4">%</th>
              <th className="pb-2 pt-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-400">No records yet</td>
              </tr>
            ) : (
              records.map((r, i) => (
                <tr key={i} className="border-b border-blue-50 last:border-0 hover:bg-blue-50/40">
                  <td className="py-2 pl-3 pr-4 text-gray-500">
                    {r.created_at ? new Date(r.created_at).toLocaleTimeString() : '—'}
                  </td>
                  <td className="py-2 pr-4">{r.ph ?? '—'}</td>
                  <td className="py-2 pr-4">{r.temperature ?? '—'}</td>
                  <td className="py-2 pr-4 capitalize">{r.adulteration_type || '—'}</td>
                  <td className="py-2 pr-4">{r.percentage != null ? `${r.percentage}%` : '—'}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.status === 'GOOD'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
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
  );
}
