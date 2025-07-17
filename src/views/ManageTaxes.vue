<template>
  <div class="manage-taxes-container container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ $t('manageTaxes.title') }}</h2>
      <button class="btn btn-fadaa-primary" @click="openCreateModal">
        <i class="bi bi-plus-circle-fill me-2"></i>{{ $t('manageTaxes.createTax') }}
      </button>
    </div>

    <!-- Taxes Table -->
    <div class="card shadow-sm">
      <div class="card-header bg-fadaa-light-blue">
        <h5 class="mb-0"><i class="bi bi-receipt-cutoff me-2"></i>{{ $t('manageTaxes.title') }}</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>{{ $t('manageTaxes.name') }}</th>
                <th>{{ $t('manageTaxes.rate') }} (%)</th>
                <th>{{ $t('manageTaxes.description') }}</th>
                <th>{{ $t('manageTaxes.bearer') }}</th>
                <th>{{ $t('manageTaxes.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tax in taxes" :key="tax.id">
                <td>{{ tax.name }}</td>
                <td>{{ tax.rate }}</td>
                <td>{{ tax.description }}</td>
                <td>{{ tax.bearer }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(tax)">
                    <i class="bi bi-pencil-fill"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDeleteTax(tax.id)">
                    <i class="bi bi-trash-fill"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!taxes.length">
                <td colspan="5" class="text-center text-muted">No taxes found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Tax Modal -->
    <div v-if="isModalOpen" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? $t('manageTaxes.editTax') : $t('manageTaxes.createTax') }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveTax">
              <div class="mb-3">
                <label for="taxName" class="form-label">{{ $t('manageTaxes.name') }}</label>
                <input type="text" class="form-control" id="taxName" v-model="currentTax.name" required>
              </div>
              <div class="mb-3">
                <label for="taxRate" class="form-label">{{ $t('manageTaxes.rate') }}</label>
                <input type="number" step="0.01" class="form-control" id="taxRate" v-model="currentTax.rate" required>
              </div>
              <div class="mb-3">
                <label for="taxDescription" class="form-label">{{ $t('manageTaxes.description') }}</label>
                <textarea class="form-control" id="taxDescription" v-model="currentTax.description"></textarea>
              </div>
              <div class="mb-3">
                <label for="taxBearer" class="form-label">{{ $t('manageTaxes.bearer') }}</label>
                <select class="form-select" id="taxBearer" v-model="currentTax.bearer">
                    <option value="Client">{{ t('manageTaxes.client') }}</option>
                    <option value="Company">{{ t('manageTaxes.company') }}</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">{{ $t('manageTaxes.cancel') }}</button>
                <button type="submit" class="btn btn-fadaa-primary">{{ $t('manageTaxes.save') }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

     <!-- Delete Confirmation Modal -->
    <div v-if="taxToDeleteId" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ $t('manageTaxes.confirmDeleteTax') }}</h5>
            <button type="button" class="btn-close" @click="taxToDeleteId = null"></button>
          </div>
          <div class="modal-body">
            <p>{{ $t('manageTaxes.confirmDeleteTax') }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="taxToDeleteId = null">{{ $t('manageTaxes.cancel') }}</button>
            <button type="button" class="btn btn-danger" @click="deleteTax">{{ $t('manageTaxes.delete') }}</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/ApiClient';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const taxes = ref([]);
const isModalOpen = ref(false);
const isEditing = ref(false);
const taxToDeleteId = ref(null);
const currentTax = ref({
  id: null,
  name: '',
  rate: '',
  description: '',
  bearer: 'Client'
});

const fetchTaxes = async () => {
  try {
    const response = await apiClient.get('/taxes');
    taxes.value = response.data.taxes;
  } catch (error) {
    console.error("Failed to fetch taxes:", error);
    // Add user-friendly notification here
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  currentTax.value = { id: null, name: '', rate: '', description: '', bearer: 'Client' };
  isModalOpen.value = true;
};

const openEditModal = (tax) => {
  isEditing.value = true;
  currentTax.value = { ...tax };
  isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    isEditing.value = false;
    currentTax.value = { id: null, name: '', rate: '', description: '', bearer: 'Client' };
};

const saveTax = async () => {
  try {
    if (isEditing.value) {
      await apiClient.put(`/taxes/${currentTax.value.id}`, currentTax.value);
    } else {
      await apiClient.post('/taxes', currentTax.value);
    }
    closeModal();
    fetchTaxes();
  } catch (error) {
    console.error("Failed to save tax:", error);
    // Add user-friendly notification here
  }
};

const confirmDeleteTax = (id) => {
  taxToDeleteId.value = id;
};

const deleteTax = async () => {
  if (taxToDeleteId.value) {
    try {
      await apiClient.delete(`/taxes/${taxToDeleteId.value}`);
      taxToDeleteId.value = null;
      fetchTaxes();
    } catch (error) {
      console.error("Failed to delete tax:", error);
       // Add user-friendly notification here
    }
  }
};

onMounted(() => {
  fetchTaxes();
});
</script>

<style scoped>
.manage-taxes-container {
  padding: 20px;
}
.card-header.bg-fadaa-light-blue {
    background-color: #e7f3fe;
    color: #0d6efd;
    border-bottom: 1px solid #dee2e6;
}
.btn-fadaa-primary {
  background-color: #0D6EFD;
  border-color: #0D6EFD;
  color: white;
}
.btn-fadaa-primary:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}
.modal.show {
  display: block;
}
.table th {
  font-weight: 600;
}
</style>