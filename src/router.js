import { createRouter, createWebHistory } from 'vue-router';
import Login from './views/Login.vue';
import AdminDashboard from './views/AdminDashboard.vue';
import AssistantDashboard from './views/AssistantDashboard.vue';
import InvestorDashboard from './views/InvestorDashboard.vue';
import ManageClients from './views/ManageClients.vue';
import AddClient from './views/AddClient.vue';
import UserProfile from './views/UserProfile.vue';
import UserSettings from './views/UserSettings.vue';
import InvestmentTracking from './views/InvestmentTracking.vue';
import FinancialReporting from './views/FinancialReporting.vue';
import ComplianceManagement from './views/ComplianceManagement.vue';
import ClientPortal from './views/ClientPortal.vue';
import ManageUsers from './views/ManageUsers.vue'; // Added ManageUsers import
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
    components: { default: ManageUsers, header: Navbar }, // Use ManageUsers component and Navbar
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
    component: ManageClients, // Placeholder for future component
    // redirect: '/assistant-dashboard', // Redirect for now
    meta: { requiresAuth: true, roles: ['admin','assistant'] }
  },
  {
    path: '/add-client',
    name: 'AddClient',
    component: AddClient,
    meta: { requiresAuth: true, roles: ['admin','assistant'] }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    // component: Tasks, // Placeholder for future component
    redirect: '/assistant-dashboard', // Redirect for now
    meta: { requiresAuth: true, roles: ['assistant'] }
  },
  {
    path: '/profile',
    name: 'UserProfile',
    components: { default: UserProfile, header: Navbar },
    meta: { requiresAuth: true } // Accessible to all authenticated users
  },
  {
    path: '/settings',
    name: 'UserSettings',
    components: { default: UserSettings, header: Navbar },
    meta: { requiresAuth: true } // Accessible to all authenticated users
  },
  {
    path: '/investment-tracking',
    name: 'InvestmentTracking',
    components: { default: InvestmentTracking, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'assistant'] }
  },
  {
    path: '/financial-reporting',
    name: 'FinancialReporting',
    components: { default: FinancialReporting, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'assistant'] }
  },
  {
    path: '/compliance-management',
    name: 'ComplianceManagement',
    components: { default: ComplianceManagement, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'assistant'] }
  },
  {
    path: '/client-portal',
    name: 'ClientPortal',
    components: { default: ClientPortal, header: Navbar },
    meta: { requiresAuth: true, roles: ['client'] } // Assuming 'client' role for now
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
      else if (userRole === 'client') next('/client-portal');
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