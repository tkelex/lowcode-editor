import { http, tokenStorageKey } from './http';
import { AuthResponse, User } from './types';

export async function register(input: { email: string; username: string; password: string }) {
  const { data } = await http.post<AuthResponse>('/auth/register', input);
  localStorage.setItem(tokenStorageKey, data.accessToken);
  return data;
}

export async function login(input: { account: string; password: string }) {
  const { data } = await http.post<AuthResponse>('/auth/login', input);
  localStorage.setItem(tokenStorageKey, data.accessToken);
  return data;
}

export async function getCurrentUser() {
  const { data } = await http.get<User>('/auth/me');
  return data;
}

export function logout() {
  localStorage.removeItem(tokenStorageKey);
}

export function getStoredToken() {
  return localStorage.getItem(tokenStorageKey);
}
