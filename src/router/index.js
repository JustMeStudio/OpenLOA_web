import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/agent',
    name: 'AgentWork',
    component: () => import('@/views/AgentWorkView.vue')
  },
  {
    path: '/app',
    name: 'Admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/app/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue')
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/views/CoursesView.vue')
      },
      {
        path: 'practice',
        name: 'Practice',
        component: () => import('@/views/PracticeView.vue')
      },
      {
        path: 'community',
        name: 'Community',
        component: () => import('@/views/CommunityView.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/ProfileView.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue')
      },
      {
        path: 'assets',
        name: 'Assets',
        component: () => import('@/views/AssetsView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
