<template>
  <nav id="sidebarMenu" class="col-md-3 col-lg-2 d-md-block bg-fadaa-light-blue sidebar collapse">
    <div class="position-sticky pt-3 sidebar-sticky">
      <ul class="nav flex-column">
        <li class="nav-item" v-if="userRole === 'superadmin'">
          <router-link to="/superadmin-dashboard" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-shield-lock-fill me-2"></i>
            Dashboard Superadmin
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'superadmin'">
          <router-link to="/manage-users" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-people-fill me-2"></i>
            Gestion Utilisateurs
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'superadmin'">
          <router-link to="/system-settings" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-gear-fill me-2"></i>
            Paramètres Système
          </router-link>
        </li>

        <li class="nav-item" v-if="userRole === 'assistant'">
          <router-link to="/assistant-dashboard" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-person-workspace me-2"></i>
            Dashboard Assistant
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'assistant'">
          <router-link to="/manage-clients" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-person-lines-fill me-2"></i>
            Gestion Clients
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'assistant'">
          <router-link to="/tasks" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-list-task me-2"></i>
            Tâches
          </router-link>
        </li>

        <!-- Investor role does not have a sidebar according to previous context -->

      </ul>

      <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted text-uppercase" v-if="userRole === 'superadmin'">
        <span>Rapports</span>
        <a class="link-secondary" href="#" aria-label="Add a new report">
          <i class="bi bi-plus-circle"></i>
        </a>
      </h6>
      <ul class="nav flex-column mb-2" v-if="userRole === 'superadmin'">
        <li class="nav-item">
          <a class="nav-link" href="#">
            <i class="bi bi-file-earmark-text me-2"></i>
            Rapport Mensuel
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#">
            <i class="bi bi-file-earmark-bar-graph me-2"></i>
            Rapport Annuel
          </a>
        </li>
      </ul>

    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const userRole = computed(() => authStore.userRole);
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 56px; /* Match navbar height */
  bottom: 0;
  left: 0;
  z-index: 100; /* Behind the navbar */
  padding: 0; /* Remove padding, handled by sidebar-sticky */
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, .1);
  background-color: var(--fadaa-light-blue); /* FADAA Light Blue */
}

@media (max-width: 767.98px) {
  .sidebar {
    /* top: 5rem; Bootstrap's default, adjust if navbar height is different on mobile */
    /* For now, keep consistent with desktop */
    top: 56px;
    z-index: 1030; /* Ensure it's above content when collapsed on mobile */
  }
  /* When sidebar is collapsed on mobile, it might need specific styling if it overlays */
  .sidebar.collapse:not(.show) {
    /* Styles for when collapsed and not shown, if needed */
  }
}

.sidebar-sticky {
  padding-top: 1rem; /* Add some padding at the top of the scrollable area */
  height: calc(100vh - 56px); /* Full height minus navbar */
  overflow-x: hidden;
  overflow-y: auto;
}

.sidebar .nav-link {
  font-weight: 500;
  color: var(--fadaa-blue); /* FADAA Blue for text */
  padding: 0.75rem 1rem;
}

.sidebar .nav-link i {
  color: var(--fadaa-orange); /* FADAA Orange for icons */
  width: 20px; /* Ensure icons align nicely */
  text-align: center;
}

.sidebar .nav-link.active-fadaa {
  color: var(--fadaa-orange); /* FADAA Orange for active link text */
  background-color: var(--fadaa-blue); /* FADAA Blue for active link background */
}

.sidebar .nav-link.active-fadaa i {
  color: var(--fadaa-orange); /* Keep icon orange or change if needed */
}

.sidebar .nav-link:hover {
  color: var(--fadaa-orange);
  background-color: rgba(0, 51, 102, 0.1); /* Lighter FADAA Blue for hover */
}

.sidebar .nav-link:hover i {
  color: var(--fadaa-orange);
}

.sidebar-heading {
  font-size: .75rem;
  text-transform: uppercase;
  padding: 0.5rem 1rem;
  color: var(--fadaa-blue);
  margin-top: 1rem;
}

.sidebar-heading .link-secondary i {
  color: var(--fadaa-orange);
}
</style>