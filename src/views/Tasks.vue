
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from '@/helpers/toast';
import { getTasks as apiGetTasks, createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask } from '@/services/TaskService';

const searchQuery = ref('');
const filterStatus = ref('');
const filterPriority = ref('');
const isLoading = ref(false);
const { showSuccessToast, showErrorToast } = useToast();

const tasks = ref([]);

const fetchTasks = async () => {
  isLoading.value = true;
  try {
    const { data } = await apiGetTasks();
    // API returns array per controller
    tasks.value = Array.isArray(data) ? data : (data?.data || []);
  } catch (e) {
    showErrorToast('Failed to fetch tasks');
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchTasks);

const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          task.assignedTo.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          (task.clientName && task.clientName.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesStatus = filterStatus.value ? task.status === filterStatus.value : true;
    const matchesPriority = filterPriority.value ? task.priority === filterPriority.value : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });
});

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

const getPriorityBadge = (priority) => {
  switch (priority.toLowerCase()) {
    case 'haute': return 'badge bg-danger';
    case 'moyenne': return 'badge bg-warning text-dark';
    case 'basse': return 'badge bg-success';
    default: return 'badge bg-secondary';
  }
};

const getStatusBadge = (status) => {
  switch (status.toLowerCase()) {
    case 'en attente': return 'badge bg-secondary';
    case 'en cours': return 'badge bg-primary';
    case 'terminée': return 'badge bg-success';
    case 'annulée': return 'badge bg-danger';
    default: return 'badge bg-light text-dark';
  }
};

const openCreateTaskModal = () => {
  // Logic to open create task modal
  showSuccessToast('Ouvrir le modal de création de tâche');
};

const openViewTaskModal = (task) => {
  // Logic to open view task modal
  showSuccessToast(`Voir la tâche: ${task.title}`);
};

const openEditTaskModal = (task) => {
  // Logic to open edit task modal
  showSuccessToast(`Modifier la tâche: ${task.title}`);
};

const deleteTask = (taskId) => {
  // Logic to delete task
  tasks.value = tasks.value.filter(task => task.id !== taskId);
  showSuccessToast(`Tâche ${taskId} supprimée`);
};

</script>

<template>
  <div class="container mt-4">
    <h1 class="mb-4">Gérer les Tâches</h1>

    <div v-if="isLoading" class="alert alert-info">Chargement des tâches…</div>

    <!-- Filters and Search -->
    <div class="row mb-3">
      <div class="col-md-4">
        <input type="text" class="form-control" placeholder="Rechercher des tâches..." v-model="searchQuery">
      </div>
      <div class="col-md-3">
        <select class="form-select" v-model="filterStatus">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>
      <div class="col-md-3">
        <select class="form-select" v-model="filterPriority">
          <option value="">Toutes les priorités</option>
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
        </select>
      </div>
      <div class="col-md-2">
        <button class="btn btn-primary w-100" @click="openCreateTaskModal">Nouvelle Tâche</button>
      </div>
    </div>

    <!-- Tasks Table -->
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th scope="col">Titre</th>
            <th scope="col">Assigné à</th>
            <th scope="col">Client Associé</th>
            <th scope="col">Date d'Échéance</th>
            <th scope="col">Priorité</th>
            <th scope="col">Statut</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredTasks" :key="task.id">
            <td>{{ task.title }}</td>
            <td>{{ task.assignedTo }}</td>
            <td>{{ task.clientName }}</td>
            <td>{{ formatDate(task.dueDate) }}</td>
            <td><span :class="getPriorityBadge(task.priority)">{{ task.priority }}</span></td>
            <td><span :class="getStatusBadge(task.status)">{{ task.status }}</span></td>
            <td>
              <button class="btn btn-sm btn-info me-1" @click="openViewTaskModal(task)">Voir</button>
              <button class="btn btn-sm btn-warning me-1" @click="openEditTaskModal(task)">Modifier</button>
              <button class="btn btn-sm btn-danger" @click="deleteTask(task.id)">Supprimer</button>
            </td>
          </tr>
          <tr v-if="filteredTasks.length === 0">
            <td colspan="7" class="text-center">Aucune tâche trouvée.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination (Placeholder) -->
    <nav aria-label="Page navigation">
      <ul class="pagination justify-content-center">
        <li class="page-item disabled"><a class="page-link" href="#">Précédent</a></li>
        <li class="page-item active"><a class="page-link" href="#">1</a></li>
        <li class="page-item"><a class="page-link" href="#">2</a></li>
        <li class="page-item"><a class="page-link" href="#">3</a></li>
        <li class="page-item"><a class="page-link" href="#">Suivant</a></li>
      </ul>
    </nav>

    <!-- Modals (Placeholders - to be implemented as separate components or inline) -->
    <!-- Create Task Modal -->
    <!-- View Task Modal -->
    <!-- Edit Task Modal -->

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
}
</style>