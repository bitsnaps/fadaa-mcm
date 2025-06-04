<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Navbar from '@/components/Navbar.vue';
import Sidebar from '@/components/Sidebar.vue';

const route = useRoute();
const authStore = useAuthStore();

const userRole = computed(() => authStore.userRole);
const isAuthenticated = computed(() => authStore.isAuthenticated);

const showSidebar = computed(() => {
  // Show sidebar only for admin and assistant roles and if authenticated
  return isAuthenticated.value && ['admin', 'assistant'].includes(userRole.value) && route.path !== '/login';
});
</script>

<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <header>
      <Navbar />
    </header>

    <div class="container-fluid flex-grow-1">
      <div class="row">


        <!-- Sidebar -->
        <Sidebar v-if="showSidebar" />

        <!-- Main content area -->
        <main :class="{'col-md-9 ms-sm-auto col-lg-10 px-md-4': showSidebar, 'col-12': !showSidebar}">
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
/* Global styles are now primarily in src/style.css */
/* App.vue specific styles can be added here if necessary for layout that isn't covered by Bootstrap or global styles. */

/* Example: If #app needs specific flex properties not handled by .d-flex.flex-column.min-vh-100 */
/* #app {
  some-property: value;
} */
</style>
