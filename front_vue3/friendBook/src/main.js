import axios from 'axios';
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router' 
import VueAxios from 'vue-axios'
import App from './App.vue'
import router from './router/index.js'

const app = createApp(App)
app.use(router)
app.mount('#app')
