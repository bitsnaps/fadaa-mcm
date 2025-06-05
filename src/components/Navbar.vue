
<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';

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
  <nav class="navbar navbar-expand-lg navbar-dark bg-fadaa-blue fixed-top">
    <div class="container-fluid">
      <a class="navbar-brand d-flex align-items-center" href="#">
        <img src="/src/public/logo.png" alt="FADAA Logo" width="30" height="30" class="d-inline-block align-text-top me-2">
        FADAA-MCM
      </a>
      
      <!-- Sidebar Toggle Button (visible on smaller screens) -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarMenu" aria-controls="sidebarMenu" aria-expanded="false" aria-label="Toggle navigation" v-if="showSidebar">
        <span class="navbar-toggler-icon"></span>
      </button>

        <!-- Sidebar Toggle Button -->
        <button v-if="showSidebar" 
                @click="toggleSidebar" 
                class="btn btn-sm btn-fadaa-orange sidebar-toggle">
          <i class="bi" :class="isSidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'"></i>
        </button>

      <div class="collapse navbar-collapse" id="navbarNavDropdown">
        <ul class="navbar-nav ms-auto align-items-center">
          <li class="nav-item" v-if="!isAuthenticated">
            <router-link to="/login" class="nav-link" :class="{ 'active-fadaa': $route.path === '/login' }">Login</router-link>
          </li>
          
          <template v-if="isAuthenticated">
            <li class="nav-item">
              <span class="navbar-text me-3">
                Welcome, {{ userRole }}
              </span>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-bell-fill"></i>
                <span class="badge rounded-pill bg-danger">3</span> <!-- Mock notification count -->
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdownMenuLink">
                <li><a class="dropdown-item" href="#">Notification 1</a></li>
                <li><a class="dropdown-item" href="#">Notification 2</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#">View all notifications</a></li>
              </ul>
            </li>
            <li class="nav-item">
              <a href="#" @click.prevent="handleLogout" class="nav-link">
                <i class="bi bi-box-arrow-right me-1"></i>Logout
              </a>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
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
