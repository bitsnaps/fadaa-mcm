<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import ReportService from '@/services/ReportService';
import ProfileTabs from '@/components/ProfileTabs.vue';
import ApiClient from '@/services/ApiClient';
import { formatCurrency } from '@/helpers/utils.js';
import { saveAs } from 'file-saver';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const { t } = useI18n();
const authStore = useAuthStore();

const user = computed(() => authStore.user);

const branches = ref([]);
const activeProfileId = ref(null);

const filters = ref({
  year: new Date().getFullYear(),
  branchId: null,
  profile_id: null,
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

async function generateReport() {
  if (!filters.value.profile_id) return;
  try {
    const response = await ReportService.getAnnualReport(filters.value);
    if (response.data.success) {
      reportData.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching annual report:', error);
  }
}

async function downloadReport(format) {
  try {
    const config = { ...filters.value, format };
    const response = await ReportService.downloadAnnualReport(config);
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    saveAs(blob, `annual-report-${filters.value.year}.${format}`);
  } catch (error) {
    console.error('Error downloading annual report:', error);
  }
}

onMounted(() => {
  if (user.value.role.name.toLowerCase() === 'manager') {
    filters.value.branchId = user.value.branch_id;
    fetchBranches();
  } else {
    fetchBranches();
  }
});

watch(activeProfileId, (newProfileId) => {
  if (newProfileId) {
    filters.value.profile_id = newProfileId;
    generateReport();
  }
});

function handleProfileChange(profileId) {
  activeProfileId.value = profileId;
}

async function fetchBranches() {
  try {
    const response = await ApiClient.get('/branches');
    if (response.data.success) {
      branches.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching branches:', error);
  }
}
</script>

<template>
  <div class="annual-report-container container-fluid">
    <h2 class="mb-4">{{ $t('annualReport.title') }}</h2>
    <ProfileTabs @update:activeProfile="handleProfileChange">
      <template #default="{ profileId }">
        <div v-if="profileId">
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
                <div class="col-md-4" v-if="user && user.role.name.toLowerCase() !== 'manager'">
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
                      <span class="fw-bold">{{ formatCurrency(reportData.revenue) }}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      {{ $t('annualReport.summary.totalExpenses') }}
                      <span class="fw-bold">{{ formatCurrency(reportData.expenses) }}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      {{ $t('annualReport.summary.netProfit') }}
                      <span class="fw-bold text-success">{{ formatCurrency(reportData.profit) }}</span>
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
    </ProfileTabs>
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
