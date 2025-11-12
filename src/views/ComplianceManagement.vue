<template>
  <div class="compliance-management-container container-fluid">
    <h2 class="mb-4">{{ $t('complianceManagement.title') }}</h2>

    <!-- Loading and Error States -->
    <div v-if="isLoading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>{{ $t('complianceManagement.loading') }}</p>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>


    <!-- Section 1: Compliance Status Overview -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card text-center shadow-sm h-100">
          <div class="card-body">
            <i class="bi bi-shield-check display-4 text-success mb-3"></i>
            <h5 class="card-title">{{ $t('complianceManagement.overview.overallStatus') }}</h5>
            <p class="card-text fs-4 fw-bold text-success">{{ $t('complianceManagement.overview.compliant') }}</p>
            <small class="text-muted">{{ $t('complianceManagement.overview.lastChecked') }}: {{ lastCheckDate }}</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center shadow-sm h-100">
          <div class="card-body">
            <i class="bi bi-file-earmark-text display-4 text-fadaa-blue mb-3"></i>
            <h5 class="card-title">{{ $t('complianceManagement.overview.activeDocuments') }}</h5>
            <p class="card-text fs-4 fw-bold">{{ activeDocuments }}</p>
            <small class="text-muted">{{ $t('complianceManagement.overview.policiesAndProcedures') }}</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center shadow-sm h-100">
          <div class="card-body">
            <i class="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
            <h5 class="card-title">{{ $t('complianceManagement.overview.activeAlerts') }}</h5>
            <p class="card-text fs-4 fw-bold text-warning">{{ activeAlerts }}</p>
            <small class="text-muted">{{ $t('complianceManagement.overview.needsAttention') }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Upcoming Deadlines -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="bi bi-calendar-check-fill me-2"></i>{{ $t('complianceManagement.upcomingDeadlines.title') }}</h5>
            <button class="btn btn-sm btn-primary" @click="openDeadlineModal()">
              <i class="bi bi-plus-circle me-1"></i> {{ $t('complianceManagement.upcomingDeadlines.add') }}
            </button>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>{{ $t('complianceManagement.upcomingDeadlines.task') }}</th>
                    <th>{{ $t('complianceManagement.upcomingDeadlines.description') }}</th>
                    <th>{{ $t('complianceManagement.upcomingDeadlines.dueDate') }}</th>
                    <th>{{ $t('complianceManagement.upcomingDeadlines.priority') }}</th>
                    <th>{{ $t('complianceManagement.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="deadline in upcomingDeadlines" :key="deadline.id">
                    <td>{{ deadline.title }}</td>
                    <td>{{ deadline.description }}</td>
                    <td>{{ formatDate(deadline.due_date) }}</td>
                    <td>
                      <span :class="`badge bg-${deadline.priority === 'High' ? 'danger' : deadline.priority === 'Medium' ? 'warning text-dark' : 'info'}`">
                        {{ getPriorityTranslation(deadline.priority) }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary me-1" @click="openDeadlineModal(deadline)">
                        <i class="bi bi-pencil-square"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteDeadline(deadline.id)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!upcomingDeadlines.length">
                    <td colspan="5" class="text-center text-muted">{{ $t('complianceManagement.upcomingDeadlines.noDeadlines') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Recent Compliance Activities -->
    <div class="row">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="bi bi-list-task me-2"></i>{{ $t('complianceManagement.recentActivities.title') }}</h5>
            <button class="btn btn-sm btn-primary" @click="openActivityModal()">
              <i class="bi bi-plus-circle me-1"></i> {{ $t('complianceManagement.recentActivities.log') }}
            </button>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="activity in recentActivities" :key="activity.id" class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-1">{{ activity.action }}</h6>
                  <small class="text-muted">{{ formatDate(activity.created_at) }}</small>
                </div>
                <p class="mb-1 text-muted small">{{ activity.details ? activity.details.description : '' }}</p>
                <div>
                  <span :class="`badge bg-${activity.details && activity.details.status === 'Completed' ? 'success' : activity.details && activity.details.status === 'In Progress' ? 'primary' : 'secondary'}`">
                    {{ activity.details ? getActivityStatusTranslation(activity.details.status) : '' }}
                  </span>
                  <div class="float-end">
                    <button class="btn btn-sm btn-outline-primary me-1" @click="openActivityModal(activity)">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteActivity(activity.id)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </li>
              <li v-if="!recentActivities.length" class="list-group-item text-center text-muted">
                {{ $t('complianceManagement.recentActivities.noActivities') }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Deadline Modal -->
    <div class="modal fade" id="deadlineModal" tabindex="-1" aria-labelledby="deadlineModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deadlineModalLabel">{{ editingDeadline.id ? $t('complianceManagement.upcomingDeadlines.editTitle') : $t('complianceManagement.upcomingDeadlines.addTitle') }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveDeadline">
              <div class="mb-3">
                <label for="deadline-title" class="form-label">{{ $t('complianceManagement.upcomingDeadlines.task') }} <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="deadline-title" v-model="editingDeadline.title" required>
              </div>
              <div class="mb-3">
                <label for="deadline-description" class="form-label">{{ $t('complianceManagement.upcomingDeadlines.description') }}</label>
                <textarea class="form-control" id="deadline-description" v-model="editingDeadline.description"></textarea>
              </div>
              <div class="mb-3">
                <label for="deadline-due-date" class="form-label">{{ $t('complianceManagement.upcomingDeadlines.dueDate') }}</label>
                <input type="date" class="form-control" id="deadline-due-date" v-model="editingDeadline.due_date">
              </div>
              <div class="mb-3">
                <label for="deadline-priority" class="form-label">{{ $t('complianceManagement.upcomingDeadlines.priority') }}</label>
                <select class="form-select" id="deadline-priority" v-model="editingDeadline.priority">
                  <option value="Low">{{ $t('complianceManagement.upcomingDeadlines.priorities.low') }}</option>
                  <option value="Medium">{{ $t('complianceManagement.upcomingDeadlines.priorities.medium') }}</option>
                  <option value="High">{{ $t('complianceManagement.upcomingDeadlines.priorities.high') }}</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t('complianceManagement.cancel') }}</button>
                <button type="submit" class="btn btn-primary">{{ $t('complianceManagement.save') }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Modal -->
    <div class="modal fade" id="activityModal" tabindex="-1" aria-labelledby="activityModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="activityModalLabel">{{ editingActivity.id ? $t('complianceManagement.recentActivities.editTitle') : $t('complianceManagement.recentActivities.log') }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveActivity">
              <div class="mb-3">
                <label for="activity-action" class="form-label">{{ $t('complianceManagement.recentActivities.activity') }} <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="activity-action" v-model="editingActivity.action" required>
              </div>
              <div class="mb-3">
                <label for="activity-description" class="form-label">{{ $t('complianceManagement.recentActivities.description') }}</label>
                <textarea class="form-control" id="activity-description" v-model="editingActivity.details.description"></textarea>
              </div>
              <div class="mb-3">
                <label for="activity-status" class="form-label">{{ $t('complianceManagement.recentActivities.status') }}</label>
                <select class="form-select" id="activity-status" v-model="editingActivity.details.status">
                  <option value="In Progress">{{ $t('complianceManagement.recentActivities.statuses.in_progress') }}</option>
                  <option value="Completed">{{ $t('complianceManagement.recentActivities.statuses.completed') }}</option>
                  <option value="Pending">{{ $t('complianceManagement.recentActivities.statuses.pending') }}</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t('complianceManagement.cancel') }}</button>
                <button type="submit" class="btn btn-primary">{{ $t('complianceManagement.save') }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ApiClient from '@/services/ApiClient';
import * as bootstrap from 'bootstrap';

const { t } = useI18n();
const lastCheckDate = ref(new Date().toLocaleDateString());
const activeDocuments = ref(0); // Will be updated from a real source later
const activeAlerts = ref(0); // Will be updated from a real source later

const upcomingDeadlines = ref([]);
const recentActivities = ref([]);
const isLoading = ref(true);
const error = ref(null);

const editingDeadline = ref({});
let deadlineModal = null;

const editingActivity = ref({ details: {} });
let activityModal = null;

const openDeadlineModal = (deadline = {}) => {
  editingDeadline.value = { ...deadline };
  // Format date for the input field
  if (editingDeadline.value.due_date) {
    editingDeadline.value.due_date = formatDateForInput(editingDeadline.value.due_date);
  }
  if (!deadlineModal) {
    deadlineModal = new bootstrap.Modal(document.getElementById('deadlineModal'));
  }
  deadlineModal.show();
};

const saveDeadline = async () => {
  try {
    const deadlineData = {
      ...editingDeadline.value,
      category: 'Compliance',
    };

    if (editingDeadline.value.id) {
      // Update existing deadline
      await ApiClient.put(`/tasks/${editingDeadline.value.id}`, deadlineData);
    } else {
      // Create new deadline
      await ApiClient.post('/tasks', deadlineData);
    }
    await fetchComplianceData(); // Refresh the list
    deadlineModal.hide();
  } catch (err) {
    console.error('Failed to save deadline:', err);
    error.value = t('complianceManagement.errors.saveFailed');
  }
};

const deleteDeadline = async (id) => {
  if (!confirm(t('complianceManagement.upcomingDeadlines.confirmDelete'))) {
    return;
  }
  try {
    await ApiClient.delete(`/tasks/${id}`);
    await fetchComplianceData(); // Refresh the list
  } catch (err) {
    console.error('Failed to delete deadline:', err);
    error.value = t('complianceManagement.errors.deleteFailed');
  }
};

const openActivityModal = (activity = {}) => {
  editingActivity.value = JSON.parse(JSON.stringify(activity)); // Deep copy
  if (!editingActivity.value.details) {
    editingActivity.value.details = {};
  }
  if (!activityModal) {
    activityModal = new bootstrap.Modal(document.getElementById('activityModal'));
  }
  activityModal.show();
};

const saveActivity = async () => {
  try {
    const activityData = {
      ...editingActivity.value,
      context: 'Compliance',
    };

    if (editingActivity.value.id) {
      // Update existing activity
      await ApiClient.put(`/activity-logs/${editingActivity.value.id}`, activityData);
    } else {
      // Create new activity
      await ApiClient.post('/activity-logs', activityData);
    }
    await fetchComplianceData(); // Refresh the list
    activityModal.hide();
  } catch (err) {
    console.error('Failed to save activity:', err);
    error.value = t('complianceManagement.errors.saveFailed');
  }
};

const deleteActivity = async (id) => {
  if (!confirm(t('complianceManagement.recentActivities.confirmDelete'))) {
    return;
  }
  try {
    await ApiClient.delete(`/activity-logs/${id}`);
    await fetchComplianceData(); // Refresh the list
  } catch (err) {
    console.error('Failed to delete activity:', err);
    error.value = t('complianceManagement.errors.deleteFailed');
  }
};


const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const fetchComplianceData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // Fetch upcoming deadlines (tasks)
    const deadlinesResponse = await ApiClient.get('/tasks', { params: { category: 'Compliance' } });
    if (deadlinesResponse.data) {
      upcomingDeadlines.value = deadlinesResponse.data;
      // Update the active alerts count based on high-priority deadlines
      activeAlerts.value = deadlinesResponse.data.filter(d => d.priority === 'High').length;
    }

    // Fetch recent compliance activities
    const activitiesResponse = await ApiClient.get('/activity-logs', { params: { context: 'Compliance', limit: 10 } });
     if (activitiesResponse.data && activitiesResponse.data.data) {
      recentActivities.value = activitiesResponse.data.data;
    }

  } catch (err) {
    console.error('Failed to fetch compliance data:', err);
    error.value = t('complianceManagement.errors.fetchFailed');
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchComplianceData);

const getPriorityTranslation = (priority) => {
  return t(`complianceManagement.upcomingDeadlines.priorities.${priority.toLowerCase()}`);
};

const getActivityStatusTranslation = (status) => {
  const key = status.replace(/\s+/g, '_').toLowerCase();
  return t(`complianceManagement.recentActivities.statuses.${key}`);
};

</script>

<style scoped>
.compliance-management-container {
  padding: 20px;
}

.card-header.bg-fadaa-light-blue {
  background-color: #e7f3fe; /* A light, professional blue */
  color: #0d6efd; /* FADAA Blue for text */
  border-bottom: 1px solid #dee2e6;
}

.text-fadaa-blue {
  color: #0D6EFD !important;
}

.display-4 {
  font-size: 3rem; /* Slightly smaller for card icons */
}

.badge {
  font-size: 0.8em;
}

.list-group-item h6 {
  font-weight: 500;
}

.card {
  margin-bottom: 1.5rem; /* Consistent spacing */
}
</style>