<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import apiClient from '@/services/ApiClient';
import { Modal } from 'bootstrap';

const { t } = useI18n();

const incomeCategories = ref([]);
const expenseCategories = ref([]);
const isLoading = ref(true);
const activeTab = ref('incomes'); // 'incomes' or 'expenses'

const isEditMode = ref(false);
const currentCategory = ref({});
const categoryModal = ref(null);

const tableFields = computed(() => [
  { key: 'name', label: t('manageServiceCategories.categoryName') },
  { key: 'description', label: t('manageServiceCategories.descriptionHeader') },
  { key: 'actions', label: t('manageServiceCategories.actions'), class: 'text-center' }
]);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [incomesRes, expensesRes] = await Promise.all([
      apiClient.get('/categories/incomes'),
      apiClient.get('/categories/expenses')
    ]);
    incomeCategories.value = incomesRes.data.categories;
    expenseCategories.value = expensesRes.data.categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchData);

const openModal = (category = null) => {
  isEditMode.value = !!category;
  currentCategory.value = category ? { ...category } : { name: '', description: '' };
  const modalInstance = Modal.getOrCreateInstance(categoryModal.value);
  modalInstance.show();
};

const handleSubmit = async () => {
  const endpoint = `/categories/${activeTab.value}`;
  try {
    if (isEditMode.value) {
      await apiClient.put(`${endpoint}/${currentCategory.value.id}`, currentCategory.value);
    } else {
      await apiClient.post(endpoint, currentCategory.value);
    }
    await fetchData();
    const modalInstance = Modal.getInstance(categoryModal.value);
    modalInstance.hide();
  } catch (error) {
    console.error(`Failed to save category:`, error);
  }
};

const handleDelete = async (id) => {
  if (confirm(t('manageServiceCategories.confirmDelete'))) {
    try {
      await apiClient.delete(`/categories/${activeTab.value}/${id}`);
      await fetchData();
    } catch (error) {
      console.error(`Failed to delete category:`, error);
    }
  }
};

</script>

<template>
  <div class="container mt-4">
    <h2>{{ t('sidebar.manageServiceCategories') }}</h2>

    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'incomes' }" @click.prevent="activeTab = 'incomes'" href="#">{{ t('manageIncomes.title') }}</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'expenses' }" @click.prevent="activeTab = 'expenses'" href="#">{{ t('manageExpenses.title') }}</a>
      </li>
    </ul>

    <div class="tab-content pt-3">
      <div class="tab-pane fade show active">
        <div class="d-flex justify-content-end mb-3">
          <button class="btn btn-primary" @click="openModal()">
            <i class="bi bi-plus-lg me-2"></i>{{ t('manageServiceCategories.addNewCategory') }}
          </button>
        </div>

        <div v-if="isLoading" class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">{{ t('loading') }}</span>
          </div>
        </div>

        <div v-else>
          <table class="table table-striped">
            <thead>
              <tr>
                <th>{{ t('manageServiceCategories.categoryName') }}</th>
                <th>{{ t('manageServiceCategories.descriptionHeader') }}</th>
                <th class="text-center">{{ t('manageServiceCategories.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in (activeTab === 'incomes' ? incomeCategories : expenseCategories)" :key="category.id">
                <td>{{ category.name }}</td>
                <td>{{ category.description }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-secondary me-2" @click="openModal(category)">
                    <i class="bi bi-pencil"></i> {{ t('manageServiceCategories.edit') }}
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="handleDelete(category.id)">
                    <i class="bi bi-trash"></i> {{ t('manageServiceCategories.delete') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="(activeTab === 'incomes' ? incomeCategories.length : expenseCategories.length) === 0">
            {{ t('manageServiceCategories.noServiceCategoriesFound') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" ref="categoryModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditMode ? t('manageServiceCategories.editMode') : t('manageServiceCategories.addMode') }} {{ activeTab === 'incomes' ? t('incomes.title') : t('expenses.title') }} {{ t('common.category') }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <div class="mb-3">
                <label for="categoryName" class="form-label">{{ t('manageServiceCategories.categoryNameLabel') }}</label>
                <input type="text" class="form-control" id="categoryName" v-model="currentCategory.name" required>
              </div>
              <div class="mb-3">
                <label for="categoryDescription" class="form-label">{{ t('manageServiceCategories.descriptionLabel') }}</label>
                <textarea class="form-control" id="categoryDescription" v-model="currentCategory.description" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('manageUsers.close') }}</button>
            <button type="button" class="btn btn-primary" @click="handleSubmit">{{ isEditMode ? t('manageUsers.save') : t('manageUsers.add') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>