<template>
  <div class="financial-reporting-container container-fluid">
    <h2 class="mb-4">{{ $t('financialReporting.title') }}</h2>

    <!-- Section 0: Customizable Report Generation -->
    <div class="row mb-5">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-primary">
            <h5 class="mb-0 text-white"><i class="bi bi-file-earmark-settings-fill me-2"></i>{{ $t('financialReporting.customReport.title') }}</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="generateReport">
              <div class="row g-3">
                <div class="col-md-3">
                  <label for="reportType" class="form-label">{{ $t('financialReporting.customReport.reportType') }}</label>
                  <select id="reportType" class="form-select" v-model="reportConfig.type">
                    <option value="profit_loss">{{ $t('financialReporting.customReport.types.profit_loss') }}</option>
                    <option value="balance_sheet">{{ $t('financialReporting.customReport.types.balance_sheet') }}</option>
                    <option value="cash_flow">{{ $t('financialReporting.customReport.types.cash_flow') }}</option>
                    <option value="expense_details">{{ $t('financialReporting.customReport.types.expense_details') }}</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label for="dateRangeStart" class="form-label">{{ $t('financialReporting.customReport.startDate') }}</label>
                  <input type="date" id="dateRangeStart" class="form-control" v-model="reportConfig.startDate">
                </div>
                <div class="col-md-3">
                  <label for="dateRangeEnd" class="form-label">{{ $t('financialReporting.customReport.endDate') }}</label>
                  <input type="date" id="dateRangeEnd" class="form-control" v-model="reportConfig.endDate">
                </div>
                <div class="col-md-3">
                  <label for="reportFormat" class="form-label">{{ $t('financialReporting.customReport.format') }}</label>
                  <select id="reportFormat" class="form-select" v-model="reportConfig.format">
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                    <option value="xlsx">Excel (XLSX)</option>
                  </select>
                </div>
              </div>
              <div class="mt-3 text-end">
                <button type="submit" class="btn btn-fadaa-primary"><i class="bi bi-download me-2"></i>{{ $t('financialReporting.customReport.generate') }}</button>
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

    <!-- Section 2: Expense Breakdown Bar Chart -->
    <div class="row mb-4">
      <div class="col-lg-7">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-bar-chart-line-fill me-2"></i>{{ $t('financialReporting.expenseBreakdown.title') }}</h5>
          </div>
          <div class="card-body">
            <Bar id="expense-barchart" v-if="expenseBreakdownChartData.datasets? expenseBreakdownChartData.datasets.length:false" :data="expenseBreakdownChartData" :options="barChartOptions" />
            <p v-else class="text-center text-muted">{{ $t('financialReporting.revenueVsExpenses.loading') }}</p>
          </div>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-wallet2 me-2"></i>{{ $t('financialReporting.expenseBreakdown.summaryTitle') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="(item, index) in expenseSummary" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                <span><i :class="`bi ${item.icon} me-2`" :style="{color: item.color}"></i>{{ item.category }}</span>
                <span class="fw-bold">{{ formatCurrency(item.amount) }} </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Line, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Filler
} from 'chart.js';
import { formatCurrency } from '@/helpers/utils.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Filler);

const { t } = useI18n();
const revExpFilter = ref('quarterly'); // quarterly, yearly

// --- Report Generation Config ---
const reportConfig = ref({
  type: 'profit_loss',
  startDate: new Date().toISOString().split('T')[0], // Default to today
  endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Default to 30 days from today
  format: 'pdf',
});
const reportGeneratedMessage = ref('');

const generateReport = () => {
  // Simulate report generation
  console.log('Generating report with config:', reportConfig.value);
  reportGeneratedMessage.value = t('financialReporting.customReport.generatingMessage', {
    type: t(`financialReporting.customReport.types.${reportConfig.value.type}`),
    startDate: reportConfig.value.startDate,
    endDate: reportConfig.value.endDate,
    format: reportConfig.value.format.toUpperCase(),
  });
  // In a real app, this would trigger an API call and file download
  setTimeout(() => {
    reportGeneratedMessage.value = '';
  }, 5000); // Clear message after 5 seconds
};

// --- Revenue vs. Expenses Data ---
const quarterlyRevExpData = computed(() => ({
  labels: ['T1 2023', 'T2 2023', 'T3 2023', 'T4 2023', 'T1 2024'],
  datasets: [
    {
      label: t('financialReporting.revenueVsExpenses.revenue') + ' (k)',
      borderColor: '#0D6EFD', // FADAA Blue
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      tension: 0.3,
      fill: true,
      data: [300, 320, 350, 380, 400],
    },
    {
      label: t('financialReporting.revenueVsExpenses.expenses') + ' (k)',
      borderColor: '#DC3545', // Bootstrap Danger Red
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      tension: 0.3,
      fill: true,
      data: [200, 210, 220, 230, 240],
    },
  ],
}));

const yearlyRevExpData = computed(() => ({
  labels: ['2022', '2023', '2024 (Proj.)'],
  datasets: [
    {
      label: t('financialReporting.revenueVsExpenses.revenue') + ' (M)',
      borderColor: '#0D6EFD',
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      tension: 0.3,
      fill: true,
      data: [1.2, 1.5, 1.8],
    },
    {
      label: t('financialReporting.revenueVsExpenses.expenses') + ' (M)',
      borderColor: '#DC3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      tension: 0.3,
      fill: true,
      data: [0.8, 0.9, 1.0],
    },
  ],
}));

const revenueExpenseChartData = ref({ labels: [], datasets: [] });

const lineChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top' },
    title: { display: true, text: t('financialReporting.revenueVsExpenses.title'), font: { size: 16 } },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    y: { beginAtZero: true, title: { display: true, text: t('financialReporting.revenueVsExpenses.amount') } },
    x: { grid: { display: false } },
  },
});

const setRevExpFilter = (filter) => {
  revExpFilter.value = filter;
};

watch(revExpFilter, (newFilter) => {
  if (newFilter === 'quarterly') {
    revenueExpenseChartData.value = quarterlyRevExpData.value;
    lineChartOptions.value.plugins.title.text = t('financialReporting.revenueVsExpenses.chartTitleQuarterly');
    lineChartOptions.value.scales.y.title.text = t('financialReporting.revenueVsExpenses.amountInThousands');
  } else if (newFilter === 'yearly') {
    revenueExpenseChartData.value = yearlyRevExpData.value;
    lineChartOptions.value.plugins.title.text = t('financialReporting.revenueVsExpenses.chartTitleYearly');
    lineChartOptions.value.scales.y.title.text = t('financialReporting.revenueVsExpenses.amountInMillions');
  }
}, { immediate: true });

// --- Expense Breakdown Data ---
// const expenseCategories = computed(() => Object.values(t('financialReporting.expenseBreakdown.categories', { returnObjects: true })));
const expenseCategories = ref(['Loyer', 'Salaires', 'Marketing', 'Fournitures', 'Services Publics', 'Autres']);

const expenseColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

const expenseBreakdownChartData = computed(() => ({
  labels: expenseCategories.value,
  datasets: [
    {
      label: t('financialReporting.expenseBreakdown.chartTitle'),
      backgroundColor: expenseColors,
      borderColor: expenseColors.map(color => color.replace(')', ', 0.7)').replace('rgb', 'rgba')),
      borderWidth: 1,
      data: [500, 800, 200, 150, 100, 50], // Example data
    },
  ],
}));


const barChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y', // Horizontal bar chart
  plugins: {
    legend: { display: false }, // Legend can be redundant if labels are clear
    title: { display: true, text: t('financialReporting.expenseBreakdown.chartTitle'), font: { size: 16 } },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: { beginAtZero: true, title: { display: true, text: t('financialReporting.revenueVsExpenses.amountInThousands') } },
    y: { grid: { display: false } },
  },
});

const expenseSummary = computed(() => {
  return expenseCategories.value.map((category, index) => ({
    category,
    amount: expenseBreakdownChartData.value.datasets ? expenseBreakdownChartData.value.datasets[0].data[index] : 0,
    icon: getCategoryIcon(Object.keys(t('financialReporting.expenseBreakdown.categories', { returnObjects: true }))[index]),
    color: expenseColors[index]
  }));
});

const getCategoryIcon = (categoryKey) => {
  switch (categoryKey) {
    case 'rent': return 'bi-building';
    case 'salaries': return 'bi-people-fill';
    case 'marketing': return 'bi-megaphone-fill';
    case 'supplies': return 'bi-box-seam';
    case 'utilities': return 'bi-lightbulb-fill';
    default: return 'bi-cash-coin';
  }
};

onMounted(() => {
  // Ensure initial data is set for charts if not done by watch immediate
  if (!revenueExpenseChartData.value.datasets.length) {
    setRevExpFilter(revExpFilter.value); // Trigger initial load
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

#expense-barchart {
  height: 300px;
}

#revenue-expense-chart {
  height: 350px;
}
</style>