import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next';
import { createI18n } from 'vue-i18n';
import { createPinia } from 'pinia';
import App from './App.vue'
import router from './router' // Import the router
import './style.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import 'bootstrap-icons/font/bootstrap-icons.css' // Import Bootstrap Icons

const pinia = createPinia()



const app = createApp(App)
app.use(router) // Use the router
app.use(pinia)
app.use(createBootstrap())
app.mount('#app')
