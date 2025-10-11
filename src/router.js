import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import { useAuthStore } from './stores/auth'; // Import the auth store
import { useNotificationStore } from './stores/notification';
import i18n from '@/i18n';
import Login from './views/Login.vue';
import AdminDashboard from './views/AdminDashboard.vue';
import AssistantDashboard from './views/AssistantDashboard.vue';
import ManagerDashboard from './views/ManagerDashboard.vue';
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
import SystemSettings from './views/SystemSettings.vue'; // Added SystemSettings import
import ManageNotifications from './views/ManageNotifications.vue'; // Added ManageNotifications import
import Tasks from './views/Tasks.vue'; // Added Tasks import
import ManageBranches from './views/ManageBranches.vue'; // Import ManageBranches
import ManageServiceCategories from './views/ManageServiceCategories.vue'; // Import ManageServiceCategories
import ManageClientServices from './views/ManageClientServices.vue'; // Import ManageClientServices
import ManageOffices from './views/ManageOffices.vue';
import InvestmentDetails from './views/InvestmentDetails.vue';
import ContractsManagement from './views/ContractsManagement.vue';
import DocumentsManagement from './views/DocumentsManagement.vue';
import OfficeDesigner from './views/OfficeDesigner.vue';
import MonthlyReport from './views/MonthlyReport.vue';
import AnnualReport from './views/AnnualReport.vue';
import ManageTaxes from './views/ManageTaxes.vue';
import ManageInvestments from './views/ManageInvestments.vue';
import ManageIncomes from './views/ManageIncomes.vue';
import ManageExpenses from './views/ManageExpenses.vue';
import ManageProfiles from './views/ManageProfiles.vue';
import ManageWithdrawals from './views/ManageWithdrawals.vue';
import FileManager from './views/FileManager.vue';
import ManagePendingDeletions from './views/ManagePendingDeletions.vue';
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
    path: '/manager-dashboard',
    components: { default: ManagerDashboard, header: Navbar },
    meta: { requiresAuth: true, roles: ['manager'] }
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
    components: { default: SystemSettings, header: Navbar }, // Use SystemSettings component and Navbar
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/manage-clients',
    name: 'ManageClients',
    component: ManageClients,
    meta: { requiresAuth: true, roles: ['admin','manager', 'assistant'] }
  },
  {
    path: '/add-client',
    name: 'AddClient',
    component: AddClient,
    meta: { requiresAuth: true, roles: ['admin', 'manager','assistant'] }
  },
  {
    path: '/edit-client/:clientId',
    name: 'EditClient',
    component: AddClient,
    meta: { requiresAuth: true, roles: ['admin', 'manager', 'assistant'] },
    props: true
  },
  {
    path: '/tasks',
    name: 'Tasks',
    components: { default: Tasks, header: Navbar }, // Use Tasks component and Navbar
    meta: { requiresAuth: true, roles: ['assistant', 'manager'] }
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
    meta: { requiresAuth: true, roles: ['admin', 'assistant', 'manager'] }
  },
  {
    path: '/financial-reporting',
    name: 'FinancialReporting',
    components: { default: FinancialReporting, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'assistant', 'manager'] }
  },
  {
    path: '/compliance-management',
    name: 'ComplianceManagement',
    components: { default: ComplianceManagement, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'assistant', 'manager'] }
  },
  {
    path: '/client-portal',
    name: 'ClientPortal',
    components: { default: ClientPortal, header: Navbar },
    meta: { requiresAuth: true, roles: ['client'] }
  },
  {
    path: '/manage-notifications',
    name: 'ManageNotifications',
    components: { default: ManageNotifications, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'assistant', 'manager'] }
  },
  {
    path: '/manage-branches',
    name: 'ManageBranches',
    components: { default: ManageBranches, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/manage-service-categories',
    name: 'ManageServiceCategories',
    components: { default: ManageServiceCategories, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/manage-client-services',
    name: 'ManageClientServices',
    components: { default: ManageClientServices, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'assistant', 'manager'] }
  },
  {
    path: '/manage-offices',
    name: 'ManageOffices',
    components: { default: ManageOffices, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/investment-details/:id',
    name: 'InvestmentDetails',
    components: { default: InvestmentDetails, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'investor'] }
  },
  {
    path: '/contracts-management',
    name: 'ContractsManagement',
    components: { default: ContractsManagement, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'assistant', 'manager'] }
  },
  {
    path: '/documents-management',
    name: 'DocumentsManagement',
    components: { default: DocumentsManagement, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'assistant', 'manager'] }
  },
  {
    path: '/office-designer',
    name: 'OfficeDesigner',
    components: { default: OfficeDesigner, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'assistant', 'manager'] }
  },
  {
    path: '/monthly-report',
    name: 'MonthlyReport',
    components: { default: MonthlyReport, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'manager'] }
  },
  {
    path: '/annual-report',
    name: 'AnnualReport',
    components: { default: AnnualReport, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'manager'] }
  },
  {
    path: '/manage-taxes',
    name: 'ManageTaxes',
    components: { default: ManageTaxes, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/manage-investments',
    name: 'ManageInvestments',
    components: { default: ManageInvestments, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/manage-incomes',
    name: 'ManageIncomes',
    components: { default: ManageIncomes, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin', 'manager', 'assistant'] }
  },
  {
    path: '/manage-expenses',
    name: 'ManageExpenses',
    components: { default: ManageExpenses, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin','manager', 'assistant'] }
  },
  {
    path: '/manage-withdrawals',
    name: 'ManageWithdrawals',
    components: { default: ManageWithdrawals, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/manage-profiles',
    name: 'ManageProfiles',
    components: { default: ManageProfiles, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/file-manager',
    name: 'FileManager',
    components: { default: FileManager, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/manage-pending-deletions',
    name: 'ManagePendingDeletions',
    components: { default: ManagePendingDeletions, header: Navbar },
    meta: { requiresAuth: true, roles: ['admin'] }
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(); // Initialize the store
  const notificationStore = useNotificationStore();
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.userRole;

  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      next('/login');
    } else if (to.meta.roles && !to.meta.roles.includes(userRole)) {
      // If roles are required and user's role is not in the list, redirect
      notificationStore.setNotification({ message: i18n.global.t('errors.forbidden'), type: 'error' });
      // Redirect to their respective dashboard or a generic unauthorized page
      if (userRole === 'admin') next('/admin-dashboard');
      else if (userRole === 'assistant') next('/assistant-dashboard');
      else if (userRole === 'manager') next('/manager-dashboard');
      else if (userRole === 'investor') next('/investor-dashboard');
      else if (userRole === 'client') next('/client-portal');
      else next('/login'); // Fallback if role is unknown
    } else if (to.meta.role && to.meta.role !== userRole) { // Keep handling for single role meta if still used
        notificationStore.setNotification({ message: i18n.global.t('errors.forbidden'), type: 'error' });
        // Redirect to their respective dashboard or a generic unauthorized page
        if (userRole === 'admin') next('/admin-dashboard');
        else if (userRole === 'assistant') next('/assistant-dashboard');
        else if (userRole === 'manager') next('/manager-dashboard');
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