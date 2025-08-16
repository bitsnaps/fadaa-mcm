<template>
  <div class="dashboard-container container-fluid">
    <h2 class="mb-4">{{ $t('dashboard.title') }}</h2>

    <ProfileTabs @update:activeProfile="onProfileChange">
      <template #default="{ profileId }">
        <!-- Section 1: Major KPIs -->
        <div class="row gy-4 mb-4">
          <div class="col-md-4">
            <div class="card h-100 shadow-sm text-center">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-people-fill me-2 text-fadaa-orange"></i>{{ $t('dashboard.kpis.clients') }}</h5>
                <p class="card-text fs-4 fw-bold">{{ kpis.clients }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100 shadow-sm text-center">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-cash-coin me-2 text-fadaa-orange"></i>{{ $t('dashboard.kpis.monthlyRevenue') }}</h5>
                <p class="card-text fs-4 fw-bold">{{ formatCurrency(kpis.monthlyRevenue) }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100 shadow-sm text-center">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-graph-up-arrow me-2 text-fadaa-orange"></i>{{ $t('dashboard.kpis.monthlyNet') }}</h5>
                <p class="card-text fs-4 fw-bold">{{ formatCurrency(kpis.monthlyNet) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Monthly Sales Stacked BarChart -->
		<div class="row mb-4">
			<div class="col-lg-6">
        		<div class="card shadow-sm mb-4">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-bar-chart-line-fill me-2"></i>{{ $t('dashboard.charts.monthlySales') }}</h5>
          </div>
          <div class="card-body">
            <Bar :data="chartData" :options="chartOptions" style="height: 300px;" />
          </div>
        </div>
			</div>
			
      	<!-- Section 3: Notifications -->
      	<div class="col-lg-6">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-bell-fill me-2"></i>{{ $t('dashboard.notifications.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="notification in notifications" :key="notification.id" class="list-group-item d-flex align-items-center" :class="`list-group-item-${notification.type || 'info'}`">
                <i :class="`bi ${getNotificationIcon(notification.type)} me-2 fs-4`"></i> {{ notification.message }}
              </li>
            </ul>
          </div>
        </div>
      </div>
	  		
		</div>
      </template>
    </ProfileTabs>

    <!-- Global Sections (Mostly not profile-specific) -->
    <div class="row mb-4">

      <!-- Section 4: Recent Activities -->
      <div class="col-lg-6">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-list-task me-2"></i>{{ $t('dashboard.recentActivities.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-unstyled">
              <li v-for="activity in recentActivities" :key="activity.id" class="mb-2">
                <i :class="`bi ${getActivityIcon(activity.action)} me-2`"></i>
                {{ activity.action }} - {{ activity.details ? activity.details.message : '' }}
                <span class="text-muted small">({{ formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr }) }})</span>
              </li>
            </ul>
          </div>
        </div>
      </div><!-- Recent Activities -->


    <!-- Assistant Performance -->
    <div class="col-md-6">
      <div class="card shadow-sm h-100">
        <div class="card-header bg-fadaa-yellow">
          <h5 class="mb-0"><i class="bi bi-person-workspace me-2"></i>{{ $t('dashboard.assistantPerformance.title') }}</h5>
        </div>
        <div class="card-body">
          <ul class="list-group list-group-flush">
            <li v-for="assistant in assistants" :key="assistant.id" class="list-group-item d-flex justify-content-between align-items-center">
              {{ assistant.first_name }} {{ assistant.last_name }}
              <span :class="`badge bg-${assistant.is_active ? 'success' : 'danger'} rounded-pill`">
                {{ assistant.is_active ? $t('dashboard.assistantPerformance.statusActive') : 'Inactive' }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div><!-- Assistants Performance -->

    </div>


    <!-- Office List Table -->
    <div class="card shadow-sm mb-4">
      <div class="card-header bg-fadaa-yellow">
        <h5 class="mb-0"><i class="bi bi-building me-2"></i>{{ $t('dashboard.officeList.title') }}</h5>
      </div>
      <div class="card-body">
        <div class="mb-3">
          <input type="text" class="form-control" :placeholder="$t('dashboard.officeList.searchPlaceholder')" v-model="searchTerm" @input="filterOffices">
        </div>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th @click="sortBy('id')" class="cursor-pointer">{{ $t('dashboard.officeList.table.id') }} <i :class="sortIcon('id')"></i></th>
                <th @click="sortBy('branch')" class="cursor-pointer">{{ $t('dashboard.officeList.table.branch') }} <i :class="sortIcon('branch')"></i></th>
                <th @click="sortBy('space')" class="cursor-pointer">{{ $t('dashboard.officeList.table.space') }} <i :class="sortIcon('space')"></i></th>
                <th @click="sortBy('status')" class="cursor-pointer">{{ $t('dashboard.officeList.table.status') }} <i :class="sortIcon('status')"></i></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedOffices.length === 0">
                <td colspan="4" class="text-center">{{ $t('dashboard.officeList.noOffices') }}</td>
              </tr>
              <tr v-for="office in paginatedOffices" :key="office.id">
                <td>{{ office.id }}</td>
                <td>{{ office.branch.name }}</td>
                <td>{{ office.capacity }}</td>
                <td><span :class="statusBadge(office.status)">{{ office.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <nav aria-label="Office list navigation" v-if="totalPages > 1">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <a class="page-link" href="#" @click.prevent="prevPage">{{ $t('dashboard.officeList.pagination.previous') }}</a>
            </li>
            <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
              <a class="page-link" href="#" @click.prevent="currentPage = page">{{ page }}</a>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <a class="page-link" href="#" @click.prevent="nextPage">{{ $t('dashboard.officeList.pagination.next') }}</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Data Export Section -->
    <div class="card shadow-sm">
      <div class="card-header bg-fadaa-yellow">
        <h5 class="mb-0"><i class="bi bi-download me-2"></i>{{ $t('dashboard.dataExport.title') }}</h5>
      </div>
      <div class="card-body text-center">
        <button @click="exportData('excel')" class="btn btn-fadaa-orange me-2"><i class="bi bi-file-earmark-excel-fill me-1"></i>{{ $t('dashboard.dataExport.excel') }}</button>
        <button @click="exportData('csv')" class="btn btn-fadaa-orange me-2"><i class="bi bi-filetype-csv me-1"></i>{{ $t('dashboard.dataExport.csv') }}</button>
        <button @click="exportData('pdf')" class="btn btn-fadaa-orange"><i class="bi bi-file-earmark-pdf-fill me-1"></i>{{ $t('dashboard.dataExport.pdf') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Filler } from 'chart.js';
import { formatCurrency } from '@/helpers/utils.js';
import ProfileTabs from '@/components/ProfileTabs.vue';
import { getTotalClients } from '@/services/ClientService';
import { getActivityLogs } from '@/services/ActivityLogService';
import { getAssistants } from '@/services/UserService';
import { getOffices } from '@/services/OfficeService';
import { getNotifications } from '@/services/notificationService';
import { getMonthlyIncomeByBranch, getRevenueSummary } from '@/services/DashboardService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Filler);

const kpis = ref({
  clients: 0,
  monthlyRevenue: 0,
  monthlyNet: 0,
});

const activeProfileId = ref(null);
const notifications = ref([]);
const recentActivities = ref([]);
const assistants = ref([]);
const offices = ref([]);

const searchTerm = ref('');
const sortKey = ref('id');
const sortAsc = ref(true);
const currentPage = ref(1);
const itemsPerPage = ref(5);
const totalOffices = ref(0);

const chartData = ref({
  labels: [],
  datasets: [],
});

const fetchDashboardData = async (profileId) => {
  if (!profileId) return;
  try {
    // KPIs
    const clientsRes = await getTotalClients();
    kpis.value.clients = clientsRes.data.data;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const revenueSummaryRes = await getRevenueSummary({ startDate, endDate, profile_id: profileId });
    kpis.value.monthlyRevenue = revenueSummaryRes.data.data.netRevenue;
    kpis.value.monthlyNet = revenueSummaryRes.data.data.netProfit;

    // Chart
    const chartRes = await getMonthlyIncomeByBranch({ profile_id: profileId });
    chartData.value = chartRes.data.data;

    // Global Data (fetch only once)
    if (notifications.value.length === 0) {
      const notificationsRes = await getNotifications();
      notifications.value = notificationsRes.data.notifications;

      const activitiesRes = await getActivityLogs();
      recentActivities.value = activitiesRes.data.data;

      const assistantsRes = await getAssistants();
      assistants.value = assistantsRes.data.data;

      fetchOffices();
    }

  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  }
};

const onProfileChange = (profileId) => {
  activeProfileId.value = profileId;
  fetchDashboardData(profileId);
};

const fetchOffices = async () => {
  try {
    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchTerm.value,
      sortBy: sortKey.value,
      sortAsc: sortAsc.value,
    };
    const response = await getOffices(params);
    offices.value = response.data.data;
    totalOffices.value = response.data.pagination.total;
  } catch (error) {
    console.error('Failed to fetch offices:', error);
  }
};

onMounted(() => {
  // fetchDashboardData is now called by onProfileChange
});

const totalPages = computed(() => {
  return Math.ceil(totalOffices.value / itemsPerPage.value);
});

const paginatedOffices = computed(() => {
  return offices.value;
});

const getNotificationIcon = (type) => {
  switch (type) {
    case 'danger': return 'bi-exclamation-octagon-fill';
    case 'warning': return 'bi-exclamation-triangle-fill';
    case 'info': return 'bi-info-circle-fill';
    default: return 'bi-bell-fill';
  }
};

const getActivityIcon = (action) => {
  if (action.includes('Client')) return 'bi-person-check-fill text-success';
  if (action.includes('Contract')) return 'bi-file-earmark-text-fill text-primary';
  if (action.includes('Communication')) return 'bi-chat-dots-fill text-info';
  return 'bi-list-task';
};


const sortBy = (key) => {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = true;
  }
  currentPage.value = 1;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const filterOffices = () => {
  currentPage.value = 1;
};

const exportData = (format) => {
  alert(`Exportation des données vers ${format}... (Placeholder - Fonctionnalité complète dans la Tâche 3)`);
};

const sortIcon = (key) => {
  if (sortKey.value !== key) return 'bi bi-arrow-down-up';
  return sortAsc.value ? 'bi bi-sort-up-alt' : 'bi bi-sort-down';
};

const statusBadge = (status) => {
  switch (status) {
    case 'Occupé': return 'badge bg-danger';
    case 'Nouveau': return 'badge bg-success';
    case 'Actif': return 'badge bg-primary';
    case 'En instance': return 'badge bg-warning text-dark';
    case 'Inactif': return 'badge bg-secondary';
    default: return 'badge bg-light text-dark';
  }
};

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false
      }
    },
    y: {
      stacked: true,
      beginAtZero: true,
      title: {
        display: true,
        text: 'Amount'
      }
    },
  },
});
</script>

<style scoped>
/* Component-specific styles can go here if needed */
</style>