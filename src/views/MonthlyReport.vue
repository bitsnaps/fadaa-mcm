<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Mock Data
const clients = ref([
  { id: 1, name: 'Innovate Corp' },
  { id: 2, name: 'Quantum Solutions' },
  { id: 3, name: 'Synergy Inc' },
]);

const branches = ref([
  { id: 1, name: 'Main Branch' },
  { id: 2, name: 'West Wing' },
  { id: 3, name: 'East Wing' },
]);

const reportData = ref([]);

const filters = ref({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  clientId: null,
  branchId: null,
});

const years = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
});

const months = computed(() => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString(t('locale'), { month: 'long' }),
  }));
});

function generateReport() {
  // Mock data generation
  reportData.value = [
    { metric: t('monthlyReport.table.revenue'), value: '€50,000', change: '+5%' },
    { metric: t('monthlyReport.table.newClients'), value: '5', change: '+2' },
    { metric: t('monthlyReport.table.contractsSigned'), value: '12', change: '+3' },
    { metric: t('monthlyReport.table.occupancyRate'), value: '85%', change: '-2%' },
  ];
}

function downloadReport(format) {
  alert(`Downloading report as ${format}`);
}

// Initial report generation
generateReport();
</script>

<template>
  <div class="monthly-report-container container-fluid">
    <h2 class="mb-4">{{ $t('monthlyReport.title') }}</h2>

    <div class="card shadow-sm mb-4">
      <div class="card-header bg-fadaa-primary">
        <h5 class="mb-0 text-white"><i class="bi bi-filter me-2"></i>{{ $t('monthlyReport.filters.title') }}</h5>
      </div>
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label for="month" class="form-label">{{ $t('monthlyReport.filters.month') }}</label>
            <select id="month" class="form-select" v-model="filters.month">
              <option v-for="month in months" :key="month.value" :value="month.value">{{ month.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label for="year" class="form-label">{{ $t('monthlyReport.filters.year') }}</label>
            <select id="year" class="form-select" v-model="filters.year">
              <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label for="client" class="form-label">{{ $t('monthlyReport.filters.client') }}</label>
            <select id="client" class="form-select" v-model="filters.clientId">
              <option :value="null">{{ $t('monthlyReport.filters.allClients') }}</option>
              <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label for="branch" class="form-label">{{ $t('monthlyReport.filters.branch') }}</label>
            <select id="branch" class="form-select" v-model="filters.branchId">
              <option :value="null">{{ $t('monthlyReport.filters.allBranches') }}</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <button @click="generateReport" class="btn btn-fadaa-primary w-100"><i class="bi bi-search me-2"></i>{{ $t('monthlyReport.filters.generate') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm">
      <div class="card-header bg-fadaa-light-blue d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><i class="bi bi-bar-chart-line-fill me-2"></i>{{ $t('monthlyReport.report.title') }}</h5>
        <div class="btn-group">
          <button @click="downloadReport('csv')" class="btn btn-success btn-sm"><i class="bi bi-file-earmark-spreadsheet me-2"></i>{{ $t('monthlyReport.report.downloadCsv') }}</button>
          <button @click="downloadReport('xlsx')" class="btn btn-info btn-sm"><i class="bi bi-file-earmark-excel me-2"></i>{{ $t('monthlyReport.report.downloadXlsx') }}</button>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>{{ $t('monthlyReport.table.metric') }}</th>
                <th>{{ $t('monthlyReport.table.value') }}</th>
                <th>{{ $t('monthlyReport.table.change') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in reportData" :key="item.metric">
                <td>{{ item.metric }}</td>
                <td>{{ item.value }}</td>
                <td>
                  <span :class="['badge', item.change.startsWith('+') ? 'bg-success-soft' : 'bg-danger-soft', item.change.startsWith('+') ? 'text-success' : 'text-danger']">
                    <i :class="['bi', item.change.startsWith('+') ? 'bi-arrow-up' : 'bi-arrow-down']"></i>
                    {{ item.change }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-fadaa-primary {
  background-color: #0d6efd !important;
}
.btn-fadaa-primary {
    background-color: #0d6efd;
    border-color: #0d6efd;
    color: white;
}
.bg-fadaa-light-blue {
    background-color: #e7f1ff;
}
.bg-success-soft {
    background-color: rgba(25, 135, 84, 0.1);
}
.bg-danger-soft {
    background-color: rgba(220, 53, 69, 0.1);
}
.text-success {
    color: #198754 !important;
}
.text-danger {
    color: #dc3545 !important;
}
.table-hover tbody tr:hover {
  background-color: #f8f9fa;
}
</style>
