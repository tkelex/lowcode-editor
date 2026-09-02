import axios from 'axios';

export const tokenStorageKey = 'lowcode_editor_token';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export const http = axios.create({
  baseURL: apiBaseUrl,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenStorageKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
