import React, { useState, useEffect } from 'react';
import Card from './Card';

interface Device {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  battery: number;
  lastPing: string;
  location: string;
}

export default function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app, this would fetch from /api/devices/
  useEffect(() => {
    // Mocking device data since backend doesn't have it yet
    setTimeout(() => {
      setDevices([
        { id: 'DEV-001', name: 'Main Intake Sensor', status: 'ONLINE', battery: 85, lastPing: 'Just now', location: 'MCC Kigali' },
        { id: 'DEV-002', name: 'Tank A Sensor', status: 'ONLINE', battery: 92, lastPing: '2 mins ago', location: 'MCC Kigali' },
        { id: 'DEV-003', name: 'Tank B Sensor', status: 'OFFLINE', battery: 12, lastPing: '4 hours ago', location: 'MCC Kigali' },
        { id: 'DEV-004', name: 'Intake Sensor 2', status: 'MAINTENANCE', battery: 100, lastPing: 'Yesterday', location: 'MCC Nyagatare' },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-100 text-green-800';
      case 'OFFLINE': return 'bg-red-100 text-red-800';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading devices...</div>;

  const onlineCount = devices.filter(d => d.status === 'ONLINE').length;
  const issueCount = devices.length - onlineCount;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-500 uppercase tracking-wide">Total Devices</div>
          <div className="text-3xl font-bold text-gray-800">{devices.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500 uppercase tracking-wide">Online & Active</div>
          <div className="text-3xl font-bold text-green-600">{onlineCount}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500 uppercase tracking-wide">Requires Attention</div>
          <div className="text-3xl font-bold text-red-600">{issueCount}</div>
        </Card>
      </div>

      <Card title="Sensor Nodes & IoT Devices">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-3 pr-4 font-medium">Device ID</th>
                <th className="py-3 pr-4 font-medium">Name</th>
                <th className="py-3 pr-4 font-medium">Location</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Battery</th>
                <th className="py-3 font-medium">Last Ping</th>
                <th className="py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-mono text-gray-600">{d.id}</td>
                  <td className="py-3 pr-4 font-medium text-gray-900">{d.name}</td>
                  <td className="py-3 pr-4 text-gray-600">{d.location}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${d.battery > 20 ? 'bg-green-500' : 'bg-red-500'}`} 
                          style={{ width: `${d.battery}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{d.battery}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-500">{d.lastPing}</td>
                  <td className="py-3 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-semibold">Configure</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
