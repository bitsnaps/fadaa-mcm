<template>
  <div class="dashboard-container container-fluid">
    <h2 class="mb-4">Dashboard | {{ authStore.userRole }}</h2>

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
                <button class="btn btn-sm btn-fadaa-orange"><i class="bi bi-eye-fill me-1"></i>{{ t('common.view') }}</button>
              </li>
            </ul>
            <div v-if="!mockData.renewals.length" class="text-center text-muted mt-2">No pending renewals.</div>
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
            <div v-if="!mockData.expiringContracts.length" class="text-center text-muted mt-2">No contracts expiring soon.</div>
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
            <div v-if="!mockData.prospects.length" class="text-center text-muted mt-2">No prospects in the list.</div>
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
                    <th>Office ID</th>
                    <th>Status</th>
                    <th>Occupancy</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="office in offices" :key="office.id">
                    <td>{{ office.id }}</td>
                    <td><span :class="statusBadge(office.status)">{{ office.status }}</span></td>
                    <td>{{ office.occupancy }}</td>
                    <td>
                      <button class="btn btn-sm btn-fadaa-orange me-1"><i class="bi bi-pencil-square me-1"></i>Edit</button>
                      <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-info-circle-fill me-1"></i>Details</button>
                    </td>
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
      <div class="col-12 mt-4">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-download me-2"></i>Data Export</h5>
          </div>
          <div class="card-body text-center">
            <button @click="exportData('json')" class="btn btn-fadaa-orange me-2"><i class="bi bi-filetype-json me-1"></i>JSON</button>
            <button @click="exportData('csv')" class="btn btn-fadaa-orange me-2"><i class="bi bi-filetype-csv me-1"></i>CSV</button>
            <button @click="exportData('excel')" class="btn btn-outline-fadaa-orange me-2"><i class="bi bi-file-earmark-excel-fill me-1"></i>Excel (Simulated)</button>
            <button @click="exportData('pdf')" class="btn btn-outline-fadaa-orange"><i class="bi bi-file-earmark-pdf-fill me-1"></i>PDF (Simulated)</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/helpers/toast';
import { useI18n } from 'vue-i18n';
import { getTasks as apiGetTasks, updateTask as apiUpdateTask } from '@/services/TaskService';
import { getContracts } from '@/services/ContractService';
import { getClients } from '@/services/ClientService';
import { getOffices } from '@/services/OfficeService';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const { showSuccessToast, showErrorToast } = useToast();

const tasks = ref([]);
const tasksLoading = ref(false);
const pendingTasks = ref([]);

const fetchTasks = async () => {
  tasksLoading.value = true;
  try {
    const { data } = await apiGetTasks({ category: 'Compliance' });
    const list = Array.isArray(data) ? data : (data?.data || []);
    tasks.value = list;
    pendingTasks.value = list.filter(t => (t.status === 'Pending' || t.status === 'In Progress'));
  } catch (e) {
    showErrorToast(t('errors.fetchFailed'));
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
    showErrorToast(t('errors.updateFailed'));
  }
};

const renewals = ref([]);
const expiringContracts = ref([]);
const prospects = ref([]);
const offices = ref([]);

const loadAssistantDashboard = async () => {
  try {
    // Renewals: approximate via contracts ending within next 15 days
    const { data: contractsRes } = await getContracts();
    const contracts = contractsRes?.contracts || [];
    const now = new Date();
    const soon = new Date(); soon.setDate(now.getDate() + 15);
    renewals.value = contracts
      .filter(c => c.end_date && new Date(c.end_date) <= soon && new Date(c.end_date) >= now)
      .map(c => ({ id: c.id, client: c.Client?.company_name || '—', daysLeft: Math.ceil((new Date(c.end_date) - now) / (1000*60*60*24)) }));

    // Expiring contracts next 30 days
    const thirty = new Date(); thirty.setDate(now.getDate() + 30);
    expiringContracts.value = contracts
      .filter(c => c.end_date && new Date(c.end_date) <= thirty && new Date(c.end_date) >= now)
      .map(c => ({ id: c.id, client: c.Client?.company_name || '—', office: c.Office?.name || '—' }));

    // Prospects: use clients with status = 'Lead'
    const { data: clientsRes } = await getClients();
    const clients = clientsRes?.data || [];
    prospects.value = clients
      .filter(cl => cl.status === 'Lead')
      .map(cl => ({ id: cl.id, name: cl.company_name || `${cl.first_name} ${cl.last_name}`, status: 'Lead' }));

    // Offices list: basic overview
    const { data: officesRes } = await getOffices({ page: 1, limit: 10 });
    offices.value = officesRes?.data || [];
  } catch (e) {
    // non-blocking; toasts already handled elsewhere if needed
  }
};

onMounted(() => { fetchTasks(); loadAssistantDashboard(); });

const exportData = (format) => {
  // Simulate data generation for export
  const dataToExport = {
    renewals: mockData.value.renewals,
    expiringContracts: mockData.value.expiringContracts,
    prospects: mockData.value.prospects,
    officeStatus: mockData.value.officeStatus,
    approvals: mockData.value.approvals
  };

  let content = '';
  let filename = `assistant_dashboard_export.${format}`;
  let mimeType = '';

  if (format === 'json') { // Added JSON export for simplicity
    content = JSON.stringify(dataToExport, null, 2);
    mimeType = 'application/json';
    filename = `assistant_dashboard_export.json`;
  } else if (format === 'csv') {
    // Basic CSV conversion for officeStatus as an example
    let csvString = 'Office ID,Status,Occupancy\n';
    dataToExport.officeStatus.forEach(office => {
      csvString += `${office.id},${office.status},${office.occupancy}\n`;
    });
    content = csvString;
    mimeType = 'text/csv';
    filename = `assistant_dashboard_export.csv`;
  } else {
    // For Excel and PDF, we'll just show an alert as true generation is complex without libraries
    showSuccessToast(`Simulating export of dashboard data to ${format.toUpperCase()}.`);
    console.log(`Simulated export data for ${format.toUpperCase()}:`, dataToExport);
    return;
  }

  // Simulate file download
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  showSuccessToast(`Data exported as ${filename}.`);
  console.log(`Exported ${filename} with content:`, content);
};

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