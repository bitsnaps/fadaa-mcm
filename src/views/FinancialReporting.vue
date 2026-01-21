<template>
  <div class="financial-reporting-container container-fluid">
    <h2 class="mb-4">{{ $t('financialReporting.title') }}</h2>

    <ProfileTabs @update:activeProfile="handleProfileUpdate">
      <template #default="{ profileId }">
        <div v-if="profileId">
          <!-- Section 0: Customizable Report Generation -->
          <div class="row mb-5">
            <div class="col-12">
              <div class="card shadow-sm">
                <div class="card-header bg-fadaa-primary">
                  <h5 class="mb-0 text-white"><i class="bi bi-file-earmark-settings-fill me-2"></i>{{ $t('financialReporting.customReport.title') }}</h5>
                </div>
                <div class="card-body">
                  <form @submit.prevent="downloadReport">
                    <div class="row g-3">
                      <div class="col-md-4">
                        <label for="dateRangeStart" class="form-label">{{ $t('financialReporting.customReport.startDate') }} <span class="text-danger">*</span></label>
                        <input type="date" id="dateRangeStart" class="form-control" v-model="reportConfig.startDate" required>
                      </div>
                      <div class="col-md-4">
                        <label for="dateRangeEnd" class="form-label">{{ $t('financialReporting.customReport.endDate') }} <span class="text-danger">*</span></label>
                        <input type="date" id="dateRangeEnd" class="form-control" v-model="reportConfig.endDate" required>
                      </div>
                      <div class="col-md-4">
                        <label for="reportFormat" class="form-label">{{ $t('financialReporting.customReport.format') }}</label>
                        <select id="reportFormat" class="form-select" v-model="reportConfig.format">
                          <option value="pdf">PDF</option>
                          <option value="csv">CSV</option>
                          <option value="xlsx">Excel (XLSX)</option>
                        </select>
                      </div>
                    </div>
                    <div class="d-flex justify-content-between mt-3">
                        <div>
                          <button type="button" class="btn btn-outline-secondary me-2" @click="setFilterToCurrentMonth">{{ $t('investmentTracking.filters.thisMonth') }}</button>
                          <button type="button" class="btn btn-outline-secondary me-2" @click="setFilterToCurrentYear">{{ $t('investmentTracking.filters.thisYear') }}</button>
                          <button type="button" class="btn btn-outline-primary" @click="refreshFinancialData">
                            <i class="bi bi-arrow-clockwise me-1"></i>{{ $t('financialReporting.customReport.applyFilter') || 'Refresh Charts' }}
                          </button>
                        </div>
                        <button type="submit" class="btn btn-fadaa-primary">
                          <i class="bi bi-download me-2"></i>{{ $t('financialReporting.customReport.downloadReport') }}
                        </button>
                      </div>
                  </form>
                  <div v-if="reportGeneratedMessage" class="alert alert-success mt-3" role="alert">
                    <i class="bi bi-check-circle-fill me-2"></i>{{ reportGeneratedMessage }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 1: Revenue vs. Expenses Line Chart -->
          <div class="row mb-4">
            <div class="col-12">
              <div class="card shadow-sm">
                <div class="card-header bg-fadaa-light-blue">
                  <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="bi bi-graph-up-arrow me-2"></i>{{ $t('financialReporting.revenueVsExpenses.title') }}</h5>
                    <div class="btn-group btn-group-sm" role="group">
                      <button type="button" class="btn btn-outline-primary" @click="setRevExpFilter('quarterly')" :class="{ active: revExpFilter === 'quarterly' }">{{ $t('financialReporting.revenueVsExpenses.quarterly') }}</button>
                      <button type="button" class="btn btn-outline-primary" @click="setRevExpFilter('yearly')" :class="{ active: revExpFilter === 'yearly' }">{{ $t('financialReporting.revenueVsExpenses.yearly') }}</button>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <Line id="revenue-expense-chart" v-if="revenueExpenseChartData.datasets.length" :data="revenueExpenseChartData" :options="lineChartOptions" />
                  <p v-else class="text-center text-muted">{{ $t('financialReporting.revenueVsExpenses.loading') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Category Breakdowns -->
           <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card shadow-sm">
                        <div class="card-header bg-fadaa-light-blue">
                            <h5 class="mb-0"><i class="bi bi-pie-chart-fill me-2"></i>{{ t('incomes.title') }}</h5>
                        </div>
                        <div class="card-body">
                            <Bar id="income-category-chart" v-if="incomeByCategoryChartData.labels && incomeByCategoryChartData.labels.length" :data="incomeByCategoryChartData" :options="stackedBarOptions" />
                            <p v-else class="text-center text-muted">{{ $t('financialReporting.revenueVsExpenses.loading') }}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card shadow-sm">
                        <div class="card-header bg-fadaa-light-blue">
                            <h5 class="mb-0"><i class="bi bi-pie-chart-fill me-2"></i>{{ t('expenses.title') }}</h5>
                        </div>
                        <div class="card-body">
                             <Bar id="expense-category-chart" v-if="expenseByCategoryChartData.labels && expenseByCategoryChartData.labels.length" :data="expenseByCategoryChartData" :options="stackedBarOptions" />
                             <p v-else class="text-center text-muted">{{ $t('financialReporting.revenueVsExpenses.loading') }}</p>
                        </div>
                    </div>
                </div>
          </div>
        </div>
        <div v-if="!activeProfileId" class="text-center">
          <p>{{ $t('financialReporting.noProfileSelected') }}</p>
        </div>
      </template>
    </ProfileTabs>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Line, Bar } from 'vue-chartjs';
import ProfileTabs from '@/components/ProfileTabs.vue';
import {
  Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Filler, ArcElement, BarController
} from 'chart.js';
import { formatCurrency, formatDateForInput } from '@/helpers/utils.js';
import ReportService from '@/services/ReportService';
import { saveAs } from 'file-saver';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Filler, ArcElement, BarController);

const { t, locale } = useI18n();

const activeProfileId = ref(null);
const revExpFilter = ref('quarterly'); // quarterly, yearly

// --- Report Generation Config ---
const reportConfig = ref({
  startDate: formatDateForInput(),
  endDate: formatDateForInput(new Date(new Date().setDate(new Date().getDate() + 30))),
  format: 'pdf',
});
const reportGeneratedMessage = ref('');

const downloadReport = async () => {
  if (!activeProfileId.value) {
    reportGeneratedMessage.value = 'Please select a profile first.';
    return;
  }
  const config = {
    ...reportConfig.value,
    profile_id: activeProfileId.value,
  };

  reportGeneratedMessage.value = t('financialReporting.customReport.generatingMessage', {
    format: config.format.toUpperCase(),
  });

  try {
    const response = await ReportService.downloadReport(config);
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    saveAs(blob, `financial-report-${config.profile_id}.${config.format}`);
    reportGeneratedMessage.value = 'Report generated successfully!';
  } catch (error) {
    console.error('Error generating report:', error);
    reportGeneratedMessage.value = 'Failed to generate report.';
  } finally {
    setTimeout(() => {
      reportGeneratedMessage.value = '';
    }, 5000);
  }
};

const setFilterToCurrentMonth = () => {
  const now = new Date();
  const s = new Date(now.getFullYear(), now.getMonth(), 1);
  const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  reportConfig.value.startDate = formatDateForInput(s);
  reportConfig.value.endDate = formatDateForInput(e);
};

const setFilterToCurrentYear = () => {
  const now = new Date();
  const s = new Date(now.getFullYear(), 0, 1);
  const e = new Date(now.getFullYear(), 11, 31);
  reportConfig.value.startDate = formatDateForInput(s);
  reportConfig.value.endDate = formatDateForInput(e);
};

// --- Chart Data & Options ---
const revenueExpenseChartData = ref({ labels: [], datasets: [] });
const incomeByCategoryChartData = ref({ labels: [], datasets: [] });
const expenseByCategoryChartData = ref({ labels: [], datasets: [] });

const lineChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top' },
    title: { display: true, font: { size: 16 } },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    y: { beginAtZero: true, title: { display: true } },
    x: { grid: { display: false } },
  },
});

const stackedBarOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      font: { size: 16 },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
      beginAtZero: true,
    },
  },
});

// --- Data Fetching ---
const fetchFinancialData = async () => {
  if (!activeProfileId.value) return;

  try {
    const paramsPeriod =
      reportConfig.value.startDate && reportConfig.value.endDate
        ? null
        : revExpFilter.value;

    const response = await ReportService.getFinancialSummary(
      activeProfileId.value,
      paramsPeriod,
      reportConfig.value.startDate,
      reportConfig.value.endDate,
    );

    if (response.data && response.data.success) {
      const { evolution, incomeByMonthByCategory, expenseByMonthByCategory } = response.data.data;

      const labels = Object.keys(evolution).sort();
      revenueExpenseChartData.value = {
        labels,
        datasets: [
          {
            label: t('financialReporting.revenueVsExpenses.revenue'),
            borderColor: '#0D6EFD',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            tension: 0.3,
            fill: true,
            data: labels.map((l) => evolution[l].income),
          },
          {
            label: t('financialReporting.revenueVsExpenses.expenses'),
            borderColor: '#DC3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            tension: 0.3,
            fill: true,
            data: labels.map((l) => evolution[l].expense),
          },
        ],
      };

      const chartColors = ['#42A5F5', '#66BB6A', '#FFA726', '#26A69A', '#AB47BC', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

      const processStackedData = (months, monthlyData) => {
          if (!monthlyData) return { labels: [], datasets: [] };
          const categories = new Set();
          months.forEach(month => {
              if (monthlyData[month]) {
                  Object.keys(monthlyData[month]).forEach(cat => categories.add(cat));
              }
          });

          const datasets = Array.from(categories).map((category, index) => {
              return {
                  label: category,
                  backgroundColor: chartColors[index % chartColors.length],
                  data: months.map(month => (monthlyData[month] && monthlyData[month][category]) || 0)
              };
          });

          return {
              labels: months,
              datasets
          };
      };

      incomeByCategoryChartData.value = processStackedData(labels, incomeByMonthByCategory);
      expenseByCategoryChartData.value = processStackedData(labels, expenseByMonthByCategory);
    } else {
      revenueExpenseChartData.value = { labels: [], datasets: [] };
      incomeByCategoryChartData.value = { labels: [], datasets: [] };
      expenseByCategoryChartData.value = { labels: [], datasets: [] };
    }
  } catch (error) {
    console.error('Error fetching financial data:', error);
    revenueExpenseChartData.value = { labels: [], datasets: [] };
    incomeByCategoryChartData.value = { labels: [], datasets: [] };
    expenseByCategoryChartData.value = { labels: [], datasets: [] };
  }
};

const refreshFinancialData = () => {
  fetchFinancialData();
};

const setRevExpFilter = (filter) => {
  revExpFilter.value = filter;
};

const handleProfileUpdate = (profileId) => {
  activeProfileId.value = profileId;
};

// --- Watchers ---
watch(activeProfileId, (newProfileId) => {
  if (newProfileId) {
    fetchFinancialData();
  }
}, { immediate: true });

onMounted(() => {
  if (activeProfileId.value) {
    fetchFinancialData();
  }
});
</script>

<style scoped>
.financial-reporting-container {
  padding: 20px;
}

.card-header.bg-fadaa-light-blue {
  background-color: #e7f3fe; /* A light, professional blue */
  color: #0d6efd; /* FADAA Blue for text */
  border-bottom: 1px solid #dee2e6;
}

.card-header.bg-fadaa-primary {
  background-color: #0D6EFD; /* FADAA Blue */
}

.btn-fadaa-primary {
  background-color: #0D6EFD;
  border-color: #0D6EFD;
  color: white;
}
.btn-fadaa-primary:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

.btn-outline-primary.active {
    background-color: #0D6EFD;
    color: white;
}

/* Add some spacing for better visual separation */
.card {
  margin-bottom: 1.5rem;
}

.form-label {
  font-weight: 500;
}

#revenue-expense-chart {
  height: 350px;
}
</style>