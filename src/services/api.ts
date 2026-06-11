import axios, { AxiosResponse } from 'axios';
import {
  AlertItem,
  AuthResponse,
  Batch,
  LiveData,
  LoginPayload,
  MilkRecord,
  NotificationItem,
  SensorReading,
  SignupPayload,
} from '../types';
import { getToken, getRefreshToken } from './storage';

const BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  const isAuthEndpoint = config.url?.includes('/api/auth/login') || config.url?.includes('/api/auth/signup');
  if (token && !isAuthEndpoint) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (data: LoginPayload): Promise<AxiosResponse<AuthResponse>> =>
  api.post('/api/auth/login/', data);
export const signup = (data: SignupPayload): Promise<AxiosResponse<AuthResponse>> =>
  api.post('/api/auth/signup/', data);
export const logout = (): Promise<AxiosResponse<void>> =>
  api.post('/api/auth/logout/', { refresh: getRefreshToken() });
export const forgotPassword = (data: { email: string }): Promise<AxiosResponse<void>> =>
  api.post('/api/auth/forgot-password/', data);
export const resetPassword = (data: { uidb64: string, token: string, new_password: string }): Promise<AxiosResponse<void>> =>
  api.post('/api/auth/reset-password/', data);
export const getUsers = (): Promise<AxiosResponse<import('../types').User[]>> =>
  api.get('/api/auth/users/');
export const createUser = (data: Partial<import('../types').User> & { password?: string, username?: string }): Promise<AxiosResponse<import('../types').User>> =>
  api.post('/api/auth/users/', data);
export const updateUser = (id: number | string, data: Partial<import('../types').User> & { password?: string }): Promise<AxiosResponse<import('../types').User>> =>
  api.patch(`/api/auth/users/${id}/`, data);
export const deleteUser = (id: number | string): Promise<AxiosResponse<void>> =>
  api.delete(`/api/auth/users/${id}/`);

// Analysis
export const analyzeMilk = (data: SensorReading): Promise<AxiosResponse<MilkRecord>> =>
  api.post('/api/analyze/', data);
export const getLatestResult = (): Promise<AxiosResponse<MilkRecord>> =>
  api.get('/api/analyze/latest/');
export const getAllRecords = (): Promise<AxiosResponse<MilkRecord[]>> =>
  api.get('/api/predictions/');
export const getSingleRecord = (id: number | string): Promise<AxiosResponse<MilkRecord>> =>
  api.get(`/api/predictions/${id}/`);

// Prediction
export const predictAdulteration = (data: SensorReading): Promise<AxiosResponse<MilkRecord>> =>
  api.post('/api/analyze/', data);
export const getPredictionLogs = (): Promise<AxiosResponse<MilkRecord[]>> =>
  api.get('/api/predictions/');

// Sensors
export const saveSensorData = (data: SensorReading): Promise<AxiosResponse<SensorReading>> =>
  api.post('/api/sensors/data/', data);
export const getSensorData = (): Promise<AxiosResponse<SensorReading[]>> =>
  api.get('/api/sensors/data/');

// Alerts
export const getAlerts = (): Promise<AxiosResponse<AlertItem[]>> =>
  api.get('/api/alerts/');
export const createAlert = (data: AlertItem): Promise<AxiosResponse<AlertItem>> =>
  api.post('/api/alerts/', data);

// Notifications
export const getNotifications = (): Promise<AxiosResponse<NotificationItem[]>> =>
  api.get('/api/notifications/');
export const markNotificationRead = (
  id: number | string
): Promise<AxiosResponse<NotificationItem>> =>
  api.patch(`/api/notifications/${id}/`, { read: true });

// Inventory / Batch
export const createBatch = (data: Partial<Batch>): Promise<AxiosResponse<Batch>> =>
  api.post('/api/inventory/', data);
export const getBatches = (): Promise<AxiosResponse<Batch[]>> =>
  api.get('/api/inventory/');

// Dashboard
export const getDashboard = (): Promise<AxiosResponse<unknown>> => api.get('/api/dashboard/summary/');
export const getLiveData = (): Promise<AxiosResponse<LiveData>> => api.get('/api/analyze/latest/');

// Inventory — field is milk_quantity on backend
export const getInventory = (): Promise<AxiosResponse<import('../types').Batch[]>> =>
  api.get('/api/inventory/');

export default api;
