
<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';
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

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <BNavbar toggleable="lg" variant="fadaa-blue" class="fixed-top navbar-dark">
    <BNavbarBrand href="/" class="d-flex align-items-center">
      <BImg src="/src/public/logo.png" alt="FADAA Logo" width="30" height="30" class="d-inline-block align-text-top me-2 rounded-circle" />
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
      <BNavbarNav class="ms-auto align-items-center">
        <BNavItem v-if="!isAuthenticated" :to="{ path: '/login' }" :active="$route.path === '/login'" link-classes="nav-link">
          Login
        </BNavItem>        
        <template v-else>
          <BNavItemDropdown id="notificationDropdown" right menu-class="dropdown-menu-end">
            <template #button-content>
              <i class="bi bi-bell-fill"></i>
              <span class="badge rounded-pill bg-danger">3</span> <!-- Mock notification count -->
            </template>
            <BDropdownItem href="#">Notification 1</BDropdownItem>
            <BDropdownItem href="#">Notification 2</BDropdownItem>
            <BDropdownItem divider />
            <BDropdownItem href="#">View all notifications</BDropdownItem>
          </BNavItemDropdown>

          <BNavItemDropdown id="userProfileDropdown" right menu-class="dropdown-menu-end">
            <template #button-content>
              <i class="bi bi-person-circle me-1"></i> {{ userRole }}
            </template>
            <BDropdownItem :to="{ path: '/profile' }"><i class="bi bi-person-fill me-2"></i>Profile</BDropdownItem>
            <BDropdownItem :to="{ path: '/settings' }"><i class="bi bi-gear-fill me-2"></i>Settings</BDropdownItem>
            <BDropdownItem divider />
            <BDropdownItem @click.prevent="handleLogout"><i class="bi bi-box-arrow-right me-2"></i>Logout</BDropdownItem>
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
