<template>
  <div class="dashboard-container container-fluid">
    <h2 class="mb-4">{{ t('assistantDashboard.title') }}</h2>

    <ProfileTabs @update:activeProfile="handleProfileUpdate">
      <template #default="{ profileId }">
        <div v-if="profileId">
          <div class="row gy-4">
      <!-- Client Contract Renewals -->
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-file-earmark-text-fill me-2"></i>{{ t('assistantDashboard.renewals.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="renewal in renewals" :key="renewal.id" class="list-group-item d-flex justify-content-between align-items-center">
                {{ renewal.client }} - {{ renewal.daysLeft }} {{ t('common.daysLeft') }}
                <button class="btn btn-sm btn-fadaa-orange" @click="openViewContractModal(renewal.id)"><i class="bi bi-eye-fill me-1"></i>{{ t('common.view') }}</button>
              </li>
            </ul>
            <div v-if="renewals.length === 0" class="text-center text-muted mt-2">{{ t('assistantDashboard.renewals.empty') }}</div>
          </div>
        </div>
      </div>

      <!-- Expiring Contracts -->
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-hourglass-split me-2"></i>{{ t('assistantDashboard.expiringContracts.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="contract in expiringContracts" :key="contract.id" class="list-group-item">
                {{ contract.client }} ({{ contract.office }})
              </li>
            </ul>
            <div v-if="expiringContracts.length === 0" class="text-center text-muted mt-2">{{ t('assistantDashboard.expiringContracts.empty') }}</div>
          </div>
        </div>
      </div>

      <!-- Prospect List -->
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-person-lines-fill me-2"></i>{{ t('assistantDashboard.prospects.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="prospect in prospects" :key="prospect.id" class="list-group-item d-flex justify-content-between align-items-center">
                {{ prospect.name }} - {{ prospect.status }}
                <button class="btn btn-sm btn-outline-fadaa-orange"><i class="bi bi-telephone-fill me-1"></i>{{ t('assistantDashboard.prospects.contact') }}</button>
              </li>
            </ul>
            <div v-if="prospects.length === 0" class="text-center text-muted mt-2">{{ t('assistantDashboard.prospects.empty') }}</div>
          </div>
        </div>
      </div>

      <!-- Office Status Overview -->
      <div class="col-md-6 col-lg-8">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-building-check me-2"></i>{{ t('assistantDashboard.offices.title') }}</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm table-hover">
                <thead class="table-light">
                  <tr>
                    <th>{{ t('assistantDashboard.offices.table.name') }}</th>
                    <th>{{ t('assistantDashboard.offices.table.status') }}</th>
                    <th>{{ t('assistantDashboard.offices.table.capacity') }}</th>
                    <th>{{ t('assistantDashboard.offices.table.branch') }}</th>
                    <!-- <th>{{ t('assistantDashboard.offices.table.actions') }}</th> -->
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="office in offices" :key="office.id">
                    <td>{{ office.name || office.id }}</td>
                    <td><span :class="statusBadge(office.status)">{{ office.status || 'Active' }}</span></td>
                    <td>{{ office.capacity || '—' }}</td>
                    <td>{{ office.branch?.name || '—' }}</td>
                    <!-- <td>
                      <button class="btn btn-sm btn-fadaa-orange me-1"><i class="bi bi-pencil-square me-1"></i>{{ t('common.edit') }}</button>
                      <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-info-circle-fill me-1"></i>{{ t('common.details') }}</button>
                    </td> -->
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="offices.length === 0" class="text-center text-muted mt-2">{{ t('assistantDashboard.offices.empty') }}</div>
          </div>
        </div>
      </div>

      <!-- Tasks/Expense Approvals -->
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-check2-square me-2"></i>{{ t('assistantDashboard.tasksApprovals.title') }}</h5>
          </div>
          <div class="card-body">
            <div v-if="tasksLoading" class="text-muted small mb-2">{{ t('assistantDashboard.tasksApprovals.loading') }}</div>
            <ul class="list-group list-group-flush">
              <li v-for="task in pendingTasks" :key="task.id" class="list-group-item d-flex justify-content-between align-items-center">
                <div class="me-2">
                  <div class="fw-semibold">{{ task.title }}</div>
                  <div class="text-muted small">
                    {{ t('assistantDashboard.tasksApprovals.due') }}: {{ formatDate(task.due_date) }} ·
                    {{ t('assistantDashboard.tasksApprovals.priority') }}: {{ task.priority }} ·
                    {{ t('assistantDashboard.tasksApprovals.status') }}: {{ task.status }}
                  </div>
                </div>
                <div class="ms-2">
                  <button class="btn btn-sm btn-success me-1" @click="markTaskCompleted(task)"><i class="bi bi-check-lg me-1"></i>{{ t('assistantDashboard.tasksApprovals.complete') }}</button>
                  <button class="btn btn-sm btn-outline-secondary" @click="goToTasks"><i class="bi bi-box-arrow-up-right me-1"></i>{{ t('assistantDashboard.tasksApprovals.viewAll') }}</button>
                </div>
              </li>
            </ul>
            <div v-if="!tasksLoading && pendingTasks.length === 0" class="text-center text-muted mt-2">{{ t('assistantDashboard.tasksApprovals.noPending') }}</div>
          </div>
        </div>
      </div>

      <!-- Data Export Section -->
      <!-- <div class="col-12 mt-4">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-download me-2"></i>Data Export</h5>
          </div>
          <div class="card-body text-center">
            <button @click="exportData('csv')" class="btn btn-fadaa-orange me-2" :disabled="isExporting.csv">
              <span v-if="isExporting.csv" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              <i v-else class="bi bi-filetype-csv me-1"></i>
              CSV
            </button>
            <button @click="exportData('xlsx')" class="btn btn-outline-fadaa-orange me-2" :disabled="isExporting.excel">
              <span v-if="isExporting.excel" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              <i v-else class="bi bi-file-earmark-excel-fill me-1"></i>
              Excel
            </button>
            <button @click="exportData('pdf')" class="btn btn-outline-fadaa-orange" :disabled="isExporting.pdf">
              <span v-if="isExporting.pdf" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              <i v-else class="bi bi-file-earmark-pdf-fill me-1"></i>
              PDF
            </button>
          </div>
        </div>
      </div> -->
    </div>
        </div>
      </template>
    </ProfileTabs>
  </div>

  <!-- View Contract Modal -->
  <div class="modal fade" ref="viewContractModal" tabindex="-1" aria-labelledby="viewContractModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="viewContractModalLabel">{{ t('contracts.viewContractTitle', 'Contract Details') }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" v-if="selectedContract">
          <div v-if="contractLoading" class="text-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div v-else>
            <p><strong>{{ t('contracts.tableHeaders.client') }}:</strong> {{ selectedContract.Client?.company_name }}</p>
            <p><strong>{{ t('contracts.tableHeaders.office') }}:</strong> {{ selectedContract.Office?.name }}</p>
            <p><strong>{{ t('contracts.tableHeaders.startDate') }}:</strong> {{ formatDate(selectedContract.start_date) }}</p>
            <p><strong>{{ t('contracts.tableHeaders.endDate') }}:</strong> {{ formatDate(selectedContract.end_date) }}</p>
            <p><strong>{{ t('contracts.tableHeaders.monthlyRate') }}:</strong> {{ formatCurrency(selectedContract.monthly_rate) }}</p>
            <p><strong>{{ t('contracts.tableHeaders.status') }}:</strong> <span :class="statusBadge(selectedContract.status)">{{ selectedContract.status }}</span></p>
            <p><strong>{{ t('contracts.tableHeaders.paymentTerms') }}:</strong> {{ selectedContract.payment_terms }}</p>
            <p><strong>{{ t('addClient.form.serviceType') }}:</strong> {{ selectedContract.service_type }}</p>
            <div v-if="selectedContract.notes">
              <p><strong>{{ t('contracts.notes') }}:</strong></p>
              <p>{{ selectedContract.notes }}</p>
            </div>
            <div v-if="selectedContract.taxes && selectedContract.taxes.length > 0">
              <strong>{{ t('manageTaxes.title') }}:</strong>
              <ul>
                <li v-for="tax in selectedContract.taxes" :key="tax.id">{{ tax.name }} ({{ tax.rate }}%)</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('manageUsers.close') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from 'bootstrap';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/helpers/toast';
import { useI18n } from 'vue-i18n';
import { getTasks as apiGetTasks, updateTask as apiUpdateTask } from '@/services/TaskService';
import { getContracts, getContract } from '@/services/ContractService';
import { getClients } from '@/services/ClientService';
import { getOffices } from '@/services/OfficeService';
import ReportService from '@/services/ReportService';
import { useRouter } from 'vue-router';
import ProfileTabs from '@/components/ProfileTabs.vue';
import { formatCurrency } from '@/helpers/utils.js';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const { showSuccessToast, showErrorToast } = useToast();

const tasks = ref([]);
const tasksLoading = ref(false);
const pendingTasks = ref([]);
const isExporting = ref({
  json: false,
  csv: false,
  excel: false,
  pdf: false,
});

const fetchTasks = async () => {
  tasksLoading.value = true;
  try {
    const { data } = await apiGetTasks({ category: 'Compliance', status: 'Pending,In Progress' });
    const list = Array.isArray(data) ? data : (data?.data || []);
    pendingTasks.value = list;
  } catch (e) {
    // Error toast is handled globally by ApiClient interceptor
  } finally {
    tasksLoading.value = false;
  }
};

onMounted(fetchTasks);

const goToTasks = () => router.push({ name: 'Tasks' });

const formatDate = (dateString) => {
  if (!dateString) return t('common.na') || 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const markTaskCompleted = async (task) => {
  try {
    await apiUpdateTask(task.id, { status: 'Completed', completed_at: new Date().toISOString() });
    showSuccessToast(t('assistantDashboard.tasksApprovals.completedMsg'));
    await fetchTasks();
  } catch (e) {
    // Error toast is handled globally by ApiClient interceptor
  }
};

const renewals = ref([]);
const expiringContracts = ref([]);
const prospects = ref([]);
const offices = ref([]);
const activeProfileId = ref(null);

const viewContractModal = ref(null);
const selectedContract = ref(null);
const contractLoading = ref(false);

const openViewContractModal = async (contractId) => {
  if (!contractId) return;

  const modalInstance = Modal.getOrCreateInstance(viewContractModal.value);
  modalInstance.show();

  contractLoading.value = true;
  selectedContract.value = null; // Clear previous data

  try {
    const response = await getContract(contractId, { profile_id: activeProfileId.value });
    if (response.data.success) {
      selectedContract.value = response.data.contract;
    } else {
      showErrorToast(t('contracts.fetchError'));
      modalInstance.hide();
    }
  } catch (error) {
    console.error(`Failed to fetch contract ${contractId}:`, error);
    showErrorToast(t('contracts.fetchError'));
    modalInstance.hide();
  } finally {
    contractLoading.value = false;
  }
};

const loadAssistantDashboard = async (profileId = null) => {
  if (!profileId) return;

  try {
    const now = new Date();
    // Renewals: contracts ending within the next 15 days
    const { data: renewalsRes } = await getContracts({ profile_id: profileId, expiring_within_days: 15 });
    renewals.value = (renewalsRes?.contracts || []).map(c => ({
      id: c.id,
      client: c.Client?.company_name || '—',
      daysLeft: Math.ceil((new Date(c.end_date) - now) / (1000 * 60 * 60 * 24))
    }));

    // Expiring contracts: contracts ending within the next 30 days
    const { data: expiringRes } = await getContracts({ profile_id: profileId, expiring_within_days: 30 });
    expiringContracts.value = (expiringRes?.contracts || []).map(c => ({
      id: c.id,
      client: c.Client?.company_name || '—',
      office: c.Office?.name || '—'
    }));

    // Prospects: use clients with status = 'Lead'
    const { data: clientsRes } = await getClients({ profile_id: profileId });
    const clients = clientsRes?.data || [];
    prospects.value = clients
      .filter(cl => cl.status === 'Lead')
      .map(cl => ({ id: cl.id, name: cl.company_name || `${cl.first_name} ${cl.last_name}`, status: 'Lead' }));

    // Offices list: basic overview
    const { data: officesRes } = await getOffices({ page: 1, limit: 10, profile_id: profileId });
    offices.value = officesRes?.data || [];
  } catch (e) {
    // non-blocking; toasts already handled elsewhere if needed
  }
};

const handleProfileUpdate = (profileId) => {
  activeProfileId.value = profileId;
  loadAssistantDashboard(profileId);
  fetchTasks(); // Tasks don't need profile filtering
};

onMounted(() => {
  // ProfileTabs will trigger handleProfileUpdate when ready
  // fetchTasks will be called from handleProfileUpdate
});

/*
const exportData = async (format) => {
  if (!activeProfileId.value) {
    showErrorToast(t('dashboard.selectProfileFirst'));
    return;
  }

  isExporting.value[format] = true;
  try {
    const exportConfig = {
      format,
      profile_id: activeProfileId.value,
      type: 'assistant', // Differentiates from admin/financial reports
      data: {
        renewals: renewals.value,
        expiringContracts: expiringContracts.value,
        prospects: prospects.value,
        offices: offices.value,
        tasks: pendingTasks.value,
      },
    };

    const response = await ReportService.generateReport(exportConfig);

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Extract filename from content-disposition header if available, otherwise create one
    const disposition = response.headers['content-disposition'];
    let filename = `assistant-dashboard-${activeProfileId.value}-${new Date().toISOString().split('T')[0]}.${format}`;
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    showSuccessToast(t('dashboard.dataExport.success', { format }));

  } catch (error) {
    console.error(`Failed to export data to ${format}:`, error);
    // Global interceptor will show a toast for API errors.
  } finally {
    isExporting.value[format] = false;
  }
};*/

const statusBadge = (status) => {
  switch (status) {
    case 'Occupé': return 'badge bg-danger';
    case 'Nouveau': return 'badge bg-success';
    case 'Actif': return 'badge bg-primary';
    case 'En instance': return 'badge bg-warning text-dark';
    case 'Inactif': return 'badge bg-secondary'; // Added for consistency
    default: return 'badge bg-light text-dark';
  }
};

</script>

<style scoped>
/* Component-specific styles can go here if needed */
</style>