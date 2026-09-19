import axios from 'axios';
import {
  QueryRequest,
  ExecutionDetail,
  AnalyticsSummary,
  ProviderStatus,
} from '../types';

// ============================================================
// Railway Production Backend
// ============================================================

const API_BASE_URL =
  'https://claimnexus-verification-engine-production.up.railway.app/api/v1';

// ============================================================
// Axios API Client
// ============================================================

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// Consensus / Claim Verification
// ============================================================

export const runConsensus = async (
  request: QueryRequest
): Promise<ExecutionDetail> => {
  const response = await apiClient.post(
    '/consensus/run',
    request,
    {
      timeout: 120000,
    }
  );

  return response.data;
};

// ============================================================
// Execution History
// ============================================================

export const getExecutions = async (
  limit = 20
): Promise<ExecutionDetail[]> => {
  const response = await apiClient.get('/executions', {
    params: {
      limit,
    },
  });

  return Array.isArray(response.data) ? response.data : [];
};

// ============================================================
// Get Single Execution
// ============================================================

export const getExecutionById = async (
  id: string
): Promise<ExecutionDetail> => {
  const response = await apiClient.get(`/executions/${id}`);

  return response.data;
};

// ============================================================
// Delete Single Execution
// ============================================================

export const deleteExecution = async (
  id: string
): Promise<void> => {
  await apiClient.delete(`/executions/${id}`);
};

// ============================================================
// Delete All Executions
// ============================================================

export const clearAllExecutions = async (): Promise<void> => {
  await apiClient.delete('/executions');
};

// ============================================================
// Provider Status
// ============================================================

export const getProvidersStatus = async (): Promise<{
  providers: ProviderStatus[];
}> => {
  const response = await apiClient.get('/providers');

  return response.data;
};

// ============================================================
// Analytics
// ============================================================

export const getAnalytics = async (): Promise<AnalyticsSummary> => {
  const response = await apiClient.get('/analytics');

  return response.data;
};

// ============================================================
// Get Settings
// ============================================================

export const getSettings = async () => {
  const response = await apiClient.get('/settings');

  return response.data;
};

// ============================================================
// Update Settings
// ============================================================

export const updateSettings = async (
  settings: any
) => {
  const response = await apiClient.put(
    '/settings',
    settings
  );

  return response.data;
};