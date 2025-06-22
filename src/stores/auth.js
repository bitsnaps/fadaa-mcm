import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    userRole: localStorage.getItem('userRole') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    login(role, token) {
      this.token = token;
      this.userRole = role;
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
    },
    logout() {
      this.token = null;
      this.userRole = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
    },
  },
});