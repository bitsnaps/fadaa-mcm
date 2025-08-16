import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { restoreTextDirection } from 'chart.js/helpers';

const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return '/api';
  }
  // In production, use same origin or configured URL
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: false,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

export function getContracts(profileId) {
    return apiClient.get('/contracts', { params: { profile_id: profileId } });
}

export function getClients() {
    return apiClient.get('/clients');
}
export function getClientInvestments(clientId) {
    return apiClient.get(`/clients/${clientId}/investments`);
}

export function getAvailableOffices() {
    return apiClient.get('/offices');
}

export function addContract(formData) {
    return apiClient.post('/contracts', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

export function updateContract(id, formData) {
    return apiClient.put(`/contracts/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

export const getDocuments = () => {
    return apiClient.get('/documents');
};

export const addDocument = (formData) => {
    return apiClient.post('/documents', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const updateDocument = (id, data) => {
    return apiClient.put(`/documents/${id}`, data);
};

export const deleteDocument = (id) => {
    return apiClient.delete(`/documents/${id}`);
};

export const getInvestmentsList = () => {
    return apiClient.get('/misc/investments');
};

export const getInvestments = (profileId) => {
    return apiClient.get('/investments', { params: { profile_id: profileId } });
};

export const getInvestment = (id) => {
    return apiClient.get(`/investments/${id}`);
};

export const addInvestment = (investmentData) => {
    return apiClient.post('/investments', investmentData);
};

export const updateInvestment = (id, investmentData) => {
    return apiClient.put(`/investments/${id}`, investmentData);
};

export const deleteInvestment = (id) => {
    return apiClient.delete(`/investments/${id}`);
};

export const getBranches = () => {
    return apiClient.get('/branches');
};

export const getInvestors = () => {
    return apiClient.get('/users/role/Investor');
};

export const getTotalClients = () => {
    return apiClient.get('/clients/total');
};

export const getTotalIncome = (params) => {
    return apiClient.get('/incomes/total', { params });
};

export const getTotalExpense = (params) => {
    return apiClient.get('/expenses/total', { params });
};

export const getMonthlyIncomeByBranch = () => {
    return apiClient.get('/incomes/monthly-by-branch');
};

export const getNotifications = () => {
    return apiClient.get('/notifications');
};

export const getActivityLogs = () => {
    return apiClient.get('/activity-logs');
};

export const getAssistants = () => {
    return apiClient.get('/users/role/Assistant');
};

export const getOffices = (params) => {
    return apiClient.get('/offices', { params });
};

export const getRevenueSummary = (params) => {
    return apiClient.get('/financials/revenue-summary', { params });
};

// --- Admin/Assistant: Withdrawals management ---
export const getAllWithdrawals = (params = {}) => {
  return apiClient.get('/withdrawals', { params });
};

export const approveWithdrawal = (id) => {
  return apiClient.put(`/withdrawals/${id}/approve`);
};

export const rejectWithdrawal = (id) => {
  return apiClient.put(`/withdrawals/${id}/reject`);
};

export const markWithdrawalPaid = (id) => {
  return apiClient.put(`/withdrawals/${id}/mark-paid`);
};

export const getWithdrawal = (id) => {
  return apiClient.get(`/withdrawals/${id}`);
};

export const createWithdrawalAsAdmin = (data) => {
  return apiClient.post('/withdrawals', data);
};

export const updateWithdrawal = (id, data) => {
  return apiClient.put(`/withdrawals/${id}`, data);
};

export const deleteWithdrawal = (id) => {
  return apiClient.delete(`/withdrawals/${id}`);
};


// Investor-facing withdrawals and investments endpoints
export const getMyInvestments = (params = {}) => {
  return apiClient.get('/investor/investments', { params });
};

export const getMyWithdrawals = (params = {}) => {
  return apiClient.get('/investor/withdrawals', { params });
};

export const getAvailableWithdrawalAmount = (investmentId) => {
  return apiClient.get(`/investor/withdrawals/available/${investmentId}`);
};

export const createWithdrawal = (payload) => {
  return apiClient.post('/investor/withdrawals', payload);
};

