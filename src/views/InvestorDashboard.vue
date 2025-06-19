
<script setup>
import { ref, computed, watch } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler } from 'chart.js';
import { formatCurrency } from '@/helpers/utils.js';
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler);

const chartFilter = ref('monthly'); // monthly, bi-yearly, yearly
const tableFilter = ref('monthly'); // Default to yearly to show all initially

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
    status: 'Actif',
  },
  {
    id: 2,
    branchName: 'Cheraga (Annuel)',
    amount: 100000,
    sharePercentage: 8,
    NbrOfClients: 200,
    contractStartDate: '01/06/2022',
    contractEndDate: '31/05/2025',
    status: 'Actif',
  },
  {
    id: 3,
    branchName: 'Birkhadem (Annuel)',
    amount: 75000,
    sharePercentage: 12,
    NbrOfClients: 450,
    contractStartDate: '01/03/2024',
    contractEndDate: '28/02/2027',
    status: 'En attente',
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
    status: 'Actif',
  },
  {
    id: 2,
    branchName: 'Cheraga (Mensuel)',
    amount: 8300,
    sharePercentage: 8,
    NbrOfClients: 198,
    status: 'Actif',
  },
  // Birkhadem might not have monthly data if 'En attente'
]);

// Sample Bi-Yearly Data (e.g., for the current or a specific semester)
const biYearlyInvestments = ref([
  {
    id: 1,
    branchName: 'Staoueli (Semestriel)',
    amount: 75000, // Bi-yearly revenue portion
    sharePercentage: 10,
    NbrOfClients: 200,
    status: 'Actif',
  },
  {
    id: 2,
    branchName: 'Cheraga (Semestriel)',
    amount: 50000,
    sharePercentage: 8,
    NbrOfClients: 200,
    status: 'Actif',
  },
  {
    id: 3,
    branchName: 'Birkhadem (Semestriel)',
    amount: 37500, // Assuming it becomes active or has projected data for semester
    sharePercentage: 12,
    NbrOfClients: 450,
    status: 'En attente',
  },
]);

// The 'investments' ref is no longer directly used by the table, 
// but can be kept if it serves other purposes or as a reference to the full yearly data.
// For clarity, we can consider it equivalent to yearlyInvestments for now.
const investments = ref(yearlyInvestments.value);

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
    name: 'Contrat d\'investissement - Staoueli.pdf',
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


const monthlyData = {
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
  datasets: [
    {
      label: 'Revenus Mensuels',
      borderColor: '#0D6EFD', // FADAA Blue from Bootstrap
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      tension: 0.4,
      fill: true,
      data: [120, 150, 130, 160, 180, 170, 190, 210, 200, 220, 240, 230],
    },
  ],
};

const biYearlyData = {
  labels: ['S1-2023', 'S2-2023', 'S1-2024', 'S2-2024'],
  datasets: [
    {
      label: 'Revenus Semestriels',
      borderColor: '#0D6EFD',
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      tension: 0.4,
      fill: true,
      data: [800, 950, 1100, 1250],
    },
  ],
};

const yearlyData = {
  labels: ['2022', '2023', '2024', '2025 (Proj.)'],
  datasets: [
    {
      label: 'Revenus Annuels',
      borderColor: '#0D6EFD',
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      tension: 0.4,
      fill: true,
      data: [1500, 1750, 2350, 2800],
    },
  ],
};

const chartData = ref(monthlyData);

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    title: {
      display: true,
      text: 'Évolution des Revenus',
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
        text: 'Revenus (en k)'
      }
    },
    x: {
        grid: {
            display: false
        }
    }
  }
});

const setChartFilter = (filter) => {
  chartFilter.value = filter;
};

const setTableFilter = (filter) => {
  tableFilter.value = filter;
};

watch(chartFilter, (newFilter) => {
  switch (newFilter) {
    case 'monthly':
      chartData.value = monthlyData;
      chartOptions.value.plugins.title.text = 'Évolution des Revenus Mensuels';
      break;
    case 'bi-yearly':
      chartData.value = biYearlyData;
      chartOptions.value.plugins.title.text = 'Évolution des Revenus Semestriels';
      break;
    case 'yearly':
      chartData.value = yearlyData;
      chartOptions.value.plugins.title.text = 'Évolution des Revenus Annuels';
      break;
  }
});

</script>

<template>
  <div class="dashboard-container container-fluid">
    <h2 class="mb-4">Tableau de Bord Investisseur</h2>

    <!-- Section 1: Major KPIs -->
    <div class="row gy-4 mb-4">
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-graph-up me-2 text-fadaa-blue"></i>Retour sur Investissement</h5>
            <p class="card-text fs-4 fw-bold">15.2%</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-currency-euro me-2 text-fadaa-blue"></i>Revenu Total (Annuel)</h5>
            <p class="card-text fs-4 fw-bold"> {{ formatCurrency(1250000)}}</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 shadow-sm text-center">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-people-fill me-2 text-fadaa-blue"></i>Nombre de Clients Actifs</h5>
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
              <h5 class="mb-0"><i class="bi bi-briefcase-fill me-2"></i>Détails des Investissements</h5>
              <div class="btn-group btn-group-sm" role="group" aria-label="Table Filters">
                <button type="button" class="btn btn-outline-primary" @click="setTableFilter('monthly')" :class="{ active: tableFilter === 'monthly' }">Mensuel</button>
                <button type="button" class="btn btn-outline-primary" @click="setTableFilter('bi-yearly')" :class="{ active: tableFilter === 'bi-yearly' }">Semestriel</button>
                <button type="button" class="btn btn-outline-primary" @click="setTableFilter('yearly')" :class="{ active: tableFilter === 'yearly' }">Annuel</button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Agence</th>
                    <th>Revenue</th>
                    <th>Taux</th>
                    <th>Clients</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredInvestmentDetails.length === 0">
                    <td colspan="5" class="text-center">Aucune donnée disponible pour cette période.</td>
                  </tr>
                  <tr v-for="investment in filteredInvestmentDetails" :key="investment.id">
                    <td>{{ investment.branchName }}</td>
                    <td>{{ formatCurrency(investment.amount) }} </td>
                    <td>{{ investment.sharePercentage }}%</td>
                    <td>{{ investment.NbrOfClients }}</td>
                    <td><span :class="`badge bg-${investment.status === 'Actif' ? 'success' : 'warning'}`">{{ investment.status }}</span></td>
                  </tr>
                </tbody>
                <!-- <tfoot>
                  <tr>
                    <td colspan="5" class="text-center">
                      <button class="btn btn-sm btn-primary">Voir plus</button>
                    </td>
                  </tr>
                </tfoot> -->
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="bi bi-activity me-2"></i>Évolution des Revenus</h5>
              <div class="btn-group btn-group-sm" role="group" aria-label="Chart Filters">
                <button type="button" class="btn btn-outline-primary" @click="setChartFilter('monthly')" :class="{ active: chartFilter === 'monthly' }">Mensuel</button>
                <button type="button" class="btn btn-outline-primary" @click="setChartFilter('bi-yearly')" :class="{ active: chartFilter === 'bi-yearly' }">Semestriel</button>
                <button type="button" class="btn btn-outline-primary" @click="setChartFilter('yearly')" :class="{ active: chartFilter === 'yearly' }">Annuel</button>
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
            <h5 class="mb-0"><i class="bi bi-list-stars me-2"></i>Activités Récentes des Agences</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item"><i class="bi bi-building-add text-success me-2"></i>Nouvelle agence "Staoueli" ouverte avec succès. ROI initial: 12%.</li>
              <li class="list-group-item"><i class="bi bi-cash-stack text-primary me-2"></i>Investissement supplémentaire de 50k dans l'agence "Cheraga".</li>
              <li class="list-group-item"><i class="bi bi-graph-up-arrow text-info me-2"></i>Performance de l'agence "Birkhadem" en hausse de 5% ce trimestre.</li>
              <li class="list-group-item"><i class="bi bi-person-plus-fill text-fadaa-orange me-2"></i>Recrutement de 3 nouveaux gestionnaires pour l'expansion régionale.</li>
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
            <h5 class="mb-0"><i class="bi bi-pie-chart-fill me-2"></i>Historique des Parts de Bénéfices</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Agence</th>
                    <th>Montant Reçu</th>
                    <th>Période Concernée</th>
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
            <h5 class="mb-0"><i class="bi bi-file-earmark-text-fill me-2"></i>Documents</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="doc in documents" :key="doc.id" class="list-group-item d-flex justify-content-between align-items-center">
                <span><i :class="`bi ${doc.icon} me-2`"></i>{{ doc.name }}</span>
                <a :href="doc.url" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-download me-1"></i> Télécharger</a>
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
            <h5 class="card-title">Prêt à Étendre Votre Impact ?</h5>
            <p class="card-text">Explorez de nouvelles opportunités d'investissement ou demandez l'ouverture d'une nouvelle agence.</p>
            <button class="btn btn-success btn-lg me-2 mb-2"><i class="bi bi-folder-plus me-2"></i>Demander une Nouvelle Agence</button>
            <button class="btn btn-outline-success btn-lg mb-2"><i class="bi bi-currency-dollar me-2"></i>Investir Davantage</button>
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
