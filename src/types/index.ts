export type Role = 'supplier' | 'seller' | 'admin';
export type BackendRole = 'SUPPLIER' | 'SELLER' | 'ADMIN';

export type MilkStatus = 'GOOD' | 'BAD';

// Backend sends uppercase: HIGH | MEDIUM | LOW | CRITICAL
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';

export interface User {
  id?: number;
  name?: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  message: string;
  user: {
    email: string;
    role: BackendRole;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  role: BackendRole;
}

// Matches backend MilkData model (7 fields fed to XGBoost)
export interface SensorReading {
  ph?: number | null;
  temperature?: number | null;
  taste?: number | null;
  odor?: number | null;
  fat?: number | null;
  turbidity?: number | null;
  colour?: number | null;
}

// Flattened view of AnalysisResult + nested MilkData fields
export interface MilkRecord extends SensorReading {
  id?: number;
  created_at?: string;
  adulteration_type?: string | null;
  percentage?: number | null;
  status?: MilkStatus;
  reasons?: string[] | string;
}

export interface LiveData extends MilkRecord {
  status: MilkStatus;
}

export interface AlertItem {
  type?: string;
  message?: string;
  severity: Severity;
}

export interface NotificationItem {
  id: number | string;
  message: string;
  read: boolean;
  created_at?: string;
}

// Matches backend Inventory model
export interface Batch {
  id: number;
  milk_quantity: number;
  status: string;
  updated_at?: string;
}

export interface StorageTank {
  id: number;
  name: string;
  capacity: number;
  current_level: number;
  location?: string | null;
  updated_at?: string;
  fill_percentage?: number;
}

