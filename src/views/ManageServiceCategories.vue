<template>
  <div class="container mt-4">
    <h2>{{ $t('manageServiceCategories.title') }}</h2>
    <p class="text-muted">{{ $t('manageServiceCategories.description') }}</p>

    <div class="mb-3">
      <button class="btn btn-primary" @click="openAddModal">
        <i class="bi bi-plus-circle me-2"></i>{{ $t('manageServiceCategories.addNewCategory') }}
      </button>
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-fadaa-primary">
          <tr>
            <th scope="col">#</th>
            <th scope="col">{{ $t('manageServiceCategories.categoryName') }}</th>
            <th scope="col">{{ $t('manageServiceCategories.descriptionHeader') }}</th>
            <th scope="col">{{ $t('manageServiceCategories.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loadingCategories">
            <td colspan="4" class="text-center">{{ $t('manageServiceCategories.loadingCategories') }}</td>
          </tr>
          <tr v-else-if="serviceCategories.length === 0">
            <td colspan="4" class="text-center">{{ $t('manageServiceCategories.noServiceCategoriesFound') }}</td>
          </tr>
          <tr v-for="(category, index) in serviceCategories" :key="category.id">
            <td>{{ index + 1 }}</td>
            <td>{{ category.name }}</td>
            <td>{{ category.description }}</td>
            <td>
              <button class="btn btn-sm btn-outline-fadaa-primary me-2" @click="openEditModal(category)">
                <i class="bi bi-pencil-square"></i> {{ $t('manageServiceCategories.edit') }}
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="confirmDeleteCategory(category.id)">
                <i class="bi bi-trash"></i> {{ $t('manageServiceCategories.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Category Modal -->
    <div class="modal fade" id="categoryModal" tabindex="-1" aria-labelledby="categoryModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="categoryModalLabel">{{ $t('manageServiceCategories.addEditModalTitle', { mode: modalMode === 'add' ? $t('manageServiceCategories.addMode') : $t('manageServiceCategories.editMode') }) }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSaveCategory">
              <div class="mb-3">
                <label for="categoryName" class="form-label">{{ $t('manageServiceCategories.categoryNameLabel') }} <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="categoryName" v-model="v$.name.$model" :class="{ 'is-invalid': v$.name.$error }">
                <div v-if="v$.name.$error" class="invalid-feedback">
                  <p v-for="error of v$.name.$errors" :key="error.$uid">{{ error.$message }}</p>
                </div>
              </div>
              <div class="mb-3">
                <label for="categoryDescription" class="form-label">{{ $t('manageServiceCategories.descriptionLabel') }}</label>
                <textarea class="form-control" id="categoryDescription" v-model="currentCategory.description" rows="3"></textarea>
              </div>
              <div v-if="errors.server" class="alert alert-danger mt-3">
                {{ errors.server }}
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t('manageServiceCategories.close') }}</button>
                <button type="submit" class="btn btn-primary">{{ modalMode === 'add' ? $t('manageServiceCategories.add') : $t('manageServiceCategories.saveChanges') }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { Modal } from 'bootstrap';
import { useI18n } from 'vue-i18n';
import apiClient from '@/services/ApiClient';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';

const { t } = useI18n();
const serviceCategories = ref([]);
const loadingCategories = ref(false);
const modalMode = ref('add');
const currentCategory = ref({ id: null, name: '', description: '' });
const errors = reactive({ server: '' });
let categoryModal = null;

const rules = computed(() => ({
  name: { required },
}));

const v$ = useVuelidate(rules, currentCategory);

const fetchServiceCategories = async () => {
  loadingCategories.value = true;
  try {
    const response = await apiClient.get('/service-categories');
    if (response.data.success) {
      serviceCategories.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to fetch service categories:', error);
  } finally {
    loadingCategories.value = false;
  }
};

onMounted(() => {
  fetchServiceCategories();
  const modalElement = document.getElementById('categoryModal');
  if (modalElement) {
      categoryModal = new Modal(modalElement);
  }
});

const openAddModal = () => {
  modalMode.value = 'add';
  currentCategory.value = { id: null, name: '', description: '' };
  v$.value.$reset();
  errors.server = '';
  if(categoryModal) categoryModal.show();
};

const openEditModal = (category) => {
  modalMode.value = 'edit';
  currentCategory.value = { ...category };
  v$.value.$reset();
  errors.server = '';
  if(categoryModal) categoryModal.show();
};

const handleSaveCategory = async () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    if (modalMode.value === 'add') {
      await apiClient.post('/service-categories', currentCategory.value);
    } else {
      await apiClient.put(`/service-categories/${currentCategory.value.id}`, currentCategory.value);
    }
    if(categoryModal) categoryModal.hide();
    fetchServiceCategories();
  } catch (error) {
    if (error.response && error.response.status === 422) {
      const backendErrors = error.response.data.errors;
      for (const field in backendErrors) {
        if (v$.value[field]) {
          v$.value[field].$errors.push({ $uid: `server-error-${field}`, $message: backendErrors[field] });
        }
      }
      errors.server = 'Please check the fields below for errors.';
    } else {
      errors.server = error.response?.data?.message || 'An unknown error occurred';
    }
    console.error(`Failed to ${modalMode.value} category:`, error);
  }
};

const confirmDeleteCategory = async (categoryId) => {
  if (confirm(t('manageServiceCategories.confirmDelete'))) {
    try {
      await apiClient.delete(`/service-categories/${categoryId}`);
      fetchServiceCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  }
};

</script>

<style scoped>
/* Using global FADAA styles, add specific styles if needed */
.btn-fadaa-primary {
  background-color: var(--fadaa-blue);
  border-color: var(--fadaa-blue);
  color: white;
}
.btn-fadaa-primary:hover {
  background-color: var(--fadaa-dark-blue);
  border-color: var(--fadaa-dark-blue);
}
.table-fadaa-primary {
  background-color: var(--fadaa-light-blue);
  color: var(--fadaa-blue);
}
.btn-outline-fadaa-primary {
    color: var(--fadaa-blue);
    border-color: var(--fadaa-blue);
}
.btn-outline-fadaa-primary:hover {
    color: #fff;
    background-color: var(--fadaa-blue);
    border-color: var(--fadaa-blue);
}
</style>