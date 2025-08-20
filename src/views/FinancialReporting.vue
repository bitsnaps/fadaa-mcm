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
                    <div class="mt-3 text-end">
                      <button type="submit" class="btn btn-fadaa-primary"><i class="bi bi-download me-2"></i>{{ $t('financialReporting.customReport.downloadReport') }}</button>
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
          <!-- Section 3: Investment Breakdown by Type -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-pie-chart-fill me-2"></i>{{ $t('financialReporting.investmentBreakdown.title') }}</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <Doughnut id="investment-pie-chart" v-if="investmentBreakdown.labels.length" :data="investmentBreakdown" :options="pieChartOptions" />
                <p v-else class="text-center text-muted">{{ $t('financialReporting.revenueVsExpenses.loading') }}</p>
              </div>
              <div class="col-md-8">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>{{ $t('financialReporting.investmentBreakdown.type') }}</th>
                      <th>{{ $t('financialReporting.investmentBreakdown.totalInvested') }}</th>
                      <th>{{ $t('financialReporting.investmentBreakdown.totalProfitShare') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(label, index) in investmentBreakdown.labels" :key="index">
                      <td>{{ label }}</td>
                      <td>{{ formatCurrency(investmentBreakdown.datasets[0].data[index]) }}</td>
                      <td>{{ formatCurrency(investmentBreakdown.profitShares[index]) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Line, Bar } from 'vue-chartjs';
import ProfileTabs from '@/components/ProfileTabs.vue';
import {
  Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Filler, ArcElement
} from 'chart.js';
import { formatCurrency } from '@/helpers/utils.js';
import { getRevenueSummary } from '@/services/DashboardService';
import { getExpenses } from '@/services/ExpenseService';
import { getInvestments } from '@/services/InvestmentService';
import ReportService from '@/services/ReportService';
import { saveAs } from 'file-saver';


ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Filler, ArcElement);

const { t } = useI18n();
const activeProfileId = ref(null);
const revExpFilter = ref('quarterly'); // quarterly, yearly

// --- Report Generation Config ---
const reportConfig = ref({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
  format: 'pdf',
});
const reportGeneratedMessage = ref('');

const generateReport = async () => {
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

// --- Chart Data & Options ---
const revenueExpenseChartData = ref({ labels: [], datasets: [] });
const expenseBreakdownChartData = ref({ labels: [], datasets: [] });
const investmentBreakdown = ref({ labels: [], datasets: [{ data: [] }], profitShares: [] });
const expenseSummary = ref([]);
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
const barChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    title: { display: true, text: t('financialReporting.expenseBreakdown.chartTitle'), font: { size: 16 } },
  },
  scales: {
    x: { beginAtZero: true, title: { display: true, text: t('financialReporting.revenueVsExpenses.amountInThousands') } },
  },
});
const pieChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
    },
    title: {
      display: true,
      text: t('financialReporting.investmentBreakdown.chartTitle'),
      font: { size: 16 },
    },
  },
});

// --- Data Fetching ---
const fetchFinancialData = async () => {
  if (!activeProfileId.value) return;

  try {
    // Fetch data for Revenue vs. Expenses chart
    await fetchRevenueExpenseData();
    // Fetch data for Expense Breakdown chart
    await fetchExpenseBreakdownData();
    // Fetch data for Investment Breakdown
    await fetchInvestmentData();

  } catch (error) {
    console.error('Error fetching financial data:', error);
    // Maybe show a toast notification to the user
  }
};

const fetchRevenueExpenseData = async () => {
  const isQuarterly = revExpFilter.value === 'quarterly';
  const { labels, startDate, endDate } = getChartTimeRange(isQuarterly);

  try {
    const response = await getRevenueSummary({
      profile_id: activeProfileId.value,
      startDate,
      endDate,
    });
    const summary = response.data.data;

    revenueExpenseChartData.value = {
      labels,
      datasets: [
        {
          label: t('financialReporting.revenueVsExpenses.revenue'),
          borderColor: '#0D6EFD',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          tension: 0.3,
          fill: true,
          data: [summary.netRevenue], // This needs to be adapted if the API returns time series data
        },
        {
          label: t('financialReporting.revenueVsExpenses.expenses'),
          borderColor: '#DC3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          tension: 0.3,
          fill: true,
          data: [summary.totalExpense], // Same as above
        },
      ],
    };
    // Update chart title and axis labels
    lineChartOptions.value.plugins.title.text = isQuarterly
      ? t('financialReporting.revenueVsExpenses.chartTitleQuarterly')
      : t('financialReporting.revenueVsExpenses.chartTitleYearly');
    lineChartOptions.value.scales.y.title.text = isQuarterly
      ? t('financialReporting.revenueVsExpenses.amountInThousands')
      : t('financialReporting.revenueVsExpenses.amountInMillions');

  } catch (error) {
    console.error('Error fetching revenue/expense data:', error);
    revenueExpenseChartData.value = { labels: [], datasets: [] };
  }
};


const fetchExpenseBreakdownData = async () => {
  try {
    const response = await getExpenses(activeProfileId.value);
    const expenses = response.data.success? response.data.data: [];
    // Aggregate expenses by category
    const breakdown = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + parseFloat(expense.amount);
      return acc;
    }, {});

    const expenseCategories = Object.keys(breakdown);
    const expenseData = Object.values(breakdown);
    const expenseColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

    expenseBreakdownChartData.value = {
      labels: expenseCategories,
      datasets: [{
        label: t('financialReporting.expenseBreakdown.chartTitle'),
        backgroundColor: expenseColors,
        data: expenseData,
      }],
    };
    
    // Update expense summary
    expenseSummary.value = expenseCategories.map((category, index) => ({
      category,
      amount: expenseData[index],
      icon: getCategoryIcon(category),
      color: expenseColors[index % expenseColors.length],
    }));

  } catch (error) {
    console.error('Error fetching expense breakdown:', error);
    expenseBreakdownChartData.value = { labels: [], datasets: [] };
    expenseSummary.value = [];
  }
};

const fetchInvestmentData = async () => {
  if (!activeProfileId.value) return;
  try {
    const response = await getInvestments(activeProfileId.value);
    if (response.data.success) {
      const investments = response.data.data;
      const breakdown = investments.reduce((acc, investment) => {
        const type = investment.type || 'Uncategorized';
        if (!acc[type]) {
          acc[type] = { totalInvested: 0, totalProfitShare: 0 };
        }
        acc[type].totalInvested += investment.investment_amount;
        acc[type].totalProfitShare += investment.yourProfitShareSelectedPeriod || 0;
        return acc;
      }, {});

      const labels = Object.keys(breakdown);
      const totalInvestedData = labels.map(label => breakdown[label].totalInvested);
      const profitSharesData = labels.map(label => breakdown[label].totalProfitShare);

      investmentBreakdown.value = {
        labels,
        datasets: [
          {
            backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#26A69A', '#AB47BC'],
            data: totalInvestedData,
          },
        ],
        profitShares: profitSharesData,
      };
    }
  } catch (error) {
    console.error('Error fetching investment data:', error);
  }
};

const getChartTimeRange = (isQuarterly) => {
  const now = new Date();
  if (isQuarterly) {
    // Example: last 4 quarters + current
    return {
      labels: ['T1 2023', 'T2 2023', 'T3 2023', 'T4 2023', 'T1 2024'], // These are static, need dynamic generation
      startDate: '2023-01-01',
      endDate: '2024-03-31',
    };
  } else {
    // Example: last 2 years + current year projected
    return {
      labels: ['2022', '2023', '2024 (Proj.)'], // Static, need dynamic generation
      startDate: '2022-01-01',
      endDate: '2024-12-31',
    };
  }
};

const getCategoryIcon = (categoryKey) => {
  // This mapping may need to be adjusted based on actual category names from the backend
  const key = categoryKey.toLowerCase();
  if (key.includes('rent')) return 'bi-building';
  if (key.includes('salaries')) return 'bi-people-fill';
  if (key.includes('marketing')) return 'bi-megaphone-fill';
  if (key.includes('supplies')) return 'bi-box-seam';
  if (key.includes('utilities')) return 'bi-lightbulb-fill';
  return 'bi-cash-coin';
};

const setRevExpFilter = (filter) => {
  revExpFilter.value = filter;
  fetchRevenueExpenseData(); // Refetch data when filter changes
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

#expense-barchart {
  height: 300px;
}

#revenue-expense-chart {
  height: 350px;
}
</style>