<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler } from 'chart.js';
// import { getRevenueSeries } from '@/services/RevenueService';
import { formatCurrency } from '@/helpers/utils.js';
import { getMyWithdrawals, createWithdrawal } from '@/services/WithdrawalService';
import { getMyInvestments } from '@/services/InvestmentService';
import { getMyDocuments, getProfitShareSeries } from '@/services/InvestorService';
import profileService from '@/services/profileService';
import { getInvestorKpis } from '@/services/DashboardService';
import { useToast } from '@/helpers/toast';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler);

const { t, locale } = useI18n();
const { showErrorToast } = useToast();

// const chartFilter = ref('monthly'); // monthly, bi-yearly, yearly
// const revenueSeries = ref({ labels: [], values: [] });

// --- Investor withdrawals integration (live data) ---
const invIsLoading = ref(true);
const invError = ref(null);
const myInvestments = ref([]);
const myWithdrawals = ref([]);
const profitSeries = ref({ labels: [], values: [] });
const activeProfileId = ref(null);
const selectedYear = ref(new Date().getFullYear());
const profitLoading = ref(false);

const availableYears = computed(() => {
  const current = new Date().getFullYear();
  if (!myInvestments.value || myInvestments.value.length === 0) {
    return [current];
  }
  const startYears = myInvestments.value.map(inv => {
    const dateStr = inv.starting_date || inv.created_at;
    return dateStr ? new Date(dateStr).getFullYear() : current;
  });
  const minYear = Math.min(...startYears, current);
  const years = [];
  for (let y = current; y >= minYear; y--) {
    years.push(y);
  }
  return years;
});

const withdrawalForm = ref({
  investment_id: '',
  amount: '',
  payment_method: '',
  notes: ''
});

const kpis = ref({
  roi: 0,
  totalRevenue: 0,
  activeClients: 0,
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

async function fetchProfitShareSeries() {
  if (!activeProfileId.value) return;
  profitLoading.value = true;
  try {
    const year = selectedYear.value;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const resProfit = await getProfitShareSeries({
      profile_id: activeProfileId.value,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    if (resProfit.data?.success) {
      const d = resProfit.data.data || {};
      profitSeries.value = {
        labels: d.labels || [],
        values: d.profitShare || []
      };
    }
  } catch (e) {
    console.error('Failed to load profit share series', e);
  } finally {
    profitLoading.value = false;
  }
}

watch(selectedYear, () => {
  fetchProfitShareSeries();
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
    const resDocs = await getMyDocuments(params);
    if (resDocs.data?.success) {
      documents.value = (resDocs.data.data || []).map(d => ({
        id: d.id,
        name: d.title,
        url: d.file_path,
        icon: d.type === 'Contract' ? 'bi-file-earmark-pdf-fill text-danger' : 'bi-file-earmark-text'
      }));
    }

    // Load Profit Share Series
    await fetchProfitShareSeries();

    const resKpis = await getInvestorKpis(params);
    if (resKpis.data?.success) {
      kpis.value = resKpis.data.data;
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
      showErrorToast(t('investorDashboard.withdrawals.form.validationRequired'));
      return;
    }
    if (amt > selectedInvestmentAvailable.value) {
      showErrorToast(t('investorDashboard.withdrawals.form.validationExceeds'));
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
      // Success toast comes from interceptor when backend sends a message
    } else {
      throw new Error(res.data?.message || 'Request failed');
    }
  } catch (e) {
    console.error('Withdrawal submit failed:', e);
    // Error toast is handled globally by ApiClient interceptor
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

// Profit shares derived from paid withdrawals
const paidWithdrawals = computed(() => myWithdrawals.value.filter(w => w.status === 'paid'));

// Documents from backend
const documents = ref([]);

// const monthLabels = computed(() => (
//     locale.value === 'fr'
//     ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
//     : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// ));

// const monthlyData = computed(() => ({
//   labels: revenueSeries.value.labels.length ? revenueSeries.value.labels : monthLabels.value,
//   datasets: [
//     {
//       label: t('investorDashboard.chart.monthlyLabel'),
//       borderColor: '#0D6EFD',
//       backgroundColor: 'rgba(13, 110, 253, 0.1)',
//       tension: 0.4,
//       fill: true,
//       data: revenueSeries.value.values.length ? revenueSeries.value.values : [0,0,0,0,0,0,0,0,0,0,0,0],
//     },
//   ],
// }));

// const biYearlyData = computed(() => ({
//   labels: ['S1-2023', 'S2-2023', 'S1-2024', 'S2-2024'],
//   datasets: [
//     {
//       label: t('investorDashboard.chart.biYearlyLabel'),
//       borderColor: '#0D6EFD',
//       backgroundColor: 'rgba(13, 110, 253, 0.1)',
//       tension: 0.4,
//       fill: true,
//       data: [800, 950, 1100, 1250],
//     },
//   ],
// }));

// const yearlyData = computed(() => ({
//   labels: ['2022', '2023', '2024', '2025 (Proj.)'],
//   datasets: [
//     {
//       label: t('investorDashboard.chart.yearlyLabel'),
//       borderColor: '#0D6EFD',
//       backgroundColor: 'rgba(13, 110, 253, 0.1)',
//       tension: 0.4,
//       fill: true,
//       data: [1500, 1750, 2350, 2800],
//     },
//   ],
// }));

// const chartData = ref(monthlyData.value);

// const chartOptions = computed(() => ({
//   responsive: true,
//   maintainAspectRatio: false,
//   plugins: {
//     legend: {
//       display: true,
//       position: 'top',
//     },
//     title: {
//       display: true,
//       text: t('investorDashboard.chart.title'),
//       font: {
//         size: 16
//       }
//     },
//     tooltip: {
//       mode: 'index',
//       intersect: false,
//     }
//   },
//   scales: {
//     y: {
//       beginAtZero: true,
//       title: {
//         display: true,
//         text: t('investorDashboard.chart.revenue')
//       }
//     },
//     x: {
//         grid: {
//             display: false
//         }
//     }
//   }
// }));

// Chart filter controls removed from UI; chart remains illustrative

// Removed table filter per requirement: investor sees only active profile data


// watch(chartFilter, (newFilter) => {
//   const options = chartOptions.value;
//   switch (newFilter) {
//     case 'monthly':
//       chartData.value = monthlyData.value;
//       options.plugins.title.text = t('investorDashboard.chart.monthlyTitle');
//       break;
//     case 'bi-yearly':
//       chartData.value = biYearlyData.value;
//       options.plugins.title.text = t('investorDashboard.chart.biYearlyTitle');
//       break;
//     case 'yearly':
//       chartData.value = yearlyData.value;
//       options.plugins.title.text = t('investorDashboard.chart.yearlyTitle');
//       break;
//   }
// }, { immediate: true });

// watch(locale, () => {
//     // Re-run the filter watcher to update titles
//     const currentFilter = chartFilter.value;
//     chartFilter.value = '';
//     chartFilter.value = currentFilter;
// });

</script>

<template>
  <div class="dashboard-container container-fluid">
    <h2 class="mb-4">{{ $t('investorDashboard.title') }}</h2>

    <!-- Section 1: Major KPIs -->
    <div class="row gy-4 mb-4">
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-graph-up me-2 text-fadaa-blue"></i>{{ $t('investorDashboard.kpis.roi') }}</h5>
            <p class="card-text fs-4 fw-bold" :class="{'text-danger': kpis.roi < 0}">{{ kpis.roi.toFixed(2) }}%</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-currency-euro me-2 text-fadaa-blue"></i>{{ $t('investorDashboard.kpis.totalRevenue') }}</h5>
            <p class="card-text fs-4 fw-bold" :class="{'text-danger': kpis.totalRevenue < 0}"> {{ formatCurrency(kpis.totalRevenue) }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-people-fill me-2 text-fadaa-blue"></i>{{ $t('investorDashboard.kpis.activeClients') }}</h5>
            <p class="card-text fs-4 fw-bold">{{ kpis.activeClients }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Revenue Evolution Line Chart -->
    <div class="row mb-4">
      <div class="col-md-12 mb-4">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="bi bi-briefcase-fill me-2"></i>{{ $t('investorDashboard.investmentDetails.title') }}</h5>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>{{ $t('investorDashboard.investmentDetails.table.branch') }}</th>
                    <th>{{ $t('investorDashboard.investmentDetails.table.share') }}</th>
                    <th>{{ $t('investorDashboard.investmentDetails.table.monthlyProfit') }}</th>
                    <th>{{ $t('investorDashboard.investmentDetails.table.projectedProfit') }}</th>
                    <th>{{ $t('investorDashboard.withdrawals.kpis.accrued') }}</th>
                    <th>{{ $t('investorDashboard.withdrawals.kpis.committed') }}</th>
                    <th>{{ $t('investorDashboard.withdrawals.kpis.available') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="myInvestments.length === 0">
                    <td colspan="7" class="text-center">{{ $t('investorDashboard.investmentDetails.noData') }}</td>
                  </tr>
                  <tr v-for="inv in myInvestments" :key="inv.id">
                    <td>{{ inv.Branch?.name || inv.name }}</td>
                    <td>{{ inv.percentage }}%</td>
                    <td :class="{'text-danger fw-bold': inv.monthlyProfit < 0}">{{ formatCurrency(inv.monthlyProfit || 0) }}</td>
                    <td :class="{'text-danger fw-bold': inv.projectedProfit < 0}">{{ formatCurrency(inv.projectedProfit || 0) }}</td>
                    <td :class="{'text-danger fw-bold': inv.yourProfitShareSelectedPeriod < 0}">{{ formatCurrency(inv.yourProfitShareSelectedPeriod || 0) }}</td>
                    <td>{{ formatCurrency(inv.withdrawalsCommitted || 0) }}</td>
                    <td>{{ formatCurrency(inv.availableForWithdrawal != null ? inv.availableForWithdrawal : Math.max((inv.yourProfitShareSelectedPeriod || 0) - (inv.withdrawalsCommitted || 0), 0)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Profit Share List -->
      <div class="col-md-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="bi bi-calendar-check me-2"></i>{{ $t('investorDashboard.investmentDetails.table.monthlyProfit') }}</h5>
              <select class="form-select form-select-sm w-auto" v-model="selectedYear">
                <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>
          <div class="card-body">
             <div class="table-responsive">
              <table class="table table-hover table-bordered">
                <thead>
                  <tr>
                    <th v-for="(label, index) in profitSeries.labels" :key="'h-'+index" class="text-center">{{ label }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="profitLoading">
                    <td :colspan="profitSeries.labels.length || 12" class="text-center py-4">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                  <tr v-else>
                    <td v-for="(value, index) in profitSeries.values" :key="'v-'+index" class="text-center">
                      <span :class="{'text-success fw-bold': value > 0, 'text-danger fw-bold': value < 0, 'text-muted': value === 0}">
                        {{ formatCurrency(value) }}
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

    <!-- Section 3: Recent Activities (not implemented)-->
    <!-- <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-list-stars me-2"></i>{{ $t('investorDashboard.recentActivities.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item" v-for="activity in activities" :key="activity.id"><i :class="bi bi-building-add text-{activity.type} me-2"></i>{{ activity.content }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div> -->

    <!-- Section 4: Profit Share History -->
    <!-- <div class="row mb-4">
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
                  <tr v-for="w in paidWithdrawals" :key="w.id">
                    <td>{{ new Date(w.paid_at || w.updated_at || w.created_at).toLocaleString() }}</td>
                    <td>{{ w.Investment?.name || w.investment_id }}</td>
                    <td>{{ formatCurrency(w.amount) }}</td>
                    <td>{{ $t('investorDashboard.revenueEvolution.monthly') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div> -->

    <!-- Section 5: Withdrawals -->
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
                <div class="fs-5" :class="{'text-danger fw-bold': totals.accrued < 0}">{{ formatCurrency(totals.accrued) }}</div>
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
                    <td>{{ w.Investment?.name || (myInvestments.find(i => i.id===w.investment_id)?.name) || w.investment_id }}</td>
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

    <!-- Section 6: Documents -->
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
