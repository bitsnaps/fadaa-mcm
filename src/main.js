import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createBootstrap } from 'bootstrap-vue-next';
import App from './App.vue';
import router from './router';
import './assets/main.css'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(createBootstrap())
app.mount('#app')
