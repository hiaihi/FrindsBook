import { createRouter, createWebHistory } from 'vue-router'

// 导入视图组件
import HomePage from '../views/PortalPage.vue'
import LoginPage from '../views/Login.vue'
import RegisterPage from '../views/Register.vue'
import FriendCircle from '../views/FriendCircle.vue'
import ProfilePage from '../views/ProfilePage.vue'
import FriendList from '../views/FriendList.vue'
import EditProfile from '../views/EditProfile.vue'

const routes = [
  { path: '/', component: HomePage },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/profile', component: ProfilePage },
  { path: '/profile/:userId', component: ProfilePage },
  { path: '/edit-profile', component: EditProfile },
  { path: '/friend-circle', component: FriendCircle },
  { path: '/friend-list', component: FriendList },
  // 添加缺失的路由
  { path: '/messages', redirect: '/' },
  { path: '/notifications', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router