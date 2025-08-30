<script setup>
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BToastOrchestrator } from 'bootstrap-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';
import { useNotificationStore } from '@/stores/notification';
import Navbar from '@/components/Navbar.vue';
import Sidebar from '@/components/Sidebar.vue';
import { useToast } from '@/helpers/toast';
import { useTheme } from '@/composables/useTheme';

// Initialize the theme management
useTheme();

const route = useRoute();
const authStore = useAuthStore();
const sidebarStore = useSidebarStore();
const { showErrorToast, showSuccessToast, showInfoToast } = useToast();

const userRole = computed(() => authStore.userRole);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isSidebarCollapsed = computed(() => sidebarStore.isCollapsed);
const notificationStore = useNotificationStore();

const showSidebar = computed(() => {
  // Show sidebar only for admin and assistant roles and if authenticated
  return isAuthenticated.value && ['admin', 'assistant'].includes(userRole.value) && route.path !== '/login';
});

watch(() => notificationStore.notification, (newNotification) => {
  if (newNotification && route.path !== '/login') {
    // Avoid duplicate errors on login page (inline + toast)
    // Show appropriate toast based on notification type
    switch (newNotification.type) {
      case 'success':
        showSuccessToast(newNotification.message);
        break;
      case 'error':
        showErrorToast(newNotification.message);
        break;
      default:
        // Fallback to info for unknown types
        showInfoToast(newNotification.message);
        break;
    }
  }
  if (newNotification) {
    notificationStore.clearNotification();
  }
});
</script>

<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <BToastOrchestrator />
    <header>
      <Navbar />
    </header>

    <div class="container-fluid flex-grow-1">
      <div class="row position-relative">

        <!-- Sidebar -->
        <Sidebar v-if="showSidebar" />

        <!-- Main content area -->
        <main :class="{
          'col-md-9 ms-sm-auto col-lg-10 px-md-4': showSidebar && !isSidebarCollapsed,
          'col-12': !showSidebar || isSidebarCollapsed,
          'content-shifted': showSidebar && !isSidebarCollapsed
        }">
          <router-view />
        </main>
             
      </div>
    </div>
    <footer class="bg-dark text-white text-center p-3 mt-auto">
      <p>&copy; {{ new Date().getFullYear() }} FADAA-MCM. All rights reserved.</p>
    </footer>
  </div>
</template>

<style>
/* Transition for main content area */
main {
  transition: all 0.3s ease;
  padding-left: 2rem; /* Space for the toggle button */
}

.content-shifted {
  padding-left: 3rem; /* Additional padding when sidebar is visible */
}

@media (max-width: 767.98px) {
  main {
    padding-left: 1rem;
  }
  
  .content-shifted {
    padding-left: 1rem;
  }
}
</style>
