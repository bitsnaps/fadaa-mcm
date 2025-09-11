
<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';
import { useI18n } from 'vue-i18n';
import { getNotifications, markNotificationsAsRead } from '@/services/notificationService';
import { BModal } from 'bootstrap-vue-next';
import {
  BNavbar,
  BNavbarBrand,
  BNavbarToggle,
  BCollapse,
  BNavbarNav,
  BNavItem,
  BNavItemDropdown,
  BDropdownItem,
  BImg
} from 'bootstrap-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const sidebarStore = useSidebarStore();

const notifications = ref([]);
const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);


const isAuthenticated = computed(() => authStore.isAuthenticated);
const userRole = computed(() => authStore.userRole);

const toggleSidebar = () => {
  sidebarStore.toggleSidebar();
};

const showSidebar = computed(() => {
  // Show toggle only if authenticated and not on login page, and user role is admin or assistant
  return isAuthenticated.value && ['admin', 'assistant'].includes(userRole.value) && route.path !== '/login';
});

const isSidebarCollapsed = computed(() => sidebarStore.isCollapsed );

const { locale, t } = useI18n();

const setLocale = (lang) => {
  locale.value = lang;
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
const fetchNotifications = async () => {
  try {
    const response = await getNotifications();
    if (response.data.success) {
      notifications.value = response.data.notifications;
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }
};

const handleNotificationDropdownClick = async () => {
  const unreadIds = notifications.value.filter(n => !n.is_read).map(n => n.id);
  if (unreadIds.length > 0) {
    try {
      await markNotificationsAsRead(unreadIds);
      // Refresh notifications to update read status
      fetchNotifications();
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

onMounted(() => {
  if (isAuthenticated.value) {
    fetchNotifications();
    setInterval(fetchNotifications, 60000); // Refresh every minute
  }
});
</script>

<template>
  <BNavbar toggleable="lg" variant="fadaa-blue" class="fixed-top navbar-dark">
    <BNavbarBrand :to="{ path: '/' }" class="d-flex align-items-center">
      <BImg src="/logo.png" alt="FADAA Logo" width="30" height="30" class="d-inline-block align-text-top me-2 rounded-circle" />
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
      <BNavbarNav :class="[locale === 'ar' ? 'me-auto' : 'ms-auto', 'align-items-center']">
        <BNavItemDropdown :text="t('navbar.language')" right>
          <BDropdownItem @click="setLocale('en')">{{ t('navbar.english') }}</BDropdownItem>
          <BDropdownItem @click="setLocale('fr')">{{ t('navbar.french') }}</BDropdownItem>
          <BDropdownItem @click="setLocale('ar')">{{ t('navbar.arabic') }}</BDropdownItem>
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
            <BDropdownItem v-for="notification in notifications" :key="notification.id" :to="getNotificationLink(notification)" link-class="d-flex align-items-center">
                <i :class="['bi', getNotificationIcon(notification.type), 'me-2']"></i>
                <div class="flex-grow-1">
                    <p class="mb-0" :class="{'fw-bold': !notification.is_read}">{{ notification.message }}</p>
                    <small class="text-muted">{{ new Date(notification.created_at).toLocaleString() }}</small>
                </div>
                <BButton variant="light" size="sm" class="ms-2" @click.stop.prevent="markNotificationsAsRead([notification.id])" v-if="!notification.is_read">
                    <i class="bi bi-check"></i>
                </BButton>
            </BDropdownItem>
            <BDropdownItem v-if="notifications.length === 0" disabled>{{ t('navbar.notifications.noNewNotifications') }}</BDropdownItem>
            <BDropdownItem divider />
            <BDropdownItem :to="{ path: '/manage-notifications' }">{{ t('navbar.notifications.viewAll') }}</BDropdownItem>
          </BNavItemDropdown>

          <BNavItemDropdown id="userProfileDropdown" right menu-class="dropdown-menu-end">
            <template #button-content>
              <i class="bi bi-person-circle me-1"></i> {{ userRole }}
            </template>
            <BDropdownItem :to="{ path: '/profile' }"><i class="bi bi-person-fill me-2"></i>{{ t('navbar.user.profile') }}</BDropdownItem>
            <BDropdownItem :to="{ path: '/settings' }"><i class="bi bi-gear-fill me-2"></i>{{ t('navbar.user.settings') }}</BDropdownItem>
            <!-- <BDropdownItem v-if="userRole === 'admin' || userRole === 'assistant'" :to="{ path: '/manage-notifications' }"><i class="bi bi-bell-slash-fill me-2"></i>Gérer les Notifications</BDropdownItem> -->
            <BDropdownItem divider />
            <BDropdownItem @click.prevent="handleLogout"><i class="bi bi-box-arrow-right me-2"></i>{{ t('navbar.user.logout') }}</BDropdownItem>
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
  border-radius: 30%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
</style>
