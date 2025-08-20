<template>
  <div class="dashboard-container container-fluid">
    <h2 class="mb-4">{{ t('assistantDashboard.title') }} | {{ authStore.userRole }}</h2>

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
                <button class="btn btn-sm btn-fadaa-orange"><i class="bi bi-eye-fill me-1"></i>{{ t('common.view') }}</button>
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
                    <th>{{ t('assistantDashboard.offices.table.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="office in offices" :key="office.id">
                    <td>{{ office.name || office.id }}</td>
                    <td><span :class="statusBadge(office.status)">{{ office.status || 'Active' }}</span></td>
                    <td>{{ office.capacity || '—' }}</td>
                    <td>{{ office.branch?.name || '—' }}</td>
                    <td>
                      <button class="btn btn-sm btn-fadaa-orange me-1"><i class="bi bi-pencil-square me-1"></i>{{ t('common.edit') }}</button>
                      <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-info-circle-fill me-1"></i>{{ t('common.details') }}</button>
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
    </ProfileTabs>
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
import ProfileTabs from '@/components/ProfileTabs.vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const { showSuccessToast } = useToast();

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

const loadAssistantDashboard = async (profileId = null) => {
  if (!profileId) return;

  try {
    // Renewals: approximate via contracts ending within next 15 days
    const { data: contractsRes } = await getContracts(profileId);
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
    // const { data: clientsRes } = await getClients({ profile_id: profileId });
    const { data: clientsRes } = await getClients();
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

const exportData = (format) => {
  // Export real dashboard data
  const dataToExport = {
    renewals: renewals.value,
    expiringContracts: expiringContracts.value,
    prospects: prospects.value,
    offices: offices.value,
    tasks: pendingTasks.value
  };

  let content = '';
  let filename = `assistant_dashboard_export.${format}`;
  let mimeType = '';

  if (format === 'json') { // Added JSON export for simplicity
    content = JSON.stringify(dataToExport, null, 2);
    mimeType = 'application/json';
    filename = `assistant_dashboard_export.json`;
  } else if (format === 'csv') {
    // Basic CSV conversion for offices as an example
    let csvString = 'Office ID,Name,Status,Capacity,Branch\n';
    dataToExport.offices.forEach(office => {
      csvString += `${office.id},${office.name || ''},${office.status || ''},${office.capacity || ''},${office.branch?.name || ''}\n`;
    });
    content = csvString;
    mimeType = 'text/csv';
    filename = `assistant_dashboard_export.csv`;
  } else {
    // For Excel and PDF, we'll just show an alert as true generation is complex without libraries
    // Keep this page-specific informational toast
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
  // Keep this page-specific success toast
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