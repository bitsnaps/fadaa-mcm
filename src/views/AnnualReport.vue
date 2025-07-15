<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const { t } = useI18n();

// Mock Data
const branches = ref([
  { id: 1, name: 'Main Branch' },
  { id: 2, name: 'West Wing' },
  { id: 3, name: 'East Wing' },
]);

const filters = ref({
  year: new Date().getFullYear(),
  branchId: null,
});

const years = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
});

const reportData = ref({});

const chartData = computed(() => ({
  labels: [t('annualReport.chart.revenue'), t('annualReport.chart.expenses'), t('annualReport.chart.profit')],
  datasets: [
    {
      label: t('annualReport.chart.financialSummary'),
      backgroundColor: ['#0D6EFD', '#DC3545', '#198754'],
      data: [reportData.value.revenue, reportData.value.expenses, reportData.value.profit],
    },
  ],
}));

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
});

function generateReport() {
  // Mock data generation
  reportData.value = {
    revenue: 450000,
    expenses: 280000,
    profit: 170000,
    newClients: 50,
    contractsSigned: 150,
    occupancyRate: '88%',
  };
}

function downloadReport(format) {
  alert(`Downloading report as ${format}`);
}

// Initial report generation
generateReport();
</script>

<template>
  <div class="annual-report-container container-fluid">
    <h2 class="mb-4">{{ $t('annualReport.title') }}</h2>

    <div class="card shadow-sm mb-4">
      <div class="card-header bg-fadaa-primary">
        <h5 class="mb-0 text-white"><i class="bi bi-filter me-2"></i>{{ $t('annualReport.filters.title') }}</h5>
      </div>
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label for="year" class="form-label">{{ $t('annualReport.filters.year') }}</label>
            <select id="year" class="form-select" v-model="filters.year">
              <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <label for="branch" class="form-label">{{ $t('annualReport.filters.branch') }}</label>
            <select id="branch" class="form-select" v-model="filters.branchId">
              <option :value="null">{{ $t('annualReport.filters.allBranches') }}</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <button @click="generateReport" class="btn btn-fadaa-primary w-100"><i class="bi bi-search me-2"></i>{{ $t('annualReport.filters.generate') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-8">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="bi bi-bar-chart-line-fill me-2"></i>{{ $t('annualReport.report.title') }}</h5>
            <div class="btn-group">
              <button @click="downloadReport('csv')" class="btn btn-success btn-sm"><i class="bi bi-file-earmark-spreadsheet me-2"></i>{{ $t('annualReport.report.downloadCsv') }}</button>
              <button @click="downloadReport('xlsx')" class="btn btn-info btn-sm"><i class="bi bi-file-earmark-excel me-2"></i>{{ $t('annualReport.report.downloadXlsx') }}</button>
            </div>
          </div>
          <div class="card-body">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-info-circle me-2"></i>{{ $t('annualReport.summary.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between align-items-center">
                {{ $t('annualReport.summary.totalRevenue') }}
                <span class="fw-bold">€{{ reportData.revenue?.toLocaleString() }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                {{ $t('annualReport.summary.totalExpenses') }}
                <span class="fw-bold">€{{ reportData.expenses?.toLocaleString() }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                {{ $t('annualReport.summary.netProfit') }}
                <span class="fw-bold text-success">€{{ reportData.profit?.toLocaleString() }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                {{ $t('annualReport.summary.newClients') }}
                <span class="fw-bold">{{ reportData.newClients }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                {{ $t('annualReport.summary.contractsSigned') }}
                <span class="fw-bold">{{ reportData.contractsSigned }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                {{ $t('annualReport.summary.avgOccupancy') }}
                <span class="fw-bold">{{ reportData.occupancyRate }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-fadaa-primary {
  background-color: #0d6efd !important;
}
.btn-fadaa-primary {
    background-color: #0d6efd;
    border-color: #0d6efd;
    color: white;
}
.bg-fadaa-light-blue {
    background-color: #e7f1ff;
}
</style>
