<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
import { Line, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, ArcElement, Filler } from 'chart.js';
import { formatCurrency, formatDate } from "@/helpers/utils.js";
import ApiClient from '@/services/ApiClient.js';
import ProfileTabs from '@/components/ProfileTabs.vue';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, ArcElement, Filler);

const { t } = useI18n();
const authStore = useAuthStore();
const userRole = computed(() => authStore.userRole);

const investments = ref([]);
const isLoading = ref(true);
const error = ref(null);
const activeProfileId = ref(null);
const selectedBranch = ref('all');

// Date range filter
const fromDate = ref(localStorage.getItem('investmentTracking-fromDate') || '');
const toDate = ref(localStorage.getItem('investmentTracking-toDate') || '');

const updateActiveProfile = (profileId) => {
  activeProfileId.value = profileId;
};

const investmentSummary = computed(() => {
  if (!investments.value.length) {
    return {
      totalInvested: 0,
      totalProfitShare: 0, // This needs to be calculated based on financial reports or similar data
      overallROI: 0,
      activeInvestmentsCount: 0,
      nextPayoutDate: 'N/A',
    };
  }

  const totalInvested = investments.value.reduce((sum, inv) => sum + inv.investment_amount, 0);
  const activeInvestments = investments.value.filter(inv => new Date(inv.ending_date) > new Date());

  // Profit share and ROI calculation
  const totalProfitShare = investments.value.reduce((sum, inv) => sum + (inv.yourProfitShareSelectedPeriod || 0), 0);
  
  const overallROI = totalInvested > 0 ? (totalProfitShare / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalProfitShare,
    overallROI: overallROI.toFixed(2),
    activeInvestmentsCount: activeInvestments.length,
    nextPayoutDate: 'N/A', // This would require specific logic/data
  };
});

const branchInvestments = computed(() => {
  return investments.value.map(inv => {
    const status = getInvestmentStatus(inv.starting_date, inv.ending_date);
    return {
      id: inv.id,
      branchName: inv.Branch ? inv.Branch.name : 'N/A',
      investmentAmount: inv.investment_amount,
      participationPercentage: inv.percentage,
      type: inv.type,
      contractStartDate: formatDate(inv.starting_date),
      contractEndDate: formatDate(inv.ending_date),
      daysRemaining: calculateDaysRemaining(inv.ending_date),
      branchNetProfitSelectedPeriod: inv.branchNetProfitSelectedPeriod || 0,
      yourProfitShareSelectedPeriod: inv.yourProfitShareSelectedPeriod || 0,
      totalIncome: inv.totalIncome || 0,
      totalExpenses: inv.totalExpenses || 0,
      status: status,
    };
  });
});

const filteredInvestments = computed(() => {
  if (selectedBranch.value === 'all') {
    return branchInvestments.value;
  }
  return branchInvestments.value.filter(inv => inv.branchName === selectedBranch.value);
});

// Get unique branches for the filter dropdown
const uniqueBranches = computed(() => {
  const branches = investments.value.map(inv => ({
    id: inv.Branch?.id,
    name: inv.Branch?.name || 'N/A'
  }));

  // Remove duplicates based on branch id
  const unique = branches.filter((branch, index, self) =>
    index === self.findIndex(b => b.id === branch.id)
  );

  return unique;
});

// Calculate totals for the investments table
const investmentTotals = computed(() => {
  return filteredInvestments.value.reduce((totals, inv) => {
    totals.totalInvested += inv.investmentAmount || 0;
    totals.totalIncome += inv.totalIncome || 0;
    totals.totalExpenses += inv.totalExpenses || 0;
    totals.totalBranchNetProfit += inv.branchNetProfitSelectedPeriod || 0;
    totals.totalYourProfitShare += inv.yourProfitShareSelectedPeriod || 0;
    return totals;
  }, {
    totalInvested: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalBranchNetProfit: 0,
    totalYourProfitShare: 0
  });
});


const profitSharePayouts = ref([]); // Placeholder - Requires a dedicated endpoint

// const documents = ref([]); // Placeholder - Requires a dedicated endpoint

// Chart data
const chartData = ref({
  profitShare: { labels: [], datasets: [] },
  branchBreakdown: { labels: [], datasets: [] }
});

const isChartLoading = ref(false);
const chartError = ref(null);

// Chart options
const lineChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    title: {
      display: false,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function(context) {
          return `${context.dataset.label}: ${formatCurrency(context.parsed.y, '')}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: t('investmentTracking.charts.profitShareAmount')
      },
      ticks: {
        callback: function(value) {
          return formatCurrency(value, '');
        }
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}));

const doughnutChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
    },
    title: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = formatCurrency(context.parsed, '');
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  }
}));

const fetchInvestments = async (profileId) => {
  if (!profileId) return;
  try {
    isLoading.value = true;
    error.value = null;
    investments.value = []; // Reset on new fetch
    const params = { profile_id: profileId };
    if (fromDate.value && toDate.value) {
      params.startDate = fromDate.value;
      params.endDate = toDate.value;
      localStorage.setItem('investmentTracking-fromDate', fromDate.value);
      localStorage.setItem('investmentTracking-toDate', toDate.value);
    }
    const { data: response } = await ApiClient.get('/investments', { params });
    if (response.success) {
      investments.value = response.data;
    } else {
      throw new Error(response.message || 'Failed to fetch investments');
    }
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching investments:', err);
  } finally {
    isLoading.value = false;
  }
};

const fetchProfitSharePayouts = async (profileId) => {
  if (!profileId) return;
  try {
    const params = {
      profile_id: profileId,
      status: 'paid', // We only want the paid ones
    };
    const endpoint = userRole.value === 'admin' ? '/withdrawals' : '/investor/withdrawals';
    const { data: response } = await ApiClient.get(endpoint, { params });
    
    if (response.success) {
      
      profitSharePayouts.value = response.data.map(p => ({
        id: p.id,
        payoutDate: formatDate(p.paid_at || p.updated_at),
        branchName: p.Investment?.Branch?.name || 'N/A',
        amountPaid: p.amount,
        transactionId: p.transaction_id || `WID-${p.id}`,
      }));

    } else {
      console.error('Failed to fetch profit share payouts:', response.message);
      profitSharePayouts.value = [];
    }
  } catch (err) {
    console.error('Error fetching profit share payouts:', err);
    profitSharePayouts.value = []; // Reset on error
  }
};

const fetchChartData = async (profileId) => {
  if (!profileId) return;
  try {
    isChartLoading.value = true;
    chartError.value = null;

    const params = { profile_id: profileId };
    if (fromDate.value && toDate.value) {
      params.startDate = fromDate.value;
      params.endDate = toDate.value;
    }

    const { data: response } = await ApiClient.get('/investor/profit-share-series', { params });
    
    if (response.success) {
      const { labels, profitShare, branchBreakdown } = response.data;

      // Update profit share line chart data
      chartData.value.profitShare = {
        labels,
        datasets: [
          {
            label: t('investmentTracking.charts.yourProfitShare'),
            borderColor: '#0D6EFD',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            tension: 0.4,
            fill: true,
            data: profitShare,
          },
        ],
      };

      // Update branch breakdown doughnut chart data
      if (branchBreakdown && branchBreakdown.length > 0) {
        const colors = ['#0D6EFD', '#198754', '#FFC107', '#DC3545', '#6F42C1', '#FD7E14', '#20C997'];
        chartData.value.branchBreakdown = {
          labels: branchBreakdown.map(b => b.branchName),
          datasets: [
            {
              data: branchBreakdown.map(b => b.totalProfit),
              backgroundColor: colors.slice(0, branchBreakdown.length),
              borderWidth: 2,
              borderColor: '#fff',
            },
          ],
        };
      } else {
        // Empty state for branch breakdown
        chartData.value.branchBreakdown = {
          labels: [t('investmentTracking.charts.noData')],
          datasets: [
            {
              data: [1],
              backgroundColor: ['#E9ECEF'],
              borderWidth: 0,
            },
          ],
        };
      }
    } else {
      throw new Error(response.message || 'Failed to fetch chart data');
    }
  } catch (err) {
    chartError.value = err.message;
    console.error('Error fetching chart data:', err);
  } finally {
    isChartLoading.value = false;
  }
};

onMounted(() => {
  // Initial fetch will be triggered by the watcher once activeProfileId is set by ProfileTabs
});

watch(activeProfileId, (newProfileId) => {
  if (newProfileId) {
    // default date range to this month on profile switch if empty
    if (!fromDate.value || !toDate.value) {
      setFilterToCurrentMonth();
    }
    fetchInvestments(newProfileId);
    fetchChartData(newProfileId);
    fetchProfitSharePayouts(newProfileId);
  }
}, { immediate: true });

const refreshCharts = () => {
  if (activeProfileId.value) {
    fetchChartData(activeProfileId.value);
  }
};

const setFilterToCurrentMonth = () => {
  const now = new Date();
  const s = new Date(now.getFullYear(), now.getMonth(), 1);
  const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  fromDate.value = s.toISOString().split('T')[0];
  toDate.value = e.toISOString().split('T')[0];
  fetchInvestments(activeProfileId.value);
  fetchChartData(activeProfileId.value);
  fetchProfitSharePayouts(activeProfileId.value);
};

const setFilterToCurrentYear = () => {
  const now = new Date();
  const s = new Date(now.getFullYear(), 0, 1);
  const e = new Date(now.getFullYear(), 11, 31);
  fromDate.value = s.toISOString().split('T')[0];
  toDate.value = e.toISOString().split('T')[0];
  fetchInvestments(activeProfileId.value);
  fetchChartData(activeProfileId.value);
  fetchProfitSharePayouts(activeProfileId.value);
};

function calculateDaysRemaining(endDateString) {
  if (!endDateString) return 0;
  const today = new Date();
  const endDate = new Date(endDateString);
  const differenceInTime = endDate.getTime() - today.getTime();
  if (differenceInTime < 0) return 0;
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
  return differenceInDays;
}

const getInvestmentStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysRemaining = calculateDaysRemaining(endDate);

    if (now > end) {
        return 'Expired';
    } else if (daysRemaining <= 30) {
        return 'Expiring Soon';
    } else if (now >= start) {
        return 'Active';
    } else {
        return 'Pending';
    }
};

const getStatusClass = (status) => {
  if (status === 'Active') return 'bg-success text-white';
  if (status === 'Expiring Soon') return 'bg-warning text-dark';
  if (status === 'Expired') return 'bg-danger text-white';
  return 'bg-secondary text-white';
};

const getStatusTranslation = (status) => {
    if (!status) return '';
  const statusKey = status.replace(/\s+/g, '').toLowerCase();
  return t(`investmentTracking.statuses.${statusKey}`);
};

// Placeholder for chart data and logic (e.g., using Chart.js)
// onMounted(() => { /* Initialize charts here */ });

</script>

<template>
  <div class="container-fluid p-4">
    <h1 class="h3 mb-4 text-gray-800">{{ $t('investmentTracking.title') }}</h1>
    <ProfileTabs @update:active-profile="updateActiveProfile" />

    <!-- Global Date Range Filter for the whole page -->
    <div class="card shadow-sm mb-3" v-if="activeProfileId">
      <div class="card-body d-flex flex-wrap align-items-end gap-3">
        <div>
          <label class="form-label mb-1">{{ $t('investmentTracking.filters.from') }}</label>
          <input type="date" class="form-control" v-model="fromDate" />
        </div>
        <div>
          <label class="form-label mb-1">{{ $t('investmentTracking.filters.to') }}</label>
          <input type="date" class="form-control" v-model="toDate" />
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="setFilterToCurrentMonth" :disabled="isLoading">{{ $t('investmentTracking.filters.thisMonth') }}</button>
          <button class="btn btn-outline-secondary" @click="setFilterToCurrentYear" :disabled="isLoading">{{ $t('investmentTracking.filters.thisYear') }}</button>
        </div>
        <div class="ms-auto">
          <button class="btn btn-fadaa-orange" @click="fetchInvestments(activeProfileId)" :disabled="isLoading">{{ $t('investmentTracking.filters.apply') }}</button>
        </div>
      </div>
    </div>

    <div v-if="activeProfileId">
      <div v-if="isLoading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div v-if="!isLoading && !error">
        <!-- Investment Summary -->
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">{{ $t('investmentTracking.summary.title') }}</h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card border-left-primary shadow h-100 py-2">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">{{ $t('investmentTracking.summary.totalInvested') }}</div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800">{{ formatCurrency(investmentSummary.totalInvested, '') }}</div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-piggy-bank fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card border-left-success shadow h-100 py-2">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-success text-uppercase mb-1">{{ $t('investmentTracking.summary.totalProfitShare') }}</div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800">{{ formatCurrency(investmentSummary.totalProfitShare, '') }}</div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-hand-holding-usd fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card border-left-info shadow h-100 py-2">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-info text-uppercase mb-1">{{ $t('investmentTracking.summary.overallROI') }}</div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800">{{ investmentSummary.overallROI }}%</div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-chart-line fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-3 col-md-6 mb-4">
              <div class="card border-left-warning shadow h-100 py-2">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">{{ $t('investmentTracking.summary.activeInvestments') }}</div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800">{{ investmentSummary.activeInvestmentsCount }} {{ $t('investmentTracking.summary.agencies') }}</div>
                       <small class="text-muted">{{ $t('investmentTracking.summary.nextPayout') }}: {{ investmentSummary.nextPayoutDate }}</small>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-store-alt fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Per-Branch Investment Breakdown -->
      <div class="card shadow mb-4">
        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 class="m-0 font-weight-bold text-primary">{{ $t('investmentTracking.breakdown.title') }}</h6>
          <div class="dropdown no-arrow">
            <label for="branchFilter" class="sr-only">{{ $t('investmentTracking.breakdown.filter') }}</label>
            <select id="branchFilter" v-model="selectedBranch" class="form-select form-select-sm">
              <option value="all">{{ $t('investmentTracking.breakdown.allBranches') }}</option>
              <option v-for="branch in uniqueBranches" :key="branch.id" :value="branch.name">{{ branch.name }}</option>
            </select>
          </div>
        </div>
        <div class="card-body">
          <div v-if="filteredInvestments.length === 0" class="text-center">
            <p>{{ $t('investmentTracking.breakdown.noInvestments') }}</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table table-bordered" width="100%" cellspacing="0">
              <thead>
                <tr>
                  <th>{{ $t('investmentTracking.breakdown.branchName') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.investmentAmount') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.typeOfInvestment') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.yourStake') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.contractStart') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.contractEnd') }}</th>
                  <!-- <th>{{ $t('investmentTracking.breakdown.totalIncome') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.totalExpenses') }}</th> -->
                  <th>{{ $t('investmentTracking.breakdown.branchNetProfit') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.yourProfitShare') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.status') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="branch in filteredInvestments" :key="branch.id">
                  <td>{{ branch.branchName }}</td>
                  <td>{{ formatCurrency(branch.investmentAmount, '') }}</td>
                  <td>{{ t(`investments.tableHeaders.${branch.type.toLowerCase()}`) }} </td>
                  <td>{{ branch.participationPercentage }}%</td>
                  <td>{{ branch.contractStartDate }}</td>
                  <td>{{ branch.contractEndDate }} ({{ branch.daysRemaining }} {{ $t('investmentTracking.breakdown.daysRemaining') }})</td>
                  <!-- <td>{{ formatCurrency(branch.totalIncome, '') }}</td>
                  <td>{{ formatCurrency(branch.totalExpenses, '') }}</td> -->
                  <td>{{ formatCurrency(branch.branchNetProfitSelectedPeriod, '') }}</td>
                  <td>{{ formatCurrency(branch.yourProfitShareSelectedPeriod, '') }}</td>
                  <td><span :class="['badge', getStatusClass(branch.status)]">{{ getStatusTranslation(branch.status) }}</span></td>
                </tr>
              </tbody>
              <tfoot v-if="filteredInvestments.length > 0" class="table-light">
                <tr class="fw-bold">
                  <td>{{ $t('investmentTracking.breakdown.totals') }}</td>
                  <td>{{ formatCurrency(investmentTotals.totalInvested, '') }}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <!-- <td>{{ formatCurrency(investmentTotals.totalIncome, '') }}</td>
                  <td>{{ formatCurrency(investmentTotals.totalExpenses, '') }}</td> -->
                  <td>{{ formatCurrency(investmentTotals.totalBranchNetProfit, '') }}</td>
                  <td>{{ formatCurrency(investmentTotals.totalYourProfitShare, '') }}</td>
                  <td>-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Financial Performance Visuals -->
    <div class="row">
      <div class="col-xl-8 col-lg-7">
        <div class="card shadow mb-4">
          <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
            <h6 class="m-0 font-weight-bold text-primary">{{ $t('investmentTracking.charts.yourProfitShareOverTime') }}</h6>

          </div>
          <div class="card-body">
            <div class="chart-area" style="height: 320px;">
              <div v-if="isChartLoading" class="text-center p-5">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              <div v-else-if="chartError" class="alert alert-danger">
                {{ chartError }}
              </div>
              <Line v-else :data="chartData.profitShare" :options="lineChartOptions" />
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-4 col-lg-5">
        <div class="card shadow mb-4">
          <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
            <h6 class="m-0 font-weight-bold text-primary">{{ $t('investmentTracking.charts.branchNetProfitTrend') }}</h6>
            <button @click="refreshCharts" class="btn btn-sm btn-outline-primary" :disabled="isChartLoading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': isChartLoading }"></i>
              {{ $t('investmentTracking.charts.refresh') }}
            </button>
          </div>
          <div class="card-body">
             <div class="chart-pie pt-4 pb-2" style="height: 320px;">
               <div v-if="isChartLoading" class="text-center p-5">
                 <div class="spinner-border" role="status">
                   <span class="visually-hidden">Loading...</span>
                 </div>
               </div>
               <div v-else-if="chartError" class="alert alert-danger">
                 {{ chartError }}
               </div>
               <Doughnut v-else :data="chartData.branchBreakdown" :options="doughnutChartOptions" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction History (Profit Share Payouts) -->
    <div class="card shadow mb-4">
      <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 class="m-0 font-weight-bold text-primary">{{ $t('investmentTracking.payoutHistory.title') }}</h6>
        <!-- <button class="btn btn-sm btn-outline-primary"><i class="fas fa-download fa-sm text-white-50"></i> {{ $t('investmentTracking.payoutHistory.export') }}</button> -->
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered" width="100%" cellspacing="0">
            <thead>
              <tr>
                <th>{{ $t('investmentTracking.payoutHistory.payoutDate') }}</th>
                <th>{{ $t('investmentTracking.payoutHistory.branch') }}</th>
                <th>{{ $t('investmentTracking.payoutHistory.amountPaid') }}</th>
                <th>{{ $t('investmentTracking.payoutHistory.transactionId') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="profitSharePayouts.length === 0">
                <td colspan="4" class="text-center">{{ $t('investmentTracking.payoutHistory.noPayouts') }}</td>
              </tr>
              <tr v-for="payout in profitSharePayouts" :key="payout.id">
                <td>{{ payout.payoutDate }}</td>
                <td>{{ payout.branchName }}</td>
                <td>{{ formatCurrency(payout.amountPaid, '') }}</td>
                <td>{{ payout.transactionId }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Document Access -->
    <!-- <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">{{ $t('investmentTracking.documents.title') }}</h6>
      </div>
      <div class="card-body">
        <ul class="list-group">
          <li v-for="doc in documents" :key="doc.id" class="list-group-item d-flex justify-content-between align-items-center">
            {{ doc.name }} ({{ doc.branchName === 'Toutes les agences' ? $t('investmentTracking.documents.allBranches') : doc.branchName }})
            <a :href="doc.url" class="btn btn-sm btn-primary" download><i class="fas fa-download"></i> {{ $t('investmentTracking.documents.download') }}</a>
          </li>
        </ul>
      </div>
    </div> -->
  </div>
    <div v-else class="text-center p-5">
      <p>{{ $t('investmentTracking.selectProfilePrompt') }}</p>
    </div>
</div>
</template>

<style scoped>
.card .card-header .form-select-sm {
    padding-top: .25rem;
    padding-bottom: .25rem;
    padding-left: .5rem;
    font-size: .875em;
}
.bg-success-soft {
  background-color: rgba(25, 135, 84, 0.15) !important;
  color: #198754 !important;
}
.bg-danger-soft {
  background-color: rgba(220, 53, 69, 0.15) !important;
  color: #dc3545 !important;
}
.bg-warning-soft {
  background-color: rgba(255, 193, 7, 0.15) !important;
  color: #ffc107 !important;
}
</style>