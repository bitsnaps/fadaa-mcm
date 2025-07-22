<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';

const authStore = useAuthStore();
const sidebarStore = useSidebarStore();

const userRole = computed(() => authStore.userRole);
const isCollapsed = computed(() => sidebarStore.isCollapsed);
</script>

<template>
  <nav id="sidebarMenu" class="col-md-3 col-lg-2 d-md-block bg-fadaa-light-blue sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="position-sticky pt-3 sidebar-sticky">
      <ul class="nav flex-column">
        <li class="nav-item" v-if="userRole === 'admin'">
          <router-link to="/admin-dashboard" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-shield-lock-fill me-2"></i>
            {{ $t('sidebar.adminDashboard') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin'">
          <router-link to="/manage-users" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-people-fill me-2"></i>
            {{ $t('sidebar.manageUsers') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin'">
          <router-link to="/manage-branches" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-building-gear me-2"></i>
            {{ $t('sidebar.manageBranches') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin'">
          <router-link to="/manage-service-categories" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-tags-fill me-2"></i>
            {{ $t('sidebar.manageServiceCategories') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin'">
          <router-link to="/manage-taxes" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-receipt-cutoff me-2"></i>
            {{ $t('sidebar.manageTaxes') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin'">
          <router-link to="/manage-investments" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-cash-stack me-2"></i>
            {{ $t('sidebar.manageInvestments') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'assistant'">
          <router-link to="/assistant-dashboard" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-person-workspace me-2"></i>
            {{ $t('sidebar.assistantDashboard') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant' ">
          <router-link to="/manage-clients" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-person-lines-fill me-2"></i>
            {{ $t('sidebar.manageClients') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
          <router-link to="/add-client" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-person-plus-fill me-2"></i>
            {{ $t('sidebar.addClient') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin'">
          <router-link to="/manage-coworking-offices" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-buildings-fill me-2"></i>
            {{ $t('sidebar.manageCoworkingOffices') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
          <router-link to="/contracts-management" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-file-earmark-text-fill me-2"></i>
            {{ $t('contracts.title') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
          <router-link to="/documents-management" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-file-earmark-zip-fill me-2"></i>
            {{ $t('documents.title') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
          <router-link to="/manage-client-services" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-hdd-stack-fill me-2"></i>
            {{ $t('sidebar.manageClientServices') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin'">
          <router-link to="/system-settings" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-gear-fill me-2"></i>
            {{ $t('sidebar.systemSettings') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin'">
          <router-link to="/office-designer" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-clipboard-fill me-2"></i>
            {{ $t('sidebar.officeDesigner') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'assistant'">
          <router-link to="/tasks" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-list-task me-2"></i>
            {{ $t('sidebar.tasks') }}
          </router-link>
        </li>

        <!-- FADAA Operational Core & Financials -->
        <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
          <router-link to="/manage-incomes" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-cash-coin me-2"></i>
            {{ $t('sidebar.manageIncomes') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
          <router-link to="/manage-expenses" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-cash-stack me-2"></i>
            {{ $t('sidebar.manageExpenses') }}
          </router-link>
        </li>
                
        <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
          <router-link to="/investment-tracking" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-graph-up me-2"></i>
            {{ $t('sidebar.investmentTracking') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
          <router-link to="/financial-reporting" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-file-earmark-medical me-2"></i>
            {{ $t('sidebar.financialReporting') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
          <router-link to="/compliance-management" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-shield-check me-2"></i>
            {{ $t('sidebar.complianceManagement') }}
          </router-link>
        </li>

        <!-- Investor role does not have a sidebar according to previous context -->

      </ul>

      <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted text-uppercase" v-if="userRole === 'admin'">
        <span>{{ $t('sidebar.reports') }}</span>
        <!-- <a class="link-secondary" href="#" aria-label="Add a new report">
          <i class="bi bi-plus-circle"></i>
        </a> -->
      </h6>
      <ul class="nav flex-column mb-2" v-if="userRole === 'admin'">
        <li class="nav-item">
          <router-link to="/monthly-report" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-file-earmark-text me-2"></i>
            {{ $t('sidebar.monthlyReport') }}
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/annual-report" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-file-earmark-bar-graph me-2"></i>
            {{ $t('sidebar.annualReport') }}
          </router-link>
        </li>
      </ul>

    </div>
  </nav>
</template>

<style scoped>
/*
 * Sidebar
 */

.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  padding: 48px 0 0; /* Height of navbar */
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, .1);
  transition: all 0.3s ease;
}

.sidebar.collapsed {
  /* Adjust based on desired collapsed width */
  /*margin-left: -160px; */
  width: 0;
}

.sidebar-sticky {
  height: calc(100vh - 48px);
  overflow-x: hidden;
  overflow-y: auto; /* Scrollable contents if viewport is shorter than content. */
}

.sidebar .nav-link {
  font-weight: 500;
  color: var(--fadaa-dark-blue);
}

.sidebar .nav-link .feather {
  margin-right: 4px;
  color: #727272;
}

.sidebar .nav-link.active-fadaa {
  color: var(--fadaa-orange);
}

.sidebar .nav-link:hover .feather,
.sidebar .nav-link.active-fadaa .feather {
  color: inherit;
}

.sidebar-heading {
  font-size: .75rem;
  text-transform: uppercase;
}
</style>