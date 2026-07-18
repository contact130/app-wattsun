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
// tRPC 11 avec superjson nécessite le wrapper {json: ...}
export async function trpcQuery(path: string, input?: any) {
  const params = input ? { input: JSON.stringify({ json: input }) } : {};
  const response = await api.get(`/api/trpc/${path}`, { params });
  // superjson renvoie {result: {data: {json: ...}}}
  const data = response.data?.result?.data;
  return data?.json !== undefined ? data.json : data;
}

export async function trpcMutation(path: string, input?: any) {
  const body = input ? { json: input } : undefined;
  const response = await api.post(`/api/trpc/${path}`, body);
  const data = response.data?.result?.data;
  return data?.json !== undefined ? data.json : data;
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
