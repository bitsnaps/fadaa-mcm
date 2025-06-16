<template>
  <div class="container mt-4">
    <h2>Manage Service Categories</h2>
    <p class="text-muted">Admins can define categories for services offered to clients.</p>

    <div class="mb-3">
      <button class="btn btn-primary" @click="openAddModal">
        <i class="bi bi-plus-circle me-2"></i>Add New Category
      </button>
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-fadaa-primary">
          <tr>
            <th scope="col">#</th>
            <th scope="col">Category Name</th>
            <th scope="col">Description</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loadingCategories">
            <td colspan="4" class="text-center">Loading categories...</td>
          </tr>
          <tr v-else-if="serviceCategories.length === 0">
            <td colspan="4" class="text-center">No service categories found.</td>
          </tr>
          <tr v-for="(category, index) in serviceCategories" :key="category.id">
            <td>{{ index + 1 }}</td>
            <td>{{ category.name }}</td>
            <td>{{ category.description }}</td>
            <td>
              <button class="btn btn-sm btn-outline-fadaa-primary me-2" @click="openEditModal(category)">
                <i class="bi bi-pencil-square"></i> Edit
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="confirmDeleteCategory(category.id)">
                <i class="bi bi-trash"></i> Delete
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
            <h5 class="modal-title" id="categoryModalLabel">{{ modalMode === 'add' ? 'Add New' : 'Edit' }} Service Category</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSaveCategory">
              <div class="mb-3">
                <label for="categoryName" class="form-label">Category Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="categoryName" v-model="currentCategory.name" required>
              </div>
              <div class="mb-3">
                <label for="categoryDescription" class="form-label">Description</label>
                <textarea class="form-control" id="categoryDescription" v-model="currentCategory.description" rows="3"></textarea>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="submit" class="btn btn-primary">{{ modalMode === 'add' ? 'Add' : 'Save Changes' }}</button>
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
import { Modal } from 'bootstrap';
// import { useAuthStore } from '@/stores/auth'; // If needed for API calls
// import apiClient from '@/services/ApiClient'; // Placeholder for API calls

// const authStore = useAuthStore();

const serviceCategories = ref([]);
const loadingCategories = ref(false);
const modalMode = ref('add'); // 'add' or 'edit'
const currentCategory = ref({
  id: null,
  name: '',
  description: ''
});
let categoryModal = null;

const fetchServiceCategories = async () => {
  loadingCategories.value = true;
  // Placeholder: Replace with actual API call
  console.log('Fetching service categories...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  serviceCategories.value = [
    { id: 1, name: 'Equipment Rental', description: 'Rental of office equipment like projectors, screens, etc.' },
    { id: 2, name: 'Cleaning Services', description: 'Regular or one-time office cleaning.' },
    { id: 3, name: 'Utilities', description: 'Services like internet, electricity, water.' },
    { id: 4, name: 'Catering & Refreshments', description: 'Coffee, tea, snacks, or full catering for meetings.' }
  ];
  loadingCategories.value = false;
};

onMounted(() => {
  fetchServiceCategories();
  categoryModal = new Modal(document.getElementById('categoryModal'));
});

const openAddModal = () => {
  modalMode.value = 'add';
  currentCategory.value = { id: null, name: '', description: '' };
  categoryModal.show();
};

const openEditModal = (category) => {
  modalMode.value = 'edit';
  currentCategory.value = { ...category };
  categoryModal.show();
};

const handleSaveCategory = async () => {
  // Placeholder: Replace with actual API call
  if (modalMode.value === 'add') {
    console.log('Adding new category:', currentCategory.value);
    // Simulate API call
    const newId = Math.max(0, ...serviceCategories.value.map(c => c.id)) + 1;
    serviceCategories.value.push({ ...currentCategory.value, id: newId });
  } else {
    console.log('Updating category:', currentCategory.value);
    // Simulate API call
    const index = serviceCategories.value.findIndex(c => c.id === currentCategory.value.id);
    if (index !== -1) {
      serviceCategories.value[index] = { ...currentCategory.value };
    }
  }
  categoryModal.hide();
  // Optionally, re-fetch categories or update local list
};

const confirmDeleteCategory = (categoryId) => {
  if (confirm('Are you sure you want to delete this service category?')) {
    // Placeholder: Replace with actual API call
    console.log('Deleting category with id:', categoryId);
    serviceCategories.value = serviceCategories.value.filter(c => c.id !== categoryId);
    // Optionally, show a success message
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