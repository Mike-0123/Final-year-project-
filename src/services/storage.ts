export const STORAGE_KEYS = {
  token: 'token',
  refresh: 'refresh_token',
  user: 'user',
  demoMode: 'demo_mode',
};

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.token);
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.token, token);
}

export function removeToken(): void {
  localStorage.removeItem(STORAGE_KEYS.token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.refresh);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.refresh, token);
}

export function removeRefreshToken(): void {
  localStorage.removeItem(STORAGE_KEYS.refresh);
}

export function getUser<T = any>(): T | null {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: unknown): void {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function isDemoMode(): boolean {
  return localStorage.getItem(STORAGE_KEYS.demoMode) === 'true';
}

export function setDemoMode(value: boolean): void {
  localStorage.setItem(STORAGE_KEYS.demoMode, value ? 'true' : 'false');
}

export function clearStorage(): void {
  removeToken();
  removeRefreshToken();
  removeUser();
  localStorage.removeItem(STORAGE_KEYS.demoMode);
}
