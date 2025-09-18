import { createApp } from 'vue'
import { createPinia } from 'pinia';
import App from './App.vue'
import router from './router' // router/index.js 에서 만든 라우터 가져오기

const app = createApp(App)
const pinia = createPinia();
app.use(router) // Vue 앱에 라우터 등록

app.use(pinia)

app.mount('#app')