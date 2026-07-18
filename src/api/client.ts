import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://appwattsun.manus.space';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper pour appeler les procédures tRPC via HTTP
export async function trpcQuery(path: string, input?: any) {
  const params = input ? { input: JSON.stringify(input) } : {};
  const response = await api.get(`/api/trpc/${path}`, { params });
  return response.data.result.data;
}

export async function trpcMutation(path: string, input?: any) {
  const response = await api.post(`/api/trpc/${path}`, input);
  return response.data.result.data;
}

// Auth helpers
export async function saveCode(code: string) {
  await SecureStore.setItemAsync('techCode', code);
}

export async function getStoredCode(): Promise<string | null> {
  return await SecureStore.getItemAsync('techCode');
}

export async function clearCode() {
  await SecureStore.deleteItemAsync('techCode');
}

export default api;
