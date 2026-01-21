
<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';
import { useNotificationStore } from '@/stores/notification';
import { useI18n } from 'vue-i18n';
import { getUnreadNotifications, markNotificationsAsRead } from '@/services/notificationService';
import { useToast } from '@/helpers/toast';
import {
  BNavbar,
  BNavbarBrand,
  BNavbarToggle,
  BCollapse,
  BNavbarNav,
  BNavItem,
  BNavItemDropdown,
  BDropdownItem,
  BImg,
  BButton,
  BFormInput
} from 'bootstrap-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const sidebarStore = useSidebarStore();
const notificationStore = useNotificationStore();
const { showInfoToast } = useToast();
const { locale, t } = useI18n();

// Command Palette Logic
const searchInputRef = ref(null);
const searchQuery = ref('');
const showPaletteResults = ref(false);
const selectedPaletteIndex = ref(0);

const allRoutes = [
  // Admin only
  { path: '/manage-profiles', label: 'sidebar.manageProfiles', roles: ['admin'] },
  { path: '/admin-dashboard', label: 'sidebar.adminDashboard', roles: ['admin'] },
  { path: '/manage-users', label: 'sidebar.manageUsers', roles: ['admin'] },
  { path: '/manage-branches', label: 'sidebar.manageBranches', roles: ['admin'] },
  { path: '/manage-service-categories', label: 'sidebar.manageServiceCategories', roles: ['admin'] },
  { path: '/manage-categories', label: 'sidebar.manageCategories', roles: ['admin'] },
  { path: '/manage-taxes', label: 'sidebar.manageTaxes', roles: ['admin'] },
  { path: '/manage-offices', label: 'sidebar.manageOffices', roles: ['admin'] },
  { path: '/office-designer', label: 'sidebar.officeDesigner', roles: ['admin'] },
  { path: '/file-manager', label: 'sidebar.fileManager', roles: ['admin'] },
  { path: '/system-settings', label: 'systemSettings.title', roles: ['admin'] },
  { path: '/manage-pending-deletions', label: 'sidebar.managePendingDeletions', roles: ['admin'] },
  { path: '/manage-investments', label: 'sidebar.manageInvestments', roles: ['admin'] },
  { path: '/manage-withdrawals', label: 'sidebar.manageWithdrawals', roles: ['admin'] },
  { path: '/investment-tracking', label: 'sidebar.investmentTracking', roles: ['admin'] },
  { path: '/financial-reporting', label: 'sidebar.financialReporting', roles: ['admin'] },
  
  // Manager only
  { path: '/manager-dashboard', label: 'sidebar.managerDashboard', roles: ['manager'] },
  
  // Assistant only
  { path: '/assistant-dashboard', label: 'sidebar.assistantDashboard', roles: ['assistant'] },
  
  // Shared (Admin, Manager, Assistant)
  { path: '/manage-clients', label: 'sidebar.manageClients', roles: ['admin', 'manager', 'assistant'] },
  { path: '/add-client', label: 'sidebar.addClient', roles: ['admin', 'manager', 'assistant'] },
  { path: '/documents-management', label: 'documents.title', roles: ['admin', 'manager', 'assistant'] },
  { path: '/compliance-management', label: 'sidebar.complianceManagement', roles: ['admin', 'manager', 'assistant'] },
  { path: '/contracts-management', label: 'contracts.title', roles: ['admin', 'manager', 'assistant'] },
  { path: '/manage-client-services', label: 'sidebar.manageClientServices', roles: ['admin', 'manager', 'assistant'] },
  { path: '/manage-incomes', label: 'sidebar.manageIncomes', roles: ['admin', 'manager', 'assistant'] },
  { path: '/manage-expenses', label: 'sidebar.manageExpenses', roles: ['admin', 'manager', 'assistant'] },
  
  // Shared (Assistant, Manager)
  { path: '/tasks', label: 'sidebar.tasks', roles: ['assistant', 'manager'] },
  
  // Shared (Admin, Manager)
  { path: '/monthly-report', label: 'sidebar.monthlyReport', roles: ['admin', 'manager'] },
  { path: '/annual-report', label: 'sidebar.annualReport', roles: ['admin', 'manager'] },
];

const accessibleRoutes = computed(() => {
  if (!isAuthenticated.value) return [];
  return allRoutes.filter(r => r.roles.includes(userRole.value));
});

const filteredPaletteRoutes = computed(() => {
  if (!searchQuery.value) return [];
  const query = searchQuery.value.toLowerCase();
  return accessibleRoutes.value.filter(r => t(r.label).toLowerCase().includes(query));
});

const handlePaletteKeydown = (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (selectedPaletteIndex.value < filteredPaletteRoutes.value.length - 1) {
      selectedPaletteIndex.value++;
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (selectedPaletteIndex.value > 0) {
      selectedPaletteIndex.value--;
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedPaletteIndex.value >= 0 && filteredPaletteRoutes.value[selectedPaletteIndex.value]) {
      navigateTo(filteredPaletteRoutes.value[selectedPaletteIndex.value]);
    }
  } else if (e.key === 'Escape') {
    showPaletteResults.value = false;
    searchInputRef.value?.blur();
  }
};

const navigateTo = (routeObj) => {
  router.push(routeObj.path);
  searchQuery.value = '';
  showPaletteResults.value = false;
  selectedPaletteIndex.value = 0;
};

const handleGlobalKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    searchInputRef.value?.focus();
    // Optional: show results immediately or wait for typing? 
    // User said "displayed once the user starts typing", but also "maintain focus".
    // Usually focusing is enough.
  }
};

watch(searchQuery, (newVal) => {
  if (newVal) {
    showPaletteResults.value = true;
    selectedPaletteIndex.value = 0;
  } else {
    showPaletteResults.value = false;
  }
});

const unreadCount = computed(() => notificationStore.unreadCount);
const latestUnread = computed(() => notificationStore.latestUnread);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const userRole = computed(() => authStore.userRole);

const toggleSidebar = () => {
  sidebarStore.toggleSidebar();
};

const showSidebar = computed(() => {
  // Show toggle only if authenticated and not on login page, and user role is admin or assistant
  return isAuthenticated.value && ['admin', 'manager', 'assistant'].includes(userRole.value) && route.path !== '/login';
});

const isSidebarCollapsed = computed(() => sidebarStore.isCollapsed );

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
  if (isAuthenticated.value) {
    pollNotifications();
    pollingInterval = setInterval(pollNotifications, 10000); // Poll every 10 seconds
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
});
const setLocale = (lang) => {
  locale.value = lang;
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
let pollingInterval = null;

const pollNotifications = async () => {
  if (!isAuthenticated.value) return;

  try {
    const response = await getUnreadNotifications();
    if (response.data.success) {
      const newCount = response.data.unreadCount;
      const newLatest = response.data.latestUnread;

      // If there's a new notification, show a toast
      if (newCount > unreadCount.value) {
         // Find which notifications are actually new since the last poll
        const newNotifications = newLatest.filter(newN =>
          !latestUnread.value.some(oldN => oldN.id === newN.id)
        );
        
        newNotifications.forEach(n => {
          showInfoToast(n.message);
        });
      }

      notificationStore.setUnreadNotifications(response.data);
    }
  } catch (error) {
    console.error('Failed to poll notifications:', error);
  }
};

const handleNotificationDropdownClick = async () => {
  if (unreadCount.value === 0) return;

  const unreadIds = latestUnread.value.filter(n => !n.is_read).map(n => n.id);
  if (unreadIds.length > 0) {
    try {
      await markNotificationsAsRead(unreadIds);
      pollNotifications(); // Re-poll to update the count immediately
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'NewTask': return 'bi-list-task';
    case 'TaskUpdate': return 'bi-pencil-square';
    case 'ContractReminder': return 'bi-file-earmark-text';
    case 'SystemAlert': return 'bi-exclamation-triangle';
    case 'InvestorContractExpiry': return 'bi-calendar-x';
    case 'HighValueTransaction': return 'bi-cash-coin';
    case 'OfficeBookingRequest': return 'bi-building-add';
    case 'ClientDeletion': return 'bi-person-x';
    default: return 'bi-bell';
  }
};

const getNotificationLink = (notification) => {
    if (!notification.related_entity_type || !notification.related_entity_id) {
        return '#';
    }
    switch (notification.related_entity_type) {
        case 'investment':
            return `/investments/${notification.related_entity_id}`;
        case 'expense':
            return `/manage-expenses`;
        case 'income':
            return `/manage-incomes`;
        case 'office':
            return `/manage-offices`;
        case 'client':
            return `/manage-clients`;
        default:
            return '#';
    }
};


</script>

<template>
  <BNavbar toggleable="lg" variant="fadaa-blue" class="fixed-top navbar-dark">
    <BNavbarBrand :to="{ path: '/' }" class="d-flex align-items-center">
      <BImg src="/logo.png" alt="FADAA Logo" width="30" height="30" class="d-inline-block align-text-top m-2 rounded-circle" />
      FADAA-MCM
    </BNavbarBrand>

    <!-- Sidebar Toggle Button -->
    <BButton v-if="showSidebar"
            @click="toggleSidebar"
            class="sidebar-toggle"
            variant="fadaa-orange"
             squared>
      <i class="bi" :class="isSidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'"></i>
    </BButton>

    <BNavbarToggle target="nav-collapse" />

    <BCollapse id="nav-collapse" is-nav>
      <!-- Command Palette Search Input -->
      <div class="d-flex align-items-center position-relative me-auto ms-3 command-palette-container" style="min-width: 250px;" v-if="isAuthenticated">
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0 text-white-50 border-secondary">
            <i class="bi bi-search"></i>
          </span>
          <BFormInput
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="form-control bg-transparent text-white border-start-0 ps-0 shadow-none command-palette-input border-secondary"
            placeholder="Search... (Ctrl+K)"
            @keydown="handlePaletteKeydown"
            autocomplete="off"
          />
        </div>
        
        <!-- Search Results Dropdown -->
        <div v-if="showPaletteResults" class="dropdown-menu show position-absolute w-100 mt-1 shadow-lg command-palette-results" style="top: 100%; left: 0; max-height: 300px; overflow-y: auto;">
          <template v-if="filteredPaletteRoutes.length > 0">
            <a
              v-for="(routeItem, index) in filteredPaletteRoutes"
              :key="routeItem.path"
              href="#"
              class="dropdown-item d-flex align-items-center justify-content-between"
              :class="{ 'active': index === selectedPaletteIndex }"
              @click.prevent="navigateTo(routeItem)"
              @mouseenter="selectedPaletteIndex = index"
            >
              <span>{{ t(routeItem.label) }}</span>
              <i class="bi bi-arrow-return-left text-muted" style="font-size: 0.8rem;"></i>
            </a>
          </template>
          <div v-else class="px-3 py-2 text-muted text-center">
             {{ t('navbar.notifications.noNewNotifications').replace('Notifications', 'Results') || 'No results' }}
          </div>
        </div>
      </div>

      <BNavbarNav :class="[locale === 'ar' ? 'me-auto' : 'ms-auto', 'align-items-center']">
        <BNavItemDropdown :text="t('navbar.language')" right>
          <BDropdownItem @click="setLocale('en')">🇺🇸 English</BDropdownItem>
          <BDropdownItem @click="setLocale('fr')">🇫🇷 Français</BDropdownItem>
          <BDropdownItem @click="setLocale('ar')">🇩🇿 العربية</BDropdownItem>
        </BNavItemDropdown>
        <BNavItem v-show="!route.path.endsWith('/login')" v-if="!isAuthenticated" :to="{ path: '/login' }" :active="$route.path === '/login'" link-classes="nav-link">
          {{ t('navbar.login') }}
        </BNavItem>
        <template v-else>
          <BNavItemDropdown id="notificationDropdown" right menu-class="dropdown-menu-end" @show="handleNotificationDropdownClick">
            <template #button-content>
              <i class="bi bi-bell-fill"></i>
              <span v-if="unreadCount > 0" class="badge rounded-pill bg-danger">{{ unreadCount }}</span>
            </template>
            <BDropdownItem v-for="notification in latestUnread" :key="notification.id" :to="getNotificationLink(notification)" link-class="d-flex align-items-center">
                <i :class="['bi', getNotificationIcon(notification.type), 'm-2']"></i>
                <div class="flex-grow-1">
                    <p class="mb-0 fw-bold">{{ notification.message }}</p>
                    <small class="text-muted">{{ new Date(notification.created_at).toLocaleString() }}</small>
                </div>
            </BDropdownItem>
            <BDropdownItem v-if="latestUnread.length === 0" disabled>{{ t('navbar.notifications.noNewNotifications') }}</BDropdownItem>
            <BDropdownItem divider />
            <BDropdownItem :to="{ path: '/manage-notifications' }">{{ t('navbar.notifications.viewAll') }}</BDropdownItem>
          </BNavItemDropdown>

          <BNavItemDropdown id="userProfileDropdown" right menu-class="dropdown-menu-end">
            <template #button-content>
              <i class="bi bi-person-circle m-1"></i> {{ userRole }}
            </template>
            <BDropdownItem :to="{ path: '/profile' }"><i class="bi bi-person-fill m-2"></i>{{ t('navbar.user.profile') }}</BDropdownItem>
            <BDropdownItem :to="{ path: '/settings' }"><i class="bi bi-gear-fill m-2"></i>{{ t('navbar.user.settings') }}</BDropdownItem>
            <!-- <BDropdownItem v-if="userRole === 'admin' || userRole === 'assistant'" :to="{ path: '/manage-notifications' }"><i class="bi bi-bell-slash-fill m-2"></i>Gérer les Notifications</BDropdownItem> -->
            <BDropdownItem divider />
            <BDropdownItem @click.prevent="handleLogout"><i class="bi bi-box-arrow-right m-2"></i>{{ t('navbar.user.logout') }}</BDropdownItem>
          </BNavItemDropdown>
        </template>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<style scoped>
/* Sidebar toggle button styles */
.sidebar-toggle {
  position: relative;
  left: 0;
  top: 0;
  z-index: 1000;
  width: 25px;
  height: 25px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-right: 2px;
}

.navbar-brand img {
  border-radius: 50%; /* Make logo circular if desired */
}

.nav-link.active-fadaa {
  color: var(--fadaa-yellow) !important; /* Yellow from PRD for active link */
  font-weight: bold;
}

.navbar-dark .navbar-nav .nav-link:hover,
.navbar-dark .navbar-nav .nav-link:focus {
  color: var(--fadaa-yellow); /* Yellow for hover/focus */
}

/* .navbar-text color is handled by Bootstrap or can be customized if needed */

.dropdown-menu {
  font-size: 0.9rem;
}

.dropdown-item:active {
  background-color: var(--fadaa-orange); /* FADAA Orange for active dropdown item */
  color: var(--fadaa-light-text) !important;
}

/* Ensure fixed top navbar doesn't overlap content - this is now handled in style.css */

.command-palette-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
.command-palette-input:focus {
  box-shadow: none;
  border-color: rgba(255, 255, 255, 0.5) !important;
}
.dropdown-item.active {
    background-color: var(--fadaa-orange) !important;
    color: white !important;
}
.dropdown-item.active .text-muted {
    color: rgba(255,255,255,0.8) !important;
}
</style>
