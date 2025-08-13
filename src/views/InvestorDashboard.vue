<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler } from 'chart.js';
import { formatCurrency } from '@/helpers/utils.js';
import { getMyInvestments, getMyWithdrawals, createWithdrawal } from '@/services/ApiClient.js';
import profileService from '@/services/profileService.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler);

const { t, locale } = useI18n();

const chartFilter = ref('monthly'); // monthly, bi-yearly, yearly
const tableFilter = ref('monthly'); // Default to yearly to show all initially

// --- Investor withdrawals integration (live data) ---
const invIsLoading = ref(true);
const invError = ref(null);
const myInvestments = ref([]);
const myWithdrawals = ref([]);
const activeProfileId = ref(null);
const withdrawalForm = ref({
  investment_id: '',
  amount: '',
  payment_method: '',
  notes: ''
});

const totals = computed(() => {
  const accrued = myInvestments.value.reduce((s, inv) => s + (inv.yourProfitShareSelectedPeriod || 0), 0);
  const withdrawnPaid = myWithdrawals.value
    .filter(w => w.status === 'paid')
    .reduce((s, w) => s + (Number(w.amount) || 0), 0);
  const committed = myWithdrawals.value
    .filter(w => ['pending', 'approved'].includes(w.status))
    .reduce((s, w) => s + (Number(w.amount) || 0), 0);
  const available = Math.max(accrued - (withdrawnPaid + committed), 0);
  return { accrued, withdrawnPaid, committed, available };
});

const selectedInvestmentAvailable = computed(() => {
  const id = withdrawalForm.value.investment_id;
  const inv = myInvestments.value.find(i => String(i.id) === String(id));
  if (!inv) return 0;
  const available = inv.availableForWithdrawal != null
    ? inv.availableForWithdrawal
    : Math.max((inv.yourProfitShareSelectedPeriod || 0) - (inv.withdrawalsCommitted || 0), 0);
  return available;
});

async function loadInvestorData() {
  if (!activeProfileId.value) return;
  invIsLoading.value = true;
  invError.value = null;
  try {
    const params = { profile_id: activeProfileId.value };
    const resInv = await getMyInvestments(params);
    if (resInv.data?.success) {
      myInvestments.value = resInv.data.data || [];
    }
    const resW = await getMyWithdrawals(params);
    if (resW.data?.success) {
      myWithdrawals.value = resW.data.data || [];
    }
  } catch (e) {
    invError.value = e.message || 'Failed to load investor data';
    console.error(e);
  } finally {
    invIsLoading.value = false;
  }
}

async function submitWithdrawal() {
  try {
    const amt = Number(withdrawalForm.value.amount);
    if (!withdrawalForm.value.investment_id || !amt || amt <= 0) {
      alert(t('investorDashboard.withdrawals.form.validationRequired'));
      return;
    }
    if (amt > selectedInvestmentAvailable.value) {
      alert(t('investorDashboard.withdrawals.form.validationExceeds'));
      return;
    }
    const payload = {
      investment_id: withdrawalForm.value.investment_id,
      amount: amt,
      payment_method: withdrawalForm.value.payment_method || undefined,
      notes: withdrawalForm.value.notes || undefined,
      profile_id: activeProfileId.value
    };
    const res = await createWithdrawal(payload);
    if (res.data?.success) {
      withdrawalForm.value.amount = '';
      withdrawalForm.value.payment_method = '';
      withdrawalForm.value.notes = '';
      await loadInvestorData();
      alert(t('investorDashboard.withdrawals.form.success'));
    } else {
      throw new Error(res.data?.message || 'Request failed');
    }
  } catch (e) {
    console.error('Withdrawal submit failed:', e);
    alert(t('investorDashboard.withdrawals.form.error'));
  }
}

async function initializeDashboard() {
  try {
    const response = await profileService.getActiveProfile();
    if (response.data) {
      activeProfileId.value = response.data.id;
      await loadInvestorData();
    } else {
      throw new Error('No active profile found.');
    }
  } catch (error) {
    invError.value = error.message || 'Failed to initialize dashboard.';
    console.error(error);
  }
}

onMounted(initializeDashboard);

// Yearly data (represents all current investments)
const yearlyInvestments = ref([
  {
    id: 1,
    branchName: 'Staoueli (Annuel)',
    amount: 150000,
    sharePercentage: 10,
    NbrOfClients: 200,
    contractStartDate: '01/01/2023',
    contractEndDate: '31/12/2025',
    status: 'active',
  },
  {
    id: 2,
    branchName: 'Cheraga (Annuel)',
    amount: 100000,
    sharePercentage: 8,
    NbrOfClients: 200,
    contractStartDate: '01/06/2022',
    contractEndDate: '31/05/2025',
    status: 'active',
  },
  {
    id: 3,
    branchName: 'Birkhadem (Annuel)',
    amount: 75000,
    sharePercentage: 12,
    NbrOfClients: 450,
    contractStartDate: '01/03/2024',
    contractEndDate: '28/02/2027',
    status: 'pending',
  },
]);

// Sample Monthly Data (e.g., for the current or a specific month)
const monthlyInvestments = ref([
  {
    id: 1,
    branchName: 'Staoueli (Mensuel)',
    amount: 12500, // Monthly revenue portion
    sharePercentage: 10,
    NbrOfClients: 195, // Client count might fluctuate slightly
    status: 'active',
  },
  {
    id: 2,
    branchName: 'Cheraga (Mensuel)',
    amount: 8300,
    sharePercentage: 8,
    NbrOfClients: 198,
    status: 'active',
  },
  // Birkhadem might not have monthly data if 'pending'
]);

// Sample Bi-Yearly Data (e.g., for the current or a specific semester)
const biYearlyInvestments = ref([
  {
    id: 1,
    branchName: 'Staoueli (Semestriel)',
    amount: 75000, // Bi-yearly revenue portion
    sharePercentage: 10,
    NbrOfClients: 200,
    status: 'active',
  },
  {
    id: 2,
    branchName: 'Cheraga (Semestriel)',
    amount: 50000,
    sharePercentage: 8,
    NbrOfClients: 200,
    status: 'active',
  },
  {
    id: 3,
    branchName: 'Birkhadem (Semestriel)',
    amount: 37500, // Assuming it becomes active or has projected data for semester
    sharePercentage: 12,
    NbrOfClients: 450,
    status: 'pending',
  },
]);

const profitShares = ref([
  {
    id: 1,
    date: '15/04/2024',
    branchName: 'Staoueli',
    amount: 3500,
    period: 'T1 2024',
  },
  {
    id: 2,
    date: '15/04/2024',
    branchName: 'Cheraga',
    amount: 2800,
    period: 'T1 2024',
  },
  {
    id: 3,
    date: '15/01/2024',
    branchName: 'Birkhadem',
    amount: 3200,
    period: 'T4 2023',
  },
]);

const documents = ref([
  {
    id: 1,
    name: "Contrat d'investissement - Staoueli.pdf",
    url: '#',
    icon: 'bi-file-earmark-pdf-fill text-danger',
  },
  {
    id: 2,
    name: 'Rapport Annuel 2023.pdf',
    url: '#',
    icon: 'bi-file-earmark-bar-graph-fill text-primary',
  },
  {
    id: 3,
    name: 'Avenant Contrat - Cheraga.docx',
    url: '#',
    icon: 'bi-file-earmark-word-fill text-info',
  },
]);

const filteredInvestmentDetails = computed(() => {
  switch (tableFilter.value) {
    case 'monthly':
      return monthlyInvestments.value;
    case 'bi-yearly':
      return biYearlyInvestments.value;
    case 'yearly':
    default:
      return yearlyInvestments.value;
  }
});

const monthLabels = computed(() => (
    locale.value === 'fr' 
    ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
));

const monthlyData = computed(() => ({
  labels: monthLabels.value,
  datasets: [
    {
      label: t('investorDashboard.chart.monthlyLabel'),
      borderColor: '#0D6EFD',
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      tension: 0.4,
      fill: true,
      data: [120, 150, 130, 160, 180, 170, 190, 210, 200, 220, 240, 230],
    },
  ],
}));

const biYearlyData = computed(() => ({
  labels: ['S1-2023', 'S2-2023', 'S1-2024', 'S2-2024'],
  datasets: [
    {
      label: t('investorDashboard.chart.biYearlyLabel'),
      borderColor: '#0D6EFD',
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      tension: 0.4,
      fill: true,
      data: [800, 950, 1100, 1250],
    },
  ],
}));

const yearlyData = computed(() => ({
  labels: ['2022', '2023', '2024', '2025 (Proj.)'],
  datasets: [
    {
      label: t('investorDashboard.chart.yearlyLabel'),
      borderColor: '#0D6EFD',
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      tension: 0.4,
      fill: true,
      data: [1500, 1750, 2350, 2800],
    },
  ],
}));

const chartData = ref(monthlyData.value);

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    title: {
      display: true,
      text: t('investorDashboard.chart.title'),
      font: {
        size: 16
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: t('investorDashboard.chart.revenue')
      }
    },
    x: {
        grid: {
            display: false
        }
    }
  }
}));

const setChartFilter = (filter) => {
  chartFilter.value = filter;
};

const setTableFilter = (filter) => {
  tableFilter.value = filter;
};

watch(chartFilter, (newFilter) => {
  const options = chartOptions.value;
  switch (newFilter) {
    case 'monthly':
      chartData.value = monthlyData.value;
      options.plugins.title.text = t('investorDashboard.chart.monthlyTitle');
      break;
    case 'bi-yearly':
      chartData.value = biYearlyData.value;
      options.plugins.title.text = t('investorDashboard.chart.biYearlyTitle');
      break;
    case 'yearly':
      chartData.value = yearlyData.value;
      options.plugins.title.text = t('investorDashboard.chart.yearlyTitle');
      break;
  }
}, { immediate: true });

watch(locale, () => {
    // Re-run the filter watcher to update titles
    const currentFilter = chartFilter.value;
    chartFilter.value = '';
    chartFilter.value = currentFilter;
});

</script>

<template>
  <div class="dashboard-container container-fluid">
    <h2 class="mb-4">{{ $t('investorDashboard.title') }}</h2>

    <!-- Withdrawals KPIs + Request -->
    <div class="row gy-4 mb-4">
      <div class="col-md-6">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-cash-coin me-2"></i>{{ $t('investorDashboard.withdrawals.title') }}</h5>
          </div>
          <div class="card-body" v-if="!invIsLoading && !invError">
            <div class="row text-center">
              <div class="col-6 mb-3">
                <div class="fw-semibold">{{ $t('investorDashboard.withdrawals.kpis.accrued') }}</div>
                <div class="fs-5">{{ formatCurrency(totals.accrued) }}</div>
              </div>
              <div class="col-6 mb-3">
                <div class="fw-semibold">{{ $t('investorDashboard.withdrawals.kpis.withdrawnPaid') }}</div>
                <div class="fs-5">{{ formatCurrency(totals.withdrawnPaid) }}</div>
              </div>
              <div class="col-6">
                <div class="fw-semibold">{{ $t('investorDashboard.withdrawals.kpis.committed') }}</div>
                <div class="fs-5">{{ formatCurrency(totals.committed) }}</div>
              </div>
              <div class="col-6">
                <div class="fw-semibold">{{ $t('investorDashboard.withdrawals.kpis.available') }}</div>
                <div class="fs-5">{{ formatCurrency(totals.available) }}</div>
              </div>
            </div>
          </div>
          <div class="card-body" v-else>
            <div v-if="invError" class="alert alert-danger">{{ invError }}</div>
            <div v-else class="text-center">
              <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-send-plus me-2"></i>{{ $t('investorDashboard.withdrawals.form.title') }}</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">{{ $t('investorDashboard.withdrawals.form.selectInvestment') }}</label>
              <select class="form-select" v-model="withdrawalForm.investment_id">
                <option value="" disabled>{{ $t('investorDashboard.withdrawals.form.selectInvestment') }}</option>
                <option v-for="inv in myInvestments" :key="inv.id" :value="inv.id">
                  {{ inv.Branch?.name || inv.name }} ({{ inv.percentage }}%)
                </option>
              </select>
              <small v-if="withdrawalForm.investment_id" class="text-muted">
                {{ $t('investorDashboard.withdrawals.form.availableForThisInvestment') }}:
                {{ formatCurrency(selectedInvestmentAvailable) }}
              </small>
            </div>

            <div class="mb-3">
              <label class="form-label">{{ $t('investorDashboard.withdrawals.form.amount') }}</label>
              <input type="number" class="form-control" v-model="withdrawalForm.amount" min="0" step="0.01" />
            </div>

            <div class="mb-3">
              <label class="form-label">{{ $t('investorDashboard.withdrawals.form.paymentMethod') }}</label>
              <select class="form-select" v-model="withdrawalForm.payment_method">
                <option value="">{{ $t('investorDashboard.withdrawals.form.paymentMethod') }}</option>
                <option value="bank transfer">Bank transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">{{ $t('investorDashboard.withdrawals.form.notes') }}</label>
              <textarea class="form-control" v-model="withdrawalForm.notes" rows="2"></textarea>
            </div>

            <button class="btn btn-primary"
              :disabled="!withdrawalForm.investment_id || !withdrawalForm.amount || Number(withdrawalForm.amount) <= 0 || Number(withdrawalForm.amount) > Number(selectedInvestmentAvailable)"
              @click="submitWithdrawal">
              <i class="bi bi-check2-circle me-1"></i> {{ $t('investorDashboard.withdrawals.form.submit') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Withdrawals -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>{{ $t('investorDashboard.withdrawals.history.title') }}</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>{{ $t('investorDashboard.withdrawals.history.date') }}</th>
                    <th>{{ $t('investorDashboard.withdrawals.history.investment') }}</th>
                    <th>{{ $t('investorDashboard.withdrawals.history.amount') }}</th>
                    <th>{{ $t('investorDashboard.withdrawals.history.status') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="myWithdrawals.length === 0">
                    <td colspan="4" class="text-center">—</td>
                  </tr>
                  <tr v-for="w in myWithdrawals.slice(0,5)" :key="w.id">
                    <td>{{ new Date(w.requested_at || w.created_at).toLocaleString() }}</td>
                    <td>{{ w.Investment?.name || w.investment_id }}</td>
                    <td>{{ formatCurrency(w.amount) }}</td>
                    <td>
                      <span :class="['badge',
                        w.status==='paid' ? 'bg-success' :
                        w.status==='approved' ? 'bg-primary' :
                        w.status==='pending' ? 'bg-warning text-dark' : 'bg-danger']">
                        {{ $t(`investorDashboard.withdrawals.statuses.${w.status}`) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 1: Major KPIs -->
    <div class="row gy-4 mb-4">
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-graph-up me-2 text-fadaa-blue"></i>{{ $t('investorDashboard.kpis.roi') }}</h5>
            <p class="card-text fs-4 fw-bold">15.2%</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-currency-euro me-2 text-fadaa-blue"></i>{{ $t('investorDashboard.kpis.totalRevenue') }}</h5>
            <p class="card-text fs-4 fw-bold"> {{ formatCurrency(1250000)}}</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-people-fill me-2 text-fadaa-blue"></i>{{ $t('investorDashboard.kpis.activeClients') }}</h5>
            <p class="card-text fs-4 fw-bold">850</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Revenue Evolution Line Chart -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="bi bi-briefcase-fill me-2"></i>{{ $t('investorDashboard.investmentDetails.title') }}</h5>
              <div class="btn-group btn-group-sm" role="group" aria-label="Table Filters">
                <button type="button" class="btn btn-outline-primary" @click="setTableFilter('monthly')" :class="{ active: tableFilter === 'monthly' }">{{ $t('investorDashboard.investmentDetails.monthly') }}</button>
                <button type="button" class="btn btn-outline-primary" @click="setTableFilter('bi-yearly')" :class="{ active: tableFilter === 'bi-yearly' }">{{ $t('investorDashboard.investmentDetails.bi-yearly') }}</button>
                <button type="button" class="btn btn-outline-primary" @click="setTableFilter('yearly')" :class="{ active: tableFilter === 'yearly' }">{{ $t('investorDashboard.investmentDetails.yearly') }}</button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>{{ $t('investorDashboard.investmentDetails.table.branch') }}</th>
                    <th>{{ $t('investorDashboard.investmentDetails.table.revenue') }}</th>
                    <th>{{ $t('investorDashboard.investmentDetails.table.share') }}</th>
                    <th>{{ $t('investorDashboard.investmentDetails.table.clients') }}</th>
                    <th>{{ $t('investorDashboard.investmentDetails.table.status') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredInvestmentDetails.length === 0">
                    <td colspan="5" class="text-center">{{ $t('investorDashboard.investmentDetails.noData') }}</td>
                  </tr>
                  <tr v-for="investment in filteredInvestmentDetails" :key="investment.id">
                    <td>{{ investment.branchName }}</td>
                    <td>{{ formatCurrency(investment.amount) }} </td>
                    <td>{{ investment.sharePercentage }}%</td>
                    <td>{{ investment.NbrOfClients }}</td>
                    <td><span :class="`badge bg-${investment.status === 'active' ? 'success' : 'warning'}`">{{ $t(`investorDashboard.statuses.${investment.status}`) }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="bi bi-activity me-2"></i>{{ $t('investorDashboard.revenueEvolution.title') }}</h5>
              <div class="btn-group btn-group-sm" role="group" aria-label="Chart Filters">
                <button type="button" class="btn btn-outline-primary" @click="setChartFilter('monthly')" :class="{ active: chartFilter === 'monthly' }">{{ $t('investorDashboard.revenueEvolution.monthly') }}</button>
                <button type="button" class="btn btn-outline-primary" @click="setChartFilter('bi-yearly')" :class="{ active: chartFilter === 'bi-yearly' }">{{ $t('investorDashboard.revenueEvolution.bi-yearly') }}</button>
                <button type="button" class="btn btn-outline-primary" @click="setChartFilter('yearly')" :class="{ active: chartFilter === 'yearly' }">{{ $t('investorDashboard.revenueEvolution.yearly') }}</button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <Line :data="chartData" :options="chartOptions" style="height: 350px;" />
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Recent Activities -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-list-stars me-2"></i>{{ $t('investorDashboard.recentActivities.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item"><i class="bi bi-building-add text-success me-2"></i>{{ $t('investorDashboard.recentActivities.activity1') }}</li>
              <li class="list-group-item"><i class="bi bi-cash-stack text-primary me-2"></i>{{ $t('investorDashboard.recentActivities.activity2') }}</li>
              <li class="list-group-item"><i class="bi bi-graph-up-arrow text-info me-2"></i>{{ $t('investorDashboard.recentActivities.activity3') }}</li>
              <li class="list-group-item"><i class="bi bi-person-plus-fill text-fadaa-orange me-2"></i>{{ $t('investorDashboard.recentActivities.activity4') }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 4: Profit Share History -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-pie-chart-fill me-2"></i>{{ $t('investorDashboard.profitShareHistory.title') }}</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>{{ $t('investorDashboard.profitShareHistory.table.date') }}</th>
                    <th>{{ $t('investorDashboard.profitShareHistory.table.branch') }}</th>
                    <th>{{ $t('investorDashboard.profitShareHistory.table.amountReceived') }}</th>
                    <th>{{ $t('investorDashboard.profitShareHistory.table.period') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="share in profitShares" :key="share.id">
                    <td>{{ share.date }}</td>
                    <td>{{ share.branchName }}</td>
                    <td>{{ formatCurrency(share.amount) }}</td>
                    <td>{{ share.period }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 5: Documents -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-file-earmark-text-fill me-2"></i>{{ $t('investorDashboard.documents.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="doc in documents" :key="doc.id" class="list-group-item d-flex justify-content-between align-items-center">
                <span><i :class="`bi ${doc.icon} me-2`"></i>{{ doc.name }}</span>
                <a :href="doc.url" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-download me-1"></i> {{ $t('investorDashboard.documents.download') }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 6: Call to Action -->
    <div class="row mb-4">
      <div class="col-12 text-center">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title">{{ $t('investorDashboard.cta.title') }}</h5>
            <p class="card-text">{{ $t('investorDashboard.cta.description') }}</p>
            <button class="btn btn-success btn-lg me-2 mb-2"><i class="bi bi-folder-plus me-2"></i>{{ $t('investorDashboard.cta.requestBranch') }}</button>
            <button class="btn btn-outline-success btn-lg mb-2"><i class="bi bi-currency-dollar me-2"></i>{{ $t('investorDashboard.cta.investMore') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can go here if needed */
.text-fadaa-orange {
  color: var(--fadaa-orange);
}
</style>
