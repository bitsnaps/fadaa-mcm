import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notification';
import i18n from '@/i18n';

const apiClient = axios.create({
  baseURL: '/api',
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
  (error) => Promise.reject(error)
);

// Centralized error handler: map Axios errors to user-friendly, localized messages
apiClient.interceptors.response.use(
  (response) => {
    // Success toast for write ops if backend supplies a message
    try {
      const notificationStore = useNotificationStore();
      const method = (response.config?.method || '').toLowerCase();
      const isWrite = method === 'post' || method === 'put' || method === 'delete' || method === 'patch';
      const msg = response.data?.message;

      if (isWrite && msg) {
        notificationStore.setNotification({ message: msg, type: 'success' });
      }
    } catch {}
    return response;
  },
  (error) => {
    const notificationStore = useNotificationStore();
    const { t } = i18n.global;

    let message = t('errors.unknown');
    const status = error?.response?.status;

    if (error.code === 'ECONNABORTED') {
      message = t('errors.timeout');
    } else if (!error.response) {
      message = t('errors.network');
    } else if (status === 401) {
      message = t('errors.unauthorized');
      const authStore = useAuthStore();
      authStore.logout();
    } else if (status === 403) {
      message = t('errors.forbidden');
    } else if (status === 404) {
      message = t('errors.notFound');
    } else if (status === 422 || status === 400) {
      const backendMsg = error.response.data?.message;
      message = backendMsg ? backendMsg : t('errors.validation');
    } else if (status >= 500) {
      message = t('errors.server');
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    }

    notificationStore.setNotification({ message, type: 'error' });

    return Promise.reject(error);
  }
);

export default apiClient;
