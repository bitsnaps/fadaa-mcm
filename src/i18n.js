import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

// Centralized i18n instance so it can be used outside components (e.g., axios interceptors)
export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'en',
  fallbackLocale: 'en',
  messages: { en, fr, ar },
});

export default i18n;

