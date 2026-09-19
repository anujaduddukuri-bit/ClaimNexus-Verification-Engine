import axios from 'axios';
import { QueryRequest, ExecutionDetail, AnalyticsSummary, ProviderStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const runConsensus = async (request: QueryRequest): Promise<ExecutionDetail> => {
  const response = await apiClient.post('/consensus/run', request, { timeout: 120000 });
  return response.data;
};

export const getExecutions = async (limit = 20): Promise<ExecutionDetail[]> => {
  const response = await apiClient.get('/executions', { params: { limit } });
  return Array.isArray(response.data) ? response.data : [];
};

export const getExecutionById = async (id: string): Promise<ExecutionDetail> => {
  const response = await apiClient.get(`/executions/${id}`);
  return response.data;
};

export const deleteExecution = async (id: string): Promise<void> => {
  await apiClient.delete(`/executions/${id}`);
};

export const clearAllExecutions = async (): Promise<void> => {
  await apiClient.delete('/executions');
};

export const getProvidersStatus = async (): Promise<{ providers: ProviderStatus[] }> => {
  const response = await apiClient.get('/providers');
  return response.data;
};

export const getAnalytics = async (): Promise<AnalyticsSummary> => {
  const response = await apiClient.get('/analytics');
  return response.data;
};

export const getSettings = async () => {
  const response = await apiClient.get('/settings');
  return response.data;
};

export const updateSettings = async (settings: any) => {
  const response = await apiClient.put('/settings', settings);
  return response.data;
};
