<template>
  <div class="container-fluid p-4">
    <h1 class="h3 mb-4 text-gray-800">{{ $t('investmentTracking.title') }}</h1>

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
                      <div class="h5 mb-0 font-weight-bold text-gray-800">{{ formatCurrency(investmentSummary.totalInvested) }}</div>
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
                      <div class="h5 mb-0 font-weight-bold text-gray-800">{{ formatCurrency(investmentSummary.totalProfitShare) }}</div>
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
            <select id="branchFilter" class="form-select form-select-sm">
              <option selected>{{ $t('investmentTracking.breakdown.allBranches') }}</option>
              <option v-for="branch in branchInvestments" :key="branch.id" :value="branch.id">{{ branch.branchName }}</option>
            </select>
          </div>
        </div>
        <div class="card-body">
          <div v-if="branchInvestments.length === 0" class="text-center">
            <p>{{ $t('investmentTracking.breakdown.noInvestments') }}</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table table-bordered" width="100%" cellspacing="0">
              <thead>
                <tr>
                  <th>{{ $t('investmentTracking.breakdown.branchName') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.yourInvestment') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.yourStake') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.contractStart') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.contractEnd') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.branchNetProfit') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.yourProfitShare') }}</th>
                  <th>{{ $t('investmentTracking.breakdown.status') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="branch in branchInvestments" :key="branch.id">
                  <td>{{ branch.branchName }}</td>
                  <td>{{ formatCurrency(branch.investmentAmount) }}</td>
                  <td>{{ branch.participationPercentage }}%</td>
                  <td>{{ branch.contractStartDate }}</td>
                  <td>{{ branch.contractEndDate }} ({{ branch.daysRemaining }} {{ $t('investmentTracking.breakdown.daysRemaining') }})</td>
                  <td>{{ formatCurrency(branch.branchNetProfitSelectedPeriod) }}</td>
                  <td>{{ formatCurrency(branch.yourProfitShareSelectedPeriod) }}</td>
                  <td><span :class="['badge', getStatusClass(branch.status)]">{{ getStatusTranslation(branch.status) }}</span></td>
                </tr>
              </tbody>
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
            <!-- Add chart controls here if needed -->
          </div>
          <div class="card-body">
            <div class="chart-area" style="height: 320px;">
              <p class="text-center p-5">{{ $t('investmentTracking.charts.profitShareChartPlaceholder') }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-4 col-lg-5">
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">{{ $t('investmentTracking.charts.branchNetProfitTrend') }}</h6>
          </div>
          <div class="card-body">
             <div class="chart-pie pt-4 pb-2" style="height: 320px;">
                <p class="text-center p-5">{{ $t('investmentTracking.charts.netProfitTrendChartPlaceholder') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction History (Profit Share Payouts) -->
    <div class="card shadow mb-4">
      <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 class="m-0 font-weight-bold text-primary">{{ $t('investmentTracking.payoutHistory.title') }}</h6>
        <button class="btn btn-sm btn-outline-primary"><i class="fas fa-download fa-sm text-white-50"></i> {{ $t('investmentTracking.payoutHistory.export') }}</button>
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
              <tr v-for="payout in profitSharePayouts" :key="payout.id">
                <td>{{ payout.payoutDate }}</td>
                <td>{{ payout.branchName }}</td>
                <td>{{ formatCurrency(payout.amountPaid) }}</td>
                <td>{{ payout.transactionId }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Document Access -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">{{ $t('investmentTracking.documents.title') }}</h6>
      </div>
      <div class="card-body">
        <ul class="list-group">
          <li v-for="doc in documents" :key="doc.id" class="list-group-item d-flex justify-content-between align-items-center">
            {{ getDocumentNameTranslation(doc.name) }} ({{ doc.branchName === 'Toutes les agences' ? $t('investmentTracking.documents.allBranches') : doc.branchName }})
            <a :href="doc.url" class="btn btn-sm btn-primary" download><i class="fas fa-download"></i> {{ $t('investmentTracking.documents.download') }}</a>
          </li>
        </ul>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatCurrency, formatDate } from "@/helpers/utils.js";
import ApiClient from '@/services/ApiClient.js';

const { t } = useI18n();

const investments = ref([]);
const isLoading = ref(true);
const error = ref(null);

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

  // Placeholder for profit share and ROI calculation
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
      contractStartDate: formatDate(inv.starting_date),
      contractEndDate: formatDate(inv.ending_date),
      daysRemaining: calculateDaysRemaining(inv.ending_date),
      branchNetProfitSelectedPeriod: inv.branchNetProfitSelectedPeriod,
      yourProfitShareSelectedPeriod: inv.yourProfitShareSelectedPeriod,
      status: status,
    };
  });
});


const profitSharePayouts = ref([]); // Placeholder - Requires a dedicated endpoint

const documents = ref([]); // Placeholder - Requires a dedicated endpoint

const fetchInvestments = async () => {
  try {
    isLoading.value = true;
    const { data: response } = await ApiClient.get('/investments');
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

onMounted(fetchInvestments);


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

const getDocumentNameTranslation = (docName) => {
  if (docName === 'Investment Contract') {
    return t('investmentTracking.documents.investmentContract');
  }
  if (docName === 'Q2 2024 Performance Report') {
    return t('investmentTracking.documents.performanceReportQ2');
  }
  return docName;
}

// Placeholder for chart data and logic (e.g., using Chart.js)
// onMounted(() => { /* Initialize charts here */ });

</script>

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