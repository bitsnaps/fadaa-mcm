<template>
  <div class="container-fluid p-4">
    <h1 class="h3 mb-4 text-gray-800">{{ $t('investmentTracking.title') }}</h1>

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
        <div class="table-responsive">
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
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatCurrency } from "@/helpers/utils.js";

const { t } = useI18n();

const investmentSummary = ref({
  totalInvested: 375000,
  totalProfitShare: 45200,
  overallROI: 12.05, // Calculated: (totalProfitShare / totalInvested) * 100
  activeInvestmentsCount: 3,
  nextPayoutDate: '2024-08-15',
});

const branchInvestments = ref([
  {
    id: 'branch001',
    branchName: 'Agence Alger Centre',
    investmentAmount: 150000,
    participationPercentage: 10,
    contractStartDate: '2023-01-15',
    contractEndDate: '2025-01-14',
    daysRemaining: calculateDaysRemaining('2025-01-14'),
    branchNetProfitSelectedPeriod: 25000, // Example for last month
    yourProfitShareSelectedPeriod: 2500, // (25000 * 10%)
    status: 'Active',
  },
  {
    id: 'branch002',
    branchName: 'Agence Oran Es Senia',
    investmentAmount: 100000,
    participationPercentage: 8,
    contractStartDate: '2023-06-01',
    contractEndDate: '2024-09-30',
    daysRemaining: calculateDaysRemaining('2024-09-30'),
    branchNetProfitSelectedPeriod: 12000,
    yourProfitShareSelectedPeriod: 960,
    status: 'Expiring Soon',
  },
  {
    id: 'branch003',
    branchName: 'Agence Constantine Ville',
    investmentAmount: 125000,
    participationPercentage: 12,
    contractStartDate: '2022-11-01',
    contractEndDate: '2023-10-31',
    daysRemaining: 0, // Or calculateDaysRemaining which would be negative
    branchNetProfitSelectedPeriod: 0, // Assuming expired means no current profit for this period
    yourProfitShareSelectedPeriod: 0,
    status: 'Expired',
  },
]);

const profitSharePayouts = ref([
  {
    id: 'payout001',
    payoutDate: '2024-07-01',
    branchName: 'Agence Alger Centre',
    amountPaid: 2300,
    transactionId: 'TRX20240701ABC',
  },
  {
    id: 'payout002',
    payoutDate: '2024-07-01',
    branchName: 'Agence Oran Es Senia',
    amountPaid: 850,
    transactionId: 'TRX20240701DEF',
  },
  {
    id: 'payout003',
    payoutDate: '2024-06-01',
    branchName: 'Agence Alger Centre',
    amountPaid: 2450,
    transactionId: 'TRX20240601GHI',
  },
]);

const documents = ref([
  {
    id: 'doc001',
    name: 'Investment Contract',
    branchName: 'Agence Alger Centre',
    url: '/path/to/contrat_alger.pdf',
  },
  {
    id: 'doc002',
    name: 'Investment Contract',
    branchName: 'Agence Oran Es Senia',
    url: '/path/to/contrat_oran.pdf',
  },
  {
    id: 'doc003',
    name: 'Q2 2024 Performance Report',
    branchName: 'Toutes les agences',
    url: '/path/to/rapport_q2_2024.pdf',
  },
]);

function calculateDaysRemaining(endDateString) {
  const today = new Date();
  const endDate = new Date(endDateString);
  const differenceInTime = endDate.getTime() - today.getTime();
  if (differenceInTime < 0) return 0;
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
  return differenceInDays;
}

const getStatusClass = (status) => {
  if (status === 'Active') return 'bg-success text-white';
  if (status === 'Expiring Soon') return 'bg-warning text-dark';
  if (status === 'Expired') return 'bg-danger text-white';
  return 'bg-secondary text-white';
};

const getStatusTranslation = (status) => {
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