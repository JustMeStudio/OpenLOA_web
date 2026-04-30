import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/AuthView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/agent',
    name: 'AgentWork',
    component: () => import('@/views/AgentWorkView.vue'),
    meta: { requiresAuth: true }
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

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('access_token')
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/auth')
  } else if (to.path === '/auth' && isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
