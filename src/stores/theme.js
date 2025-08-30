import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { getSettings } from '@/services/SystemSettingsService';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('theme') || 'system');

  const fetchDefaultTheme = async () => {
    try {
      const response = await getSettings();
      return response.data.defaultTheme || 'system';
    } catch (error) {
      console.error('Failed to fetch default theme:', error);
      return 'system'; // Fallback to system default
    }
  };

  const initTheme = async () => {
    const storedTheme = localStorage.getItem('theme');
    if (!storedTheme) {
      theme.value = await fetchDefaultTheme();
    } else {
      theme.value = storedTheme;
    }
  };

  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme);
  });

  return { theme, initTheme };
});