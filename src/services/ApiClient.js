import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api';
  }
  // In production, use same origin or configured URL
  return import.meta.env.VITE_API_BASE_URL || window.location.origin;
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

export function getContracts() {
    return apiClient.get('/contracts');
}

export function getClients() {
    return apiClient.get('/clients');
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

export const getInvestmentsList = () => {
    return apiClient.get('/misc/investments');
};

export const getInvestments = () => {
    return apiClient.get('/investments');
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
