<template>
  <div class="dashboard-container container-fluid">
    <h2 class="mb-4">{{ $t('dashboard.title') }}</h2>

    <ProfileTabs @update:activeProfile="onProfileChange">
      <template #default="{ profileId }">
        <!-- Date Range Filter -->
        <div class="card shadow-sm mb-3">
          <div class="card-body d-flex flex-wrap align-items-end gap-3">
            <div>
              <label class="form-label mb-1">From</label>
              <input type="date" class="form-control" v-model="fromDate" />
            </div>
            <div>
              <label class="form-label mb-1">To</label>
              <input type="date" class="form-control" v-model="toDate" />
            </div>
            <div class="ms-auto d-flex gap-2">
              <button class="btn btn-fadaa-orange" @click="applyDateFilter" :disabled="!activeProfileId">{{ $t('dashboard.filter.apply') }}</button>
              <button class="btn btn-outline-secondary" @click="resetToThisMonth">{{ $t('dashboard.filter.thisMonth') }}</button>
              <button class="btn btn-outline-secondary" @click="setToThisYear">{{ $t('dashboard.filter.thisYear') }}</button>
            </div>
          </div>
        </div>
        <!-- Section 1: Major KPIs -->
        <div class="row gy-4 mb-4">
          <div class="col-md-4">
            <div class="card h-100 shadow-sm text-center">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-people-fill m-2 text-fadaa-orange"></i>{{ $t('dashboard.kpis.clients') }}</h5>
                <p class="card-text fs-4 fw-bold">{{ kpis.clients }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100 shadow-sm text-center">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-cash-coin m-2 text-fadaa-orange"></i>{{ $t('dashboard.kpis.monthlyRevenue') }}</h5>
                <p class="card-text fs-4 fw-bold">{{ formatCurrency(kpis.monthlyRevenue) }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100 shadow-sm text-center">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-graph-up-arrow m-2 text-fadaa-orange"></i>{{ $t('dashboard.kpis.monthlyNet') }}</h5>
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
            <h5 class="mb-0"><i class="bi bi-bar-chart-line-fill m-2"></i>{{ $t('dashboard.charts.monthlySales') }}</h5>
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
      	     <h5 class="mb-0"><i class="bi bi-bell-fill m-2"></i>{{ $t('dashboard.notifications.title') }}</h5>
      	   </div>
      	   <div class="card-body">
      	     <ul class="list-group list-group-flush">
      	       <li v-for="notification in paginatedNotifications" :key="notification.id" class="list-group-item d-flex align-items-center" :class="`list-group-item-${notification.type || 'info'}`">
      	         <i :class="`bi ${getNotificationIcon(notification.type)} m-2 fs-4`"></i> {{ notification.message }}
      	       </li>
      	     </ul>
      	     <div v-if="totalNotificationPages > 1" class="d-flex justify-content-center align-items-center mt-3">
      	       <button class="btn btn-sm btn-outline-secondary me-2" @click="prevNotificationPage" :disabled="currentNotificationPage === 1">
      	         <i class="bi bi-chevron-left"></i>
      	       </button>
      	       <span class="small text-muted">{{ currentNotificationPage }} / {{ totalNotificationPages }}</span>
      	       <button class="btn btn-sm btn-outline-secondary ms-2" @click="nextNotificationPage" :disabled="currentNotificationPage === totalNotificationPages">
      	         <i class="bi bi-chevron-right"></i>
      	       </button>
      	     </div>
      	     <div class="text-center mt-3">
      	       <router-link to="/manage-notifications" class="text-decoration-none small text-muted">
      	         {{ $t('dashboard.notifications.viewAll') || 'View All Notifications' }} <i class="bi bi-arrow-right"></i>
      	       </router-link>
      	     </div>
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
            <h5 class="mb-0"><i class="bi bi-list-task m-2"></i>{{ $t('dashboard.recentActivities.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-unstyled">
              <li v-for="activity in paginatedActivities" :key="activity.id" class="mb-2">
                <i :class="`bi ${getActivityIcon(activity.action)} m-2`"></i>
                {{ activity.action }} - {{ activity.details ? activity.details.message : '' }}
                <span class="text-muted small">({{ formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr }) }})</span>
              </li>
            </ul>
            <div v-if="totalActivityPages > 1" class="d-flex justify-content-center align-items-center mt-3">
              <button class="btn btn-sm btn-outline-secondary me-2" @click="prevActivityPage" :disabled="currentActivityPage === 1">
                <i class="bi bi-chevron-left"></i>
              </button>
              <span class="small text-muted">{{ currentActivityPage }} / {{ totalActivityPages }}</span>
              <button class="btn btn-sm btn-outline-secondary ms-2" @click="nextActivityPage" :disabled="currentActivityPage === totalActivityPages">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div><!-- Recent Activities -->


    <!-- Assistant Performance -->
    <div class="col-md-6">
      <div class="card shadow-sm h-100">
        <div class="card-header bg-fadaa-yellow">
          <h5 class="mb-0"><i class="bi bi-person-workspace m-2"></i>{{ $t('dashboard.assistantPerformance.title') }}</h5>
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
        <h5 class="mb-0"><i class="bi bi-building m-2"></i>{{ $t('dashboard.officeList.title') }}</h5>
      </div>
      <div class="card-body">
        <div class="mb-3">
          <input type="text" class="form-control" :placeholder="$t('dashboard.officeList.searchPlaceholder')" v-model="searchTerm" @input="filterOffices">
        </div>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>{{ $t('dashboard.officeList.table.id') }}</th>
                <th>{{ $t('dashboard.officeList.table.name') }}</th>
                <th>{{ $t('dashboard.officeList.table.branch') }}</th>
                <th>{{ $t('dashboard.officeList.table.space') }}</th>
                <th>{{ $t('dashboard.officeList.table.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedOffices.length === 0">
                <td colspan="5" class="text-center">{{ $t('dashboard.officeList.noOffices') }}</td>
              </tr>
              <tr v-for="office in paginatedOffices" :key="office.id">
                <td>{{ office.id }}</td>
                <td>{{ office.name }}</td>
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
        <h5 class="mb-0"><i class="bi bi-download m-2"></i>{{ $t('dashboard.dataExport.title') }}</h5>
      </div>
      <div class="card-body text-center">
        <button @click="exportData('xlsx')" class="btn btn-fadaa-orange m-2" :disabled="isExporting.excel">
          <span v-if="isExporting.excel" class="spinner-border spinner-border-sm m-1" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-file-earmark-excel-fill m-1"></i>
          {{ $t('dashboard.dataExport.excel') }}
        </button>
        <button @click="exportData('csv')" class="btn btn-fadaa-orange m-2" :disabled="isExporting.csv">
          <span v-if="isExporting.csv" class="spinner-border spinner-border-sm m-1" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-filetype-csv m-1"></i>
          {{ $t('dashboard.dataExport.csv') }}
        </button>
        <button @click="exportData('pdf')" class="btn btn-fadaa-orange" :disabled="isExporting.pdf">
          <span v-if="isExporting.pdf" class="spinner-border spinner-border-sm m-1" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-file-earmark-pdf-fill m-1"></i>
          {{ $t('dashboard.dataExport.pdf') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Filler } from 'chart.js';
import { formatCurrency, formatDateForInput } from '@/helpers/utils.js';
import { useToast } from '@/helpers/toast';
import ProfileTabs from '@/components/ProfileTabs.vue';
import { getTotalClients } from '@/services/ClientService';
import { getActivityLogs } from '@/services/ActivityLogService';
import { getAssistants } from '@/services/UserService';
import { getOffices } from '@/services/OfficeService';
import { getNotifications } from '@/services/notificationService';
import { getMonthlyIncomeByBranch, getRevenueSummary } from '@/services/DashboardService';
import ReportService from '@/services/ReportService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Filler);

const { showErrorToast } = useToast(); // keep for client-side validation and local errors only

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

// Activities Pagination
const currentActivityPage = ref(1);
const activityPageSize = 10;

const totalActivityPages = computed(() => Math.ceil(recentActivities.value.length / activityPageSize));

const paginatedActivities = computed(() => {
  const start = (currentActivityPage.value - 1) * activityPageSize;
  return recentActivities.value.slice(start, start + activityPageSize);
});

const nextActivityPage = () => {
  if (currentActivityPage.value < totalActivityPages.value) currentActivityPage.value++;
};

const prevActivityPage = () => {
  if (currentActivityPage.value > 1) currentActivityPage.value--;
};

// Notifications Pagination
const currentNotificationPage = ref(1);
const notificationPageSize = 5;

const totalNotificationPages = computed(() => Math.ceil(notifications.value.length / notificationPageSize));

const paginatedNotifications = computed(() => {
  const start = (currentNotificationPage.value - 1) * notificationPageSize;
  return notifications.value.slice(start, start + notificationPageSize);
});

const nextNotificationPage = () => {
  if (currentNotificationPage.value < totalNotificationPages.value) currentNotificationPage.value++;
};

const prevNotificationPage = () => {
  if (currentNotificationPage.value > 1) currentNotificationPage.value--;
};

// Date range state
const fromDate = ref(localStorage.getItem('adminDashboard-fromDate') || '');
const toDate = ref(localStorage.getItem('adminDashboard-toDate') || '');

const searchTerm = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(5);
const totalOffices = ref(0);
const isExporting = ref({
  excel: false,
  csv: false,
  pdf: false,
});

const chartData = ref({
  labels: [],
  datasets: [],
});

const initThisMonth = () => {
  const now = new Date();
  const s = new Date(now.getFullYear(), now.getMonth(), 1);
  const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  fromDate.value = formatDateForInput(s);
  toDate.value = formatDateForInput(e);
};

const resetToThisMonth = () => {
  initThisMonth();
  if (activeProfileId.value) applyDateFilter();
};

const applyDateFilter = async () => {
  if (!activeProfileId.value) return;
  localStorage.setItem('adminDashboard-fromDate', fromDate.value);
  localStorage.setItem('adminDashboard-toDate', toDate.value);
  await fetchDashboardData(activeProfileId.value);
};

const setToThisYear = () => {
  const now = new Date();
  const s = new Date(now.getFullYear(), 0, 1);
  const e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  fromDate.value = formatDateForInput(s);
  toDate.value = formatDateForInput(e);
  if (activeProfileId.value) applyDateFilter();
};

const fetchDashboardData = async (profileId) => {
  if (!profileId) return;
  try {
    // KPIs
    const clientsRes = await getTotalClients();
    kpis.value.clients = clientsRes.data.data;

    // Use explicit date range from UI
    const startDate = fromDate.value ? new Date(fromDate.value).toISOString() : null;
    const endDate = toDate.value ? new Date(toDate.value).toISOString() : null;

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
  if (!activeProfileId.value) return;
  try {
    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchTerm.value,
      profile_id: activeProfileId.value,
    };
    const response = await getOffices(params);
    offices.value = response.data.data;
    totalOffices.value = response.data.pagination.total;
  } catch (error) {
    console.error('Failed to fetch offices:', error);
  }
};

onMounted(() => {
  initThisMonth();
  // fetchDashboardData is now called by onProfileChange
});

watch([activeProfileId, currentPage, searchTerm], fetchOffices, { immediate: true });

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

const exportData = async (format) => {
  if (!activeProfileId.value) {
    showErrorToast('Please select a profile first.');
    return;
  }

  isExporting.value[format] = true;
  try {
    // Use UI date range; default to current month if missing
    let s = fromDate.value;
    let e = toDate.value;
    if (!s || !e) {
      const now = new Date();
      const sDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const eDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      s = formatDateForInput(sDate);
      e = formatDateForInput(eDate);
    }

    const config = {
      format: format,
      type: 'financial',
      profile_id: activeProfileId.value,
      startDate: s,
      endDate: e,
    };
    
    const response = await ReportService.generateReport(config);

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = `financial-report-${activeProfileId.value}-${formatDateForInput()}.${format}`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error(`Failed to export data to ${format}:`, error);
    // API errors will toast globally; this is a local export flow, keep console only
  } finally {
    isExporting.value[format] = false;
  }
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