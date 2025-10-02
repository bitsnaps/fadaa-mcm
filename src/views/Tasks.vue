<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { BTable, BPagination } from 'bootstrap-vue-next';
import { useToast } from '@/helpers/toast';
import { getTasks as apiGetTasks, createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask } from '@/services/TaskService';
import AddEditTaskModal from '@/components/AddEditTaskModal.vue';

const { t } = useI18n();
const { showSuccessToast } = useToast();

const searchQuery = ref('');
const filterStatus = ref('');
const filterPriority = ref('');
const isLoading = ref(false);
const tasks = ref([]);
const currentPage = ref(1);
const perPage = ref(10);
const sortBy = ref(['due_date']);
const sortDesc = ref(true);

const isModalVisible = ref(false);
const selectedTask = ref(null);

const tableFields = computed(() => [
  { key: 'title', label: t('tasks.tableHeaders.title'), sortable: true },
  { key: 'description', label: t('tasks.tableHeaders.description'), sortable: true },
  { key: 'due_date', label: t('tasks.tableHeaders.due_date'), sortable: true, formatter: (value) => formatDate(value) },
  { key: 'priority', label: t('tasks.tableHeaders.priority'), sortable: true },
  { key: 'status', label: t('tasks.tableHeaders.status'), sortable: true },
  { key: 'actions', label: t('tasks.tableHeaders.actions') }
]);

const fetchTasks = async () => {
  isLoading.value = true;
  try {
    const { data } = await apiGetTasks();
    tasks.value = Array.isArray(data) ? data : (data?.data || []);
  } catch (e) {
    // Error toast is handled globally by ApiClient interceptor
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchTasks);

const filteredTasks = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return tasks.value.filter(task => {
    const title = (task.title || '').toLowerCase();
    const desc = (task.description || '').toLowerCase();
    const matchesSearch = !q || title.includes(q) || desc.includes(q);
    const matchesStatus = filterStatus.value ? task.status === filterStatus.value : true;
    const matchesPriority = filterPriority.value ? task.priority === filterPriority.value : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });
});

const paginatedTasks = computed(() => {
    const start = (currentPage.value - 1) * perPage.value;
    const end = start + perPage.value;
    return filteredTasks.value.slice(start, end);
});

const totalRows = computed(() => filteredTasks.value.length);

const formatDate = (dateString) => {
  if (!dateString) return t('common.na');
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const getPriorityBadge = (priority) => {
  const p = (priority || '').toLowerCase();
  switch (p) {
    case 'urgent': return 'badge bg-danger';
    case 'high': return 'badge bg-warning text-dark';
    case 'medium': return 'badge bg-info';
    case 'low': return 'badge bg-success';
    default: return 'badge bg-secondary';
  }
};

const getStatusBadge = (status) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'pending': return 'badge bg-secondary';
    case 'in_progress': return 'badge bg-primary';
    case 'completed': return 'badge bg-success';
    case 'cancelled': return 'badge bg-danger';
    default: return 'badge bg-light text-dark';
  }
};

const openCreateTaskModal = () => {
  selectedTask.value = null;
  isModalVisible.value = true;
};

const openEditTaskModal = (task) => {
  selectedTask.value = { ...task };
  isModalVisible.value = true;
};

const handleSaveTask = async (taskData) => {
  try {    
    if (taskData.id) {
      await apiUpdateTask(taskData.id, taskData);
      showSuccessToast(t('tasks.success.updated'));
      await fetchTasks();
    } else {
      await apiCreateTask(taskData);
      showSuccessToast(t('tasks.success.created'));
    }
    await fetchTasks();
  } catch {
    // Error toast is handled globally by ApiClient interceptor
  } finally {
    isModalVisible.value = false;
  }
};

const handleDeleteTask = async (taskId) => {
  if (!confirm(t('tasks.confirmDelete'))) return;
  try {
    await apiDeleteTask(taskId);
    await fetchTasks();
  } catch {
    // Error toast is handled globally by ApiClient interceptor
  }
};

</script>

<template>
  <div class="container mt-4">
    <h1 class="mb-4">{{ t('tasks.title') }}</h1>

    <div v-if="isLoading" class="alert alert-info">{{ t('loading') }}</div>

    <!-- Filters and Search -->
    <div class="row mb-3">
      <div class="col-md-4">
        <input type="text" class="form-control" :placeholder="t('tasks.searchPlaceholder')" v-model="searchQuery">
      </div>
      <div class="col-md-3">
        <select class="form-select" v-model="filterStatus">
          <option value="">{{ t('tasks.allStatuses') }}</option>
          <option value="pending">{{ t('tasks.statuses.pending') }}</option>
          <option value="in_progress">{{ t('tasks.statuses.in_progress') }}</option>
          <option value="completed">{{ t('tasks.statuses.completed') }}</option>
          <option value="cancelled">{{ t('tasks.statuses.cancelled') }}</option>
        </select>
      </div>
      <div class="col-md-3">
        <select class="form-select" v-model="filterPriority">
          <option value="">{{ t('tasks.allPriorities') }}</option>
          <option value="low">{{ t('tasks.priorities.low') }}</option>
          <option value="medium">{{ t('tasks.priorities.medium') }}</option>
          <option value="high">{{ t('tasks.priorities.high') }}</option>
           <option value="urgent">{{ t('tasks.priorities.urgent') }}</option>
        </select>
      </div>
      <div class="col-md-2">
        <button class="btn btn-primary w-100" @click="openCreateTaskModal">{{ t('tasks.addTask') }}</button>
      </div>
    </div>

    <!-- Tasks Table -->
    <BTable
        :items="paginatedTasks"
        :fields="tableFields"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        responsive
        striped
        hover
        >
        <template #cell(priority)="data">
            <span :class="getPriorityBadge(data.value)">
                {{ data.value ? t('tasks.priorities.' + data.value.toLowerCase()) : 'N/A' }}
            </span>
        </template>
        <template #cell(status)="data">
            <span :class="getStatusBadge(data.value)">
                {{ data.value ? t('tasks.statuses.' + data.value.toLowerCase()) : 'N/A' }}
            </span>
        </template>
        <template #cell(actions)="data">
            <button class="btn btn-sm btn-warning me-1" @click="openEditTaskModal(data.item)">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-sm btn-danger" @click="handleDeleteTask(data.item.id)">
                <i class="bi bi-trash"></i>
            </button>
        </template>
    </BTable>

    <div class="d-flex justify-content-center">
        <BPagination
            v-model="currentPage"
            :total-rows="totalRows"
            :per-page="perPage"
            aria-controls="tasks-table"
        ></BPagination>
    </div>
    
    <AddEditTaskModal
      :showModal="isModalVisible"
      :task="selectedTask"
      @close="isModalVisible = false"
      @save="handleSaveTask"
    />
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
}
.table th, .table td {
  vertical-align: middle;
}
.badge {
  font-size: 0.9em;
  text-transform: capitalize;
}
</style>