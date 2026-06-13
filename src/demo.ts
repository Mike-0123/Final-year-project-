import {
  AlertItem,
  Batch,
  LiveData,
  MilkRecord,
  NotificationItem,
  Role,
  User,
} from './types';

export const DEMO_USERS: Record<Role, User> = {
  supplier: { id: 1, name: 'Alice Uwase', email: 'supplier@milk.rw', role: 'supplier' },
  seller: { id: 2, name: 'Bob Nkurunziza', email: 'seller@milk.rw', role: 'seller' },
  admin: { id: 3, name: 'Carol Mukamana', email: 'admin@milk.rw', role: 'admin' },
};

export const DEMO_TOKEN = 'demo-token-replace-with-real-jwt';

export const DEMO_LIVE: LiveData = {
  status: 'BAD',
  adulteration_type: 'Water',
  percentage: 18,
  ph: 6.3,
  temperature: 8,
  taste: 1,
  odor: 0,
  fat: 2.1,
  turbidity: 5,
  colour: 248,
  reasons: [
    'Temperature from DS18B20 is above safe storage limit',
    'pH sensor reading is below normal fresh milk range',
  ],
};

export const DEMO_RECORDS: MilkRecord[] = [
  { created_at: new Date(Date.now() - 5 * 60000).toISOString(), ph: 6.8, temperature: 5, adulteration_type: null, percentage: 0, status: 'GOOD' },
  { created_at: new Date(Date.now() - 4 * 60000).toISOString(), ph: 6.5, temperature: 6, adulteration_type: 'Salt', percentage: 7, status: 'BAD' },
  { created_at: new Date(Date.now() - 3 * 60000).toISOString(), ph: 6.7, temperature: 5, adulteration_type: null, percentage: 0, status: 'GOOD' },
  { created_at: new Date(Date.now() - 2 * 60000).toISOString(), ph: 6.2, temperature: 9, adulteration_type: 'Water', percentage: 18, status: 'BAD' },
  { created_at: new Date(Date.now() - 1 * 60000).toISOString(), ph: 6.9, temperature: 4, adulteration_type: null, percentage: 0, status: 'GOOD' },
  { created_at: new Date().toISOString(), ph: 6.3, temperature: 8, adulteration_type: 'Water', percentage: 18, status: 'BAD' },
];

export const DEMO_ALERTS: AlertItem[] = [
  { type: 'High Temperature', message: 'Temperature is 8 C - above safe limit', severity: 'HIGH' },
  { type: 'Adulteration Detected', message: 'Water detected at 18%', severity: 'HIGH' },
  { type: 'Low pH', message: 'pH 6.3 is below normal range (6.6-6.8)', severity: 'MEDIUM' },
];

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, message: 'Milk quality dropped - check pH, temperature, gas, turbidity, and colour readings', read: false },
  { id: 2, message: 'New batch submitted by supplier', read: false },
  { id: 3, message: 'System health check passed', read: true },
];

export const DEMO_BATCHES: Batch[] = [
  { id: 1, milk_quantity: 150, status: 'available' },
  { id: 2, milk_quantity: 80, status: 'available' },
];
