import { createRouter, createWebHistory } from 'vue-router';
import Login from './components/Login.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import AssistantDashboard from './components/AssistantDashboard.vue';
import InvestorDashboard from './components/InvestorDashboard.vue';
import Navbar from './components/Navbar.vue';
// Note: InvestorDashboard route was missing, ensure it's added if needed or remove if not used.
// For now, assuming it's used based on the import.

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
    path: '/admin-dashboard',
    components: { default: AdminDashboard, header: Navbar }, // Add Navbar
    meta: { requiresAuth: true, roles: ['admin'] } // Changed to roles array
  },
  {
    path: '/investor-dashboard',
    components: { default: InvestorDashboard, header: Navbar }, 
    meta: { requiresAuth: true, roles: ['investor'] } // Added InvestorDashboard route
  },
  {
    path: '/assistant-dashboard',
    components: { default: AssistantDashboard, header: Navbar },
    meta: { requiresAuth: true, roles: ['assistant'] } // Changed to roles array
  },
  {
    path: '/manage-users',
    name: 'ManageUsers',
    // component: ManageUsers, // Placeholder for future component
    redirect: '/admin-dashboard', // Redirect for now
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/system-settings',
    name: 'SystemSettings',
    // component: SystemSettings, // Placeholder for future component
    redirect: '/admin-dashboard', // Redirect for now
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/manage-clients',
    name: 'ManageClients',
    // component: ManageClients, // Placeholder for future component
    redirect: '/assistant-dashboard', // Redirect for now
    meta: { requiresAuth: true, roles: ['assistant'] }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    // component: Tasks, // Placeholder for future component
    redirect: '/assistant-dashboard', // Redirect for now
    meta: { requiresAuth: true, roles: ['assistant'] }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

import { useAuthStore } from './stores/auth'; // Import the auth store

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(); // Initialize the store
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.userRole;

  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      next('/login');
    } else if (to.meta.roles && !to.meta.roles.includes(userRole)) {
      // If roles are required and user's role is not in the list, redirect
      alert('You are not authorized to view this page.');
      // Redirect to their respective dashboard or a generic unauthorized page
      if (userRole === 'admin') next('/admin-dashboard');
      else if (userRole === 'assistant') next('/assistant-dashboard');
      else if (userRole === 'investor') next('/investor-dashboard');
      else next('/login'); // Fallback if role is unknown
    } else if (to.meta.role && to.meta.role !== userRole) { // Keep handling for single role meta if still used
        alert('You are not authorized to view this page (single role check).');
        // Redirect to their respective dashboard or a generic unauthorized page
        if (userRole === 'admin') next('/admin-dashboard');
        else if (userRole === 'assistant') next('/assistant-dashboard');
        else if (userRole === 'investor') next('/investor-dashboard');
        else next('/login'); // Fallback if role is unknown
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;