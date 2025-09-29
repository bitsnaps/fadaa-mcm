<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';

const authStore = useAuthStore();
const sidebarStore = useSidebarStore();

const userRole = computed(() => authStore.userRole);
const isCollapsed = computed(() => sidebarStore.isCollapsed);

// Collapsible menu state
const isManagementCollapsed = ref(false);
const isFinancialCollapsed = ref(false);

const toggleManagement = () => {
  isManagementCollapsed.value = !isManagementCollapsed.value;
};

const toggleFinancial = () => {
  isFinancialCollapsed.value = !isFinancialCollapsed.value;
};
</script>

<template>
  <nav id="sidebarMenu" class="col-md-3 col-lg-2 d-md-block bg-fadaa-light-blue sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="position-sticky pt-3 sidebar-sticky">
      <ul class="nav flex-column">
        
        <li class="nav-item" v-if="userRole === 'admin'">
         <router-link to="/manage-profiles" class="nav-link" active-class="active-fadaa">
           <i class="bi bi-person-video3 me-2"></i>
           {{ $t('sidebar.manageProfiles') }}
         </router-link>
       </li>

        <!-- Dashboard Links -->
        <li class="nav-item" v-if="userRole === 'admin'">
          <router-link to="/admin-dashboard" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-shield-lock-fill me-2"></i>
            {{ $t('sidebar.adminDashboard') }}
          </router-link>
        </li>
        <li class="nav-item" v-if="userRole === 'assistant'">
          <router-link to="/assistant-dashboard" class="nav-link" active-class="active-fadaa">
            <i class="bi bi-person-workspace me-2"></i>
            {{ $t('sidebar.assistantDashboard') }}
          </router-link>
        </li>

        <!-- Management & Operations Group -->
        <li class="nav-item">
          <a href="#" class="nav-link d-flex justify-content-between align-items-center"
             @click.prevent="toggleManagement"
             v-if="userRole === 'admin' || userRole === 'assistant'">
            <span>
              <i class="bi bi-gear-wide-connected me-2"></i>
              {{ $t('sidebar.managementOperations') }}
            </span>
            <i class="bi" :class="isManagementCollapsed ? 'bi-chevron-right' : 'bi-chevron-down'"></i>
          </a>
          <ul class="nav flex-column ms-3" v-show="!isManagementCollapsed" v-if="userRole === 'admin' || userRole === 'assistant'">
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
            <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
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
              <router-link to="/manage-offices" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-buildings-fill me-2"></i>
                {{ $t('sidebar.manageOffices') }}
              </router-link>
            </li>
            <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
              <router-link to="/documents-management" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-file-earmark-zip-fill me-2"></i>
                {{ $t('documents.title') }}
              </router-link>
            </li>
            <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
              <router-link to="/compliance-management" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-shield-check me-2"></i>
                {{ $t('sidebar.complianceManagement') }}
              </router-link>
            </li>
            <li class="nav-item" v-if="userRole === 'assistant'">
              <router-link to="/tasks" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-list-task me-2"></i>
                {{ $t('sidebar.tasks') }}
              </router-link>
            </li>
            <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
              <router-link to="/office-designer" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-clipboard-fill me-2"></i>
                {{ $t('sidebar.officeDesigner') }}
              </router-link>
            </li>
            <li class="nav-item" v-if="userRole === 'admin'">
                <router-link to="/file-manager" class="nav-link" active-class="active-fadaa">
                    <i class="bi bi-folder-fill me-2"></i>
                    {{ $t('sidebar.fileManager') }}
                </router-link>
            </li>
            <li class="nav-item" v-if="userRole === 'admin'">
              <router-link to="/system-settings" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-gear-fill me-2"></i>
                {{ $t('systemSettings.title') }}
              </router-link>
            </li>
            <li class="nav-item" v-if="userRole === 'admin'">
              <router-link to="/manage-pending-deletions" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-trash-fill me-2"></i>
                {{ $t('sidebar.managePendingDeletions') }}
              </router-link>
            </li>
          </ul>
        </li>

        <!-- Financial Analytics & Tracking Group -->
        <li class="nav-item">
          <a href="#" class="nav-link d-flex justify-content-between align-items-center"
             @click.prevent="toggleFinancial"
             v-if="userRole === 'admin' || userRole === 'assistant'">
            <span>
              <i class="bi bi-graph-up-arrow me-2"></i>
              {{ $t('sidebar.financialAnalytics') }}
            </span>
            <i class="bi" :class="isFinancialCollapsed ? 'bi-chevron-right' : 'bi-chevron-down'"></i>
          </a>
          <ul class="nav flex-column ms-3" v-show="!isFinancialCollapsed" v-if="userRole === 'admin' || userRole === 'assistant'">
            <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
              <router-link to="/contracts-management" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-file-earmark-text-fill me-2"></i>
                {{ $t('contracts.title') }}
              </router-link>
            </li>
            <li class="nav-item" v-if="userRole === 'admin' || userRole === 'assistant'">
              <router-link to="/manage-client-services" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-hdd-stack-fill me-2"></i>
                {{ $t('sidebar.manageClientServices') }}
              </router-link>
            </li>
            <li class="nav-item" v-if="userRole === 'admin'">
              <router-link to="/manage-investments" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-cash-stack me-2"></i>
                {{ $t('sidebar.manageInvestments') }}
              </router-link>
            </li>
            <li class="nav-item" v-if="userRole === 'admin'">
              <router-link to="/manage-withdrawals" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-bank2 me-2"></i>
                {{ $t('sidebar.manageWithdrawals') }}
              </router-link>
            </li>
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
            <li class="nav-item" v-if="userRole === 'admin'">
              <router-link to="/investment-tracking" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-graph-up me-2"></i>
                {{ $t('sidebar.investmentTracking') }}
              </router-link>
            </li>
            <li class="nav-item" v-if="userRole === 'admin'">
              <router-link to="/financial-reporting" class="nav-link" active-class="active-fadaa">
                <i class="bi bi-file-earmark-medical me-2"></i>
                {{ $t('sidebar.financialReporting') }}
              </router-link>
            </li>
          </ul>
        </li>

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

html.arabic-font .sidebar {
  left: auto;
  right: 0;
  box-shadow: inset 1px 0 0 rgba(0, 0, 0, .1);
}

.sidebar.collapsed {
  width: 0;
}

html.arabic-font .sidebar.collapsed {
  margin-right: -280px;
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

/* Collapsible menu styles */
.nav-link[href="#"] {
  cursor: pointer;
  font-weight: 600;
  color: var(--fadaa-dark-blue) !important;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  margin-bottom: 0.25rem;
}

.nav-link[href="#"]:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Nested menu items */
.nav .nav {
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}

.nav .nav .nav-link {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  color: var(--fadaa-dark-blue);
  opacity: 0.8;
}

.nav .nav .nav-link:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
}

.nav .nav .nav-link.active-fadaa {
  opacity: 1;
  background-color: rgba(var(--fadaa-orange-rgb), 0.1);
  border-radius: 0.25rem;
}

/* Chevron animation */
.bi-chevron-right,
.bi-chevron-down {
  transition: transform 0.2s ease;
}

/* Smooth collapse animation */
.nav .nav {
  transition: all 0.3s ease;
}
</style>