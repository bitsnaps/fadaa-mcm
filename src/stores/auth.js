import { defineStore } from 'pinia';
import apiClient from '../services/ApiClient';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role?.name.toLowerCase(),
  },
  actions: {
    async login(credentials) {
      try {
        const response = await apiClient.post('/login', credentials);
        const { user, token } = response.data;
        this.user = user;
        this.token = token;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        return true;
      } catch (error) {
        console.error(error);
      }
      return false;
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    updateUser(updatedFields) {
      if (this.user) {
        this.user = { ...this.user, ...updatedFields };
        localStorage.setItem('user', JSON.stringify(this.user));
      }
    },
    updateUserProfilePicture(profilePictureUrl) {
      if (this.user) {
        this.user.profile_picture = profilePictureUrl;
        localStorage.setItem('user', JSON.stringify(this.user));
      }
    },
  },
});