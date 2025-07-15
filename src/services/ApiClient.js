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

export function getClientsList() {
    return apiClient.get('/clients-list');
}

export function getAvailableOffices() {
    return apiClient.get('/offices-available');
}

export function addContract(formData) {
    return apiClient.post('/contracts', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}
