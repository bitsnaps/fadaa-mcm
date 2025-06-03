import { createRouter, createWebHistory } from 'vue-router';
import Login from './components/Login.vue';
import SuperadminDashboard from './components/SuperadminDashboard.vue';
import AssistantDashboard from './components/AssistantDashboard.vue';
import InvestorDashboard from './components/InvestorDashboard.vue'; // Added InvestorDashboard
import Navbar from './components/Navbar.vue';

const routes = [
  {
    path: '/',
    redirect: '/login' // Redirect root to login
  },
  {
    path: '/login',
    components: { default: Login, header: Navbar }, // Add Navbar
    meta: { requiresAuth: false }
  },
  {
    path: '/superadmin-dashboard',
    components: { default: SuperadminDashboard, header: Navbar }, // Add Navbar
    meta: { requiresAuth: true, role: 'superadmin' }
  },
  {
    path: '/investor-dashboard',
    components: { default: InvestorDashboard, header: Navbar },
    meta: { requiresAuth: true, role: 'investor' }
  },
  {
    path: '/assistant-dashboard',
    components: { default: AssistantDashboard, header: Navbar },
    meta: { requiresAuth: true, role: 'assistant' }
  },
  {
    path: '/investor-dashboard',
    name: 'InvestorDashboard',
    components: { default: InvestorDashboard, header: Navbar },
    meta: { requiresAuth: true, role: 'investor' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole');

  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      next('/login');
    } else if (to.meta.role && to.meta.role !== userRole) {
      // If role is required and doesn't match, redirect to home or an unauthorized page
      // For simplicity, redirecting to home. In a real app, show an unauthorized page.
      alert('You are not authorized to view this page.');
      next('/');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;