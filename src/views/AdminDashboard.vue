<template>
  <div class="dashboard-container container-fluid">
    <h2 class="mb-4">{{ $t('dashboard.title') }}</h2>

    <!-- Section 1: Major KPIs -->
    <div class="row gy-4 mb-4">
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-people-fill me-2 text-fadaa-orange"></i>{{ $t('dashboard.kpis.clients') }}</h5>
            <p class="card-text fs-4 fw-bold">1,250</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-cash-coin me-2 text-fadaa-orange"></i>{{ $t('dashboard.kpis.monthlyRevenue') }}</h5>
            <p class="card-text fs-4 fw-bold">{{ formatCurrency(75000) }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-graph-up-arrow me-2 text-fadaa-orange"></i>{{ $t('dashboard.kpis.monthlyNet') }}</h5>
            <p class="card-text fs-4 fw-bold">{{ formatCurrency(25000) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Monthly Sales Stacked BarChart -->
    <div class="row mb-4">
      <div class="col-lg-6">
        <div class="card shadow-sm">
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
              <li class="list-group-item list-group-item-danger d-flex align-items-center">
                <i class="bi bi-exclamation-octagon-fill me-2 fs-4"></i> {{ $t('dashboard.notifications.urgentContract') }}
              </li>
              <li class="list-group-item list-group-item-warning d-flex align-items-center">
                <i class="bi bi-exclamation-triangle-fill me-2 fs-4"></i> {{ $t('dashboard.notifications.pendingApproval') }}
              </li>
              <li class="list-group-item list-group-item-info d-flex align-items-center">
                <i class="bi bi-info-circle-fill me-2 fs-4"></i> {{ $t('dashboard.notifications.systemMaintenance') }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 4: Recent Activities & Assistant Performance -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-list-task me-2"></i>{{ $t('dashboard.recentActivities.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-unstyled">
              <li class="mb-2"><i class="bi bi-person-check-fill text-success me-2"></i>{{ $t('dashboard.recentActivities.newClient') }}</li>
              <li class="mb-2"><i class="bi bi-file-earmark-text-fill text-primary me-2"></i>{{ $t('dashboard.recentActivities.contractUpdate') }}</li>
              <li class="mb-2"><i class="bi bi-chat-dots-fill text-info me-2"></i>{{ $t('dashboard.recentActivities.communicationLog') }}</li>
              <li class="mb-2"><i class="bi bi-calendar-event-fill text-fadaa-orange me-2"></i>{{ $t('dashboard.recentActivities.followUpReminder') }}</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-person-workspace me-2"></i>{{ $t('dashboard.assistantPerformance.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between align-items-center">
                {{ $t('dashboard.assistantPerformance.assistant1') }}
                <span class="badge bg-success rounded-pill">{{ $t('dashboard.assistantPerformance.statusExcellent') }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                {{ $t('dashboard.assistantPerformance.assistant2') }}
                <span class="badge bg-primary rounded-pill">{{ $t('dashboard.assistantPerformance.statusGood') }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                {{ $t('dashboard.assistantPerformance.assistant3') }}
                <span class="badge bg-warning text-dark rounded-pill">{{ $t('dashboard.assistantPerformance.statusNeedsImprovement') }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Existing Office List Table (Kept for now, clarify if removal needed) -->
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
                <td>{{ office.branch }}</td>
                <td>{{ office.space }}</td>
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

    <!-- Existing Data Export Section (Kept for now, clarify if removal needed) -->
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
import { ref, computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Filler } from 'chart.js';
import { formatCurrency } from '@/helpers/utils.js';
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Filler);

const mockOffices = ref([
  { id: 1, branch: 'Branche Principale', space: 100, status: 'Occupé' },
  { id: 2, branch: 'Branche Centre-ville', space: 75, status: 'Nouveau' },
  { id: 3, branch: 'Branche Principale', space: 120, status: 'Actif' },
  { id: 4, branch: 'Branche Ouest', space: 90, status: 'En instance' },
  { id: 5, branch: 'Branche Principale', space: 50, status: 'Inactif' },
  { id: 6, branch: 'Branche Centre-ville', space: 150, status: 'Occupé' },
  { id: 7, branch: 'Branche Ouest', space: 60, status: 'Nouveau' },
  { id: 8, branch: 'Branche Est', space: 110, status: 'Actif' },
  { id: 9, branch: 'Branche Nord', space: 80, status: 'Inactif' },
  { id: 10, branch: 'Branche Sud', space: 95, status: 'En instance' },
]);

const searchTerm = ref('');
const sortKey = ref('id');
const sortAsc = ref(true);
const currentPage = ref(1);
const itemsPerPage = ref(5);

const filteredOffices = computed(() => {
  let offices = mockOffices.value;
  if (searchTerm.value) {
    offices = offices.filter(office =>
      Object.values(office).some(val =>
        String(val).toLowerCase().includes(searchTerm.value.toLowerCase())
      )
    );
  }
  return offices.sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    return (valA < valB ? -1 : 1) * (sortAsc.value ? 1 : -1);
  });
});

const totalPages = computed(() => {
  return Math.ceil(filteredOffices.value.length / itemsPerPage.value);
});

const paginatedOffices = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredOffices.value.slice(start, end);
});

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

// Chart.js data and options
const chartData = ref({
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
  datasets: [
    {
      label: 'Ventes Agence A',
      backgroundColor: '#4A90E2', // FADAA Blue - Consider using FADAA colors from PRD
      data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11],
      stack: 'Stack 0',
    },
    {
      label: 'Ventes Agence B',
      backgroundColor: '#F5A623', // FADAA Orange
      data: [30, 25, 15, 30, 20, 30, 49, 70, 50, 30, 22, 21],
      stack: 'Stack 0',
    },
    {
      label: 'Ventes Agence C',
      backgroundColor: '#7ED321', // FADAA Green - Consider using FADAA colors from PRD
      data: [20, 35, 25, 20, 30, 20, 59, 60, 60, 10, 32, 31],
      stack: 'Stack 0',
    },
  ],
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Ventes Mensuelles Cumulées par Agence',
      font: {
        size: 16,
      }
    },
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
        text: 'Montant des Ventes (en k)'
      }
    },
  },
});

</script>

<style scoped>
/* Component-specific styles can go here if needed */
</style>