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
  (response) => response,
  (error) => {
    const notificationStore = useNotificationStore();
    const { t } = i18n.global;

    let message = t('errors.unknown');
    const status = error?.response?.status;

    if (error.code === 'ECONNABORTED') {
      message = t('errors.timeout');
    } else if (!error.response) {
      // Network or CORS
      message = t('errors.network');
    } else if (status === 401) {
      message = t('errors.unauthorized');
      // clear auth and optionally redirect
      const authStore = useAuthStore();
      authStore.logout();
    } else if (status === 403) {
      message = t('errors.forbidden');
    } else if (status === 404) {
      message = t('errors.notFound');
    } else if (status === 422 || status === 400) {
      // Validation or bad request
      const backendMsg = error.response.data?.message;
      message = backendMsg ? backendMsg : t('errors.validation');
    } else if (status >= 500) {
      message = t('errors.server');
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    }

    // Surface as a global notification
    notificationStore.setNotification({ message, type: 'error' });

    return Promise.reject(error);
  }
);

export default apiClient;
