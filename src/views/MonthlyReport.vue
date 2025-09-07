<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ReportService from '@/services/ReportService';
import ProfileTabs from '@/components/ProfileTabs.vue';
import ApiClient from '@/services/ApiClient';
import { saveAs } from 'file-saver';

const { t } = useI18n();

const clients = ref([]);
const branches = ref([]);
const activeProfileId = ref(null);

const reportData = ref([]);

const filters = ref({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  clientId: null,
  branchId: null,
  profile_id: null,
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

async function generateReport() {
  if (!filters.value.profile_id) return;
  try {
    const response = await ReportService.getMonthlyReport(filters.value);
    if (response.data.success) {
      reportData.value = response.data.data.map(item => ({
        metric: t(`monthlyReport.table.${item.metric}`),
        value: item.value
      }));
    }
  } catch (error) {
    console.error('Error fetching monthly report:', error);
  }
}

async function downloadReport(format) {
  try {
    const config = { ...filters.value, format };
    const response = await ReportService.downloadMonthlyReport(config);
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    saveAs(blob, `monthly-report-${filters.value.year}-${filters.value.month}.${format}`);
  } catch (error) {
    console.error('Error downloading monthly report:', error);
  }
}

onMounted(() => {
  fetchClients();
  fetchBranches();
});

watch(activeProfileId, (newProfileId) => {
  if (newProfileId) {
    filters.value.profile_id = newProfileId;
    generateReport();
  }
});

function handleProfileChange(profileId) {
  activeProfileId.value = profileId;
}

async function fetchClients() {
  try {
    const response = await ApiClient.get('/clients');
    if (response.data.success) {
      clients.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching clients:', error);
  }
}

async function fetchBranches() {
  try {
    const response = await ApiClient.get('/branches');
    if (response.data.success) {
      branches.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching branches:', error);
  }
}
</script>

<template>
  <div class="monthly-report-container container-fluid">
    <h2 class="mb-4">{{ $t('monthlyReport.title') }}</h2>

    <ProfileTabs @update:activeProfile="handleProfileChange">
      <template #default="{ profileId }">
        <div v-if="profileId">
          
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
                    <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.company_name }}</option>
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
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in reportData" :key="item.metric">
                      <td>{{ item.metric }}</td>
                      <td>{{ item.value }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </template>
    </ProfileTabs>
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
