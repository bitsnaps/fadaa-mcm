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
                <td>{{ formatDate(branch.created_at) }}</td>
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
import apiClient from '@/services/ApiClient';
import { formatDate } from '@/helpers/utils';

const { t } = useI18n();

const branches = ref([]);
const showAddBranchModal = ref(false);
const editingBranch = ref(null);

const branchForm = reactive({
  id: null,
  name: '',
  location: '',
  status: 'active',
});

const fetchBranches = async () => {
  try {
    const response = await apiClient.get('/branches');
    if (response.data.success) {
      branches.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to fetch branches:', error);
    console.log('Error fetching branches.');
  }
};

const saveBranch = async () => {
  try {
    if (editingBranch.value) {
      await apiClient.put(`/branches/${editingBranch.value.id}`, branchForm);
      console.log(t('manageBranches.branchUpdatedSuccess'));
    } else {
      await apiClient.post('/branches', branchForm);
      console.log(t('manageBranches.branchAddedSuccess'));
    }
    closeModal();
    fetchBranches();
  } catch (error) {
    console.error('Failed to save branch:', error);
    console.log('Error saving branch.');
  }
};

const editBranch = (branch) => {
  editingBranch.value = branch;
  Object.assign(branchForm, branch);
  showAddBranchModal.value = true;
};

const deleteBranch = async (branchId) => {
  if (confirm(t('manageBranches.confirmDeleteMessage'))) {
    try {
      await apiClient.delete(`/branches/${branchId}`);
      console.log(t('manageBranches.branchDeletedSuccess'));
      fetchBranches();
    } catch (error) {
      console.error('Failed to delete branch:', error);
      console.log('Error deleting branch.');
    }
  }
};

const closeModal = () => {
  showAddBranchModal.value = false;
  editingBranch.value = null;
  Object.assign(branchForm, { id: null, name: '', location: '', status: 'active' });
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