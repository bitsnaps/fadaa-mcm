import { watch, onMounted, onUnmounted } from 'vue';
import { useThemeStore } from '@/stores/theme';

export function useTheme() {
  const themeStore = useThemeStore();

  const applyTheme = (theme) => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  const mediaQueryListener = (e) => {
    if (themeStore.theme === 'system') {
      document.documentElement.classList.toggle('dark', e.matches);
    }
  };

  watch(() => themeStore.theme, (newTheme) => {
    applyTheme(newTheme);
  });

  onMounted(() => {
    applyTheme(themeStore.theme);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', mediaQueryListener);
  });

  onUnmounted(() => {
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', mediaQueryListener);
  });
}