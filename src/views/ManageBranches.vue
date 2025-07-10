<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="text-fadaa-blue">{{ $t('manageBranches.title') }}</h2>
      <button class="btn btn-primary" @click="showAddBranchModal = true">
        <i class="bi bi-plus-circle me-2"></i>{{ $t('manageBranches.addBranch') }}
      </button>
    </div>

    <!-- Branches Table -->
    <div class="card shadow-sm">
      <div class="card-header bg-fadaa-light-blue">
        <h5 class="mb-0 text-fadaa-blue">{{ $t('manageBranches.branchList') }}</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>{{ $t('manageBranches.id') }}</th>
                <th>{{ $t('manageBranches.branchName') }}</th>
                <th>{{ $t('manageBranches.location') }}</th>
                <th>{{ $t('manageBranches.createdAt') }}</th>
                <th>{{ $t('manageBranches.status') }}</th>
                <th>{{ $t('manageBranches.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="branches.length === 0">
                <td colspan="6" class="text-center">{{ $t('manageBranches.noBranchesFound') }}</td>
              </tr>
              <tr v-for="branch in branches" :key="branch.id">
                <td>{{ branch.id }}</td>
                <td>{{ branch.name }}</td>
                <td>{{ branch.location }}</td>
                <td>{{ formatDate(branch.createdAt) }}</td>
                <td>
                  <span :class="`badge bg-${branch.status === 'active' ? 'success' : 'secondary'}`">
                    {{ branch.status === 'active' ? $t('manageBranches.active') : $t('manageBranches.inactive') }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-2" @click="editBranch(branch)">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteBranch(branch.id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Branch Modal -->
    <div v-if="showAddBranchModal || editingBranch" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-fadaa-blue">{{ editingBranch ? $t('manageBranches.editBranch') : $t('manageBranches.addBranchTitle') }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveBranch">
              <div class="mb-3">
                <label for="branchName" class="form-label">{{ $t('manageBranches.branchName') }}</label>
                <input type="text" class="form-control" id="branchName" v-model="branchForm.name" required>
              </div>
              <div class="mb-3">
                <label for="branchLocation" class="form-label">{{ $t('manageBranches.location') }}</label>
                <input type="text" class="form-control" id="branchLocation" v-model="branchForm.location" required>
              </div>
              <div class="mb-3" v-if="editingBranch">
                <label for="branchStatus" class="form-label">{{ $t('manageBranches.status') }}</label>
                <select class="form-select" id="branchStatus" v-model="branchForm.status">
                  <option value="active">{{ $t('manageBranches.active') }}</option>
                  <option value="inactive">{{ $t('manageBranches.inactive') }}</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">{{ $t('manageBranches.cancel') }}</button>
                <button type="submit" class="btn btn-primary">{{ editingBranch ? $t('manageBranches.save') : $t('manageBranches.add') }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const branches = ref([]);
const showAddBranchModal = ref(false);
const editingBranch = ref(null); // Holds the branch object being edited

const branchForm = reactive({
  id: null,
  name: '',
  location: '',
  status: 'active', // Default status for new branches
});

// Placeholder for API calls - replace with actual API service
const fetchBranches = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  branches.value = [
    { id: 1, name: 'Agence Centrale', location: 'Alger Centre', createdAt: new Date().toISOString(), status: 'active' },
    { id: 2, name: 'Agence Ouest', location: 'Oran', createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), status: 'active' }, // 30 days ago
    { id: 3, name: 'Agence Est', location: 'Constantine', createdAt: new Date(Date.now() - 86400000 * 60).toISOString(), status: 'inactive' }, // 60 days ago
  ];
};

const saveBranch = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  if (editingBranch.value) {
    // Update existing branch
    const index = branches.value.findIndex(b => b.id === editingBranch.value.id);
    if (index !== -1) {
      branches.value[index] = { ...branches.value[index], ...branchForm };
    }
    alert(t('manageBranches.branchUpdatedSuccess'));
  } else {
    // Add new branch
    const newBranch = {
      id: Date.now(), // Simple ID generation for demo
      ...branchForm,
      createdAt: new Date().toISOString(),
      status: 'active', // New branches are active by default from form, or set here
    };
    branches.value.push(newBranch);
    alert(t('manageBranches.branchAddedSuccess'));
  }
  closeModal();
  fetchBranches(); // Refresh list
};

const editBranch = (branch) => {
  editingBranch.value = { ...branch };
  branchForm.id = branch.id;
  branchForm.name = branch.name;
  branchForm.location = branch.location;
  branchForm.status = branch.status;
  showAddBranchModal.value = true; // Open modal in edit mode
};

const deleteBranch = async (branchId) => {
  if (confirm(t('manageBranches.confirmDeleteMessage'))) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    branches.value = branches.value.filter(b => b.id !== branchId);
    alert(t('manageBranches.branchDeletedSuccess'));
  }
};

const closeModal = () => {
  showAddBranchModal.value = false;
  editingBranch.value = null;
  // Reset form
  branchForm.id = null;
  branchForm.name = '';
  branchForm.location = '';
  branchForm.status = 'active';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

onMounted(() => {
  fetchBranches();
});

</script>

<style scoped>
.text-fadaa-blue {
  color: var(--fadaa-blue);
}
.bg-fadaa-light-blue {
  background-color: var(--fadaa-light-blue);
}
.modal.show {
  display: block;
}
</style>