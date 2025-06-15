<template>
  <div class="container-fluid p-4">
    <h1 class="h3 mb-4 text-gray-800">Suivi des Investissements</h1>

    <!-- Investment Summary -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Résumé des Investissements</h6>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-primary shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Montant Total Investi</div>
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
                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Part de Bénéfice Reçue (Total)</div>
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
                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">ROI Global (Mixte)</div>
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
                    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Investissements Actifs</div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">{{ investmentSummary.activeInvestmentsCount }} Agences</div>
                     <small class="text-muted">Prochain Paiement: {{ investmentSummary.nextPayoutDate }}</small>
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
        <h6 class="m-0 font-weight-bold text-primary">Détail des Investissements par Agence</h6>
        <div class="dropdown no-arrow">
          <label for="branchFilter" class="sr-only">Filtrer par agence</label>
          <select id="branchFilter" class="form-select form-select-sm">
            <option selected>Toutes les agences</option>
            <option v-for="branch in branchInvestments" :key="branch.id" :value="branch.id">{{ branch.branchName }}</option>
          </select>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered" width="100%" cellspacing="0">
            <thead>
              <tr>
                <th>Nom de l'Agence</th>
                <th>Votre Investissement</th>
                <th>Votre Participation (%)</th>
                <th>Début Contrat</th>
                <th>Fin Contrat</th>
                <th>Bénéfice Net Agence (Période)</th>
                <th>Votre Part de Bénéfice (Période)</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="branch in branchInvestments" :key="branch.id">
                <td>{{ branch.branchName }}</td>
                <td>{{ formatCurrency(branch.investmentAmount) }}</td>
                <td>{{ branch.participationPercentage }}%</td>
                <td>{{ branch.contractStartDate }}</td>
                <td>{{ branch.contractEndDate }} ({{ branch.daysRemaining }} jours restants)</td>
                <td>{{ formatCurrency(branch.branchNetProfitSelectedPeriod) }}</td>
                <td>{{ formatCurrency(branch.yourProfitShareSelectedPeriod) }}</td>
                <td><span :class="['badge', getStatusClass(branch.status)]">{{ branch.status }}</span></td>
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
            <h6 class="m-0 font-weight-bold text-primary">Votre Part de Bénéfice au Fil du Temps</h6>
            <!-- Add chart controls here if needed -->
          </div>
          <div class="card-body">
            <div class="chart-area" style="height: 320px;">
              <p class="text-center p-5">Graphique de la part de bénéfice à venir.</p>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-4 col-lg-5">
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">Tendance Bénéfice Net Agence</h6>
          </div>
          <div class="card-body">
             <div class="chart-pie pt-4 pb-2" style="height: 320px;">
                <p class="text-center p-5">Graphique de tendance du bénéfice net à venir.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction History (Profit Share Payouts) -->
    <div class="card shadow mb-4">
      <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 class="m-0 font-weight-bold text-primary">Historique des Paiements (Part de Bénéfice)</h6>
        <button class="btn btn-sm btn-outline-primary"><i class="fas fa-download fa-sm text-white-50"></i> Exporter</button>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered" width="100%" cellspacing="0">
            <thead>
              <tr>
                <th>Date de Paiement</th>
                <th>Agence</th>
                <th>Montant Payé</th>
                <th>ID Transaction</th>
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
        <h6 class="m-0 font-weight-bold text-primary">Accès aux Documents</h6>
      </div>
      <div class="card-body">
        <ul class="list-group">
          <li v-for="doc in documents" :key="doc.id" class="list-group-item d-flex justify-content-between align-items-center">
            {{ doc.name }} ({{ doc.branchName }})
            <a :href="doc.url" class="btn btn-sm btn-primary" download><i class="fas fa-download"></i> Télécharger</a>
          </li>
        </ul>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatCurrency } from "@/helpers/utils.js";

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
    name: 'Contrat d\'investissement',
    branchName: 'Agence Alger Centre',
    url: '/path/to/contrat_alger.pdf',
  },
  {
    id: 'doc002',
    name: 'Contrat d\'investissement',
    branchName: 'Agence Oran Es Senia',
    url: '/path/to/contrat_oran.pdf',
  },
  {
    id: 'doc003',
    name: 'Rapport Performance Q2 2024',
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