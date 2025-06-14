<template>
  <div class="container-fluid p-4">
    <h1 class="h3 mb-4 text-gray-800">Suivi des Investissements</h1>

    <!-- Investment Portfolio Overview -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Aperçu du Portefeuille d'Investissement</h6>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-xl-3 col-md-6 mb-4" v-for="portfolio in portfolios" :key="portfolio.id">
            <div :class="['card', portfolio.borderColor, 'shadow', 'h-100', 'py-2']">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div :class="['text-xs', 'font-weight-bold', portfolio.textColor, 'text-uppercase', 'mb-1']">
                      {{ portfolio.name }}
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">{{ formatCurrency(portfolio.currentValue) }}</div>
                    <small class="text-muted">Gain/Perte: <span :class="portfolio.performance >= 0 ? 'text-success' : 'text-danger'">{{ formatCurrency(portfolio.performance) }} ({{ portfolio.performancePercentage }}%)</span></small>
                  </div>
                  <div class="col-auto">
                    <i :class="[portfolio.icon, 'fa-2x', 'text-gray-300']"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Transactions Récentes</h6>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered" id="dataTableTransactions" width="100%" cellspacing="0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Actif</th>
                <th>Quantité</th>
                <th>Prix</th>
                <th>Total</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in recentTransactions" :key="transaction.id">
                <td>{{ transaction.date }}</td>
                <td><span :class="['badge', transaction.type === 'Achat' ? 'bg-success-soft' : 'bg-danger-soft', 'text-' + (transaction.type === 'Achat' ? 'success' : 'danger')]">{{ transaction.type }}</span></td>
                <td>{{ transaction.asset }}</td>
                <td>{{ transaction.quantity }}</td>
                <td>{{ formatCurrency(transaction.price) }}</td>
                <td>{{ formatCurrency(transaction.total) }}</td>
                <td><span :class="['badge', 'bg-' + transaction.statusColor]">{{ transaction.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Performance Charts (Placeholder) -->
    <div class="row">
      <div class="col-xl-8 col-lg-7">
        <div class="card shadow mb-4">
          <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
            <h6 class="m-0 font-weight-bold text-primary">Performance du Portefeuille (Graphique)</h6>
            <!-- Add chart controls here if needed -->
          </div>
          <div class="card-body">
            <div class="chart-area" style="height: 320px;">
              <!-- Placeholder for Chart.js or other charting library -->
              <p class="text-center p-5">Graphique de performance à venir.</p>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-4 col-lg-5">
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">Allocation d'Actifs</h6>
          </div>
          <div class="card-body">
             <div class="chart-pie pt-4 pb-2" style="height: 320px;">
                <!-- Placeholder for Pie Chart -->
                <p class="text-center p-5">Graphique d'allocation à venir.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

const portfolios = ref([
  {
    id: 1,
    name: 'Portefeuille Actions Tech',
    currentValue: 75000,
    performance: 5200,
    performancePercentage: 7.4,
    icon: 'fas fa-chart-line',
    borderColor: 'border-left-primary',
    textColor: 'text-primary',
  },
  {
    id: 2,
    name: 'Portefeuille Obligations d\'État',
    currentValue: 120000,
    performance: -1500,
    performancePercentage: -1.2,
    icon: 'fas fa-landmark',
    borderColor: 'border-left-success',
    textColor: 'text-success',
  },
  {
    id: 3,
    name: 'Fonds Immobilier Diversifié',
    currentValue: 250000,
    performance: 12500,
    performancePercentage: 5.3,
    icon: 'fas fa-home',
    borderColor: 'border-left-info',
    textColor: 'text-info',
  },
  {
    id: 4,
    name: 'Portefeuille Crypto-Monnaies',
    currentValue: 30000,
    performance: 7500,
    performancePercentage: 33.3,
    icon: 'fab fa-bitcoin',
    borderColor: 'border-left-warning',
    textColor: 'text-warning',
  },
]);

const recentTransactions = ref([
  {
    id: 't001',
    date: '2024-07-20',
    type: 'Achat',
    asset: 'Action AAPL',
    quantity: 10,
    price: 150.25,
    total: 1502.50,
    status: 'Complété',
    statusColor: 'success-soft'
  },
  {
    id: 't002',
    date: '2024-07-18',
    type: 'Vente',
    asset: 'Obligation XYZ',
    quantity: 5,
    price: 998.50,
    total: 4992.50,
    status: 'En attente',
    statusColor: 'warning-soft'
  },
  {
    id: 't003',
    date: '2024-07-15',
    type: 'Achat',
    asset: 'Part SCPI Alpha',
    quantity: 20,
    price: 250.00,
    total: 5000.00,
    status: 'Complété',
    statusColor: 'success-soft'
  },
  {
    id: 't004',
    date: '2024-07-12',
    type: 'Achat',
    asset: 'Bitcoin (BTC)',
    quantity: 0.05,
    price: 30000.00,
    total: 1500.00,
    status: 'Échoué',
    statusColor: 'danger-soft'
  },
]);

// Placeholder for chart data and logic
// In a real application, you would fetch this data and use a charting library like Chart.js

</script>

<style scoped>
/* Custom styles for soft badges */
.bg-success-soft {
  background-color: rgba(25, 135, 84, 0.1);
  /* color: #198754; */ /* Ensure text color is readable */
}
.bg-danger-soft {
  background-color: rgba(220, 53, 69, 0.1);
  /* color: #dc3545; */
}
.bg-warning-soft {
  background-color: rgba(255, 193, 7, 0.1);
  /* color: #ffc107; */
}
.text-success {
    color: #198754 !important;
}
.text-danger {
    color: #dc3545 !important;
}
.text-warning {
    color: #ffc107 !important;
}

.card .card-header .text-primary {
    color: #4e73df !important;
}

.border-left-primary {
    border-left: .25rem solid #4e73df!important;
}
.border-left-success {
    border-left: .25rem solid #1cc88a!important;
}
.border-left-info {
    border-left: .25rem solid #36b9cc!important;
}
.border-left-warning {
    border-left: .25rem solid #f6c23e!important;
}

.text-gray-300 {
    color: #dddfeb!important;
}
.text-gray-800 {
    color: #5a5c69!important;
}
.shadow {
    box-shadow: 0 .15rem 1.75rem 0 rgba(58,59,69,.15)!important;
}
.mb-4, .my-4 {
    margin-bottom: 1.5rem!important;
}
.card-body {
    flex: 1 1 auto;
    padding: 1.25rem;
}
.py-2 {
    padding-top: .5rem!important;
    padding-bottom: .5rem!important;
}
.h-100 {
    height: 100%!important;
}
.no-gutters {
    margin-right: 0;
    margin-left: 0;
}
.align-items-center {
    align-items: center!important;
}
.mr-2, .mx-2 {
    margin-right: .5rem!important;
}
.text-xs {
    font-size: .7rem;
}
.font-weight-bold {
    font-weight: 700!important;
}
.text-uppercase {
    text-transform: uppercase!important;
}
.mb-1, .my-1 {
    margin-bottom: .25rem!important;
}
.h5, h5 {
    font-size: 1.25rem;
}
.fa-2x {
    font-size: 2em;
}

</style>