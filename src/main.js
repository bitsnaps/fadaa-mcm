import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createBootstrap } from 'bootstrap-vue-next';
import App from './App.vue';
import router from './router';
import './assets/main.css';
import i18n from './i18n';
import './style.css'
import { useThemeStore } from './stores/theme';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);

// Initialize theme store
const themeStore = useThemeStore();
themeStore.initTheme();

app.use(router);
app.use(i18n);
app.use(createBootstrap());
app.mount('#app');
