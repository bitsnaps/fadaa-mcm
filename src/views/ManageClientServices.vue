<template>
  <div class="container mt-4">
    <h2>Manage Client Services</h2>
    <p class="text-muted">Assistants can assign and manage services for specific clients.</p>

    <!-- Client Selection -->
    <div class="row mb-4">
      <div class="col-md-6">
        <label for="clientSelect" class="form-label">Select Client</label>
        <select class="form-select" id="clientSelect" v-model="selectedClientId" @change="loadClientServices">
          <option value="" disabled>-- Select a Client --</option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.firstName }} {{ client.lastName }} ({{ client.companyName }})
          </option>
        </select>
      </div>
    </div>

    <div v-if="selectedClientId && !loadingClientData">
      <h4>Services for {{ selectedClientName }}</h4>
      
      <!-- Add Service Section -->
      <div class="card mb-4 shadow-sm">
        <div class="card-header bg-fadaa-light-blue">
          <h5 class="mb-0">Add New Service</h5>
        </div>
        <div class="card-body">
          <form @submit.prevent="handleAddServiceToClient">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="serviceCategorySelect" class="form-label">Service Category <span class="text-danger">*</span></label>
                <select class="form-select" id="serviceCategorySelect" v-model="newService.categoryId" required>
                  <option value="" disabled>-- Select Category --</option>
                  <option v-for="category in availableServiceCategories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>
              <div class="col-md-3 mb-3">
                <label for="paymentType" class="form-label">Payment Type <span class="text-danger">*</span></label>
                <select class="form-select" id="paymentType" v-model="newService.paymentType" required>
                  <option value="recurrent">Recurrent</option>
                  <option value="one-shot">One-Shot</option>
                </select>
              </div>
              <div class="col-md-3 mb-3">
                <label for="servicePrice" class="form-label">Price (DZD) <span class="text-danger">*</span></label>
                <input type="number" class="form-control" id="servicePrice" v-model.number="newService.price" min="0" required>
              </div>
              <div class="col-md-2 d-flex align-items-end mb-3">
                <button type="submit" class="btn btn-primary btn-fadaa-primary w-100">Add Service</button>
              </div>
            </div>
             <div class="mb-3">
                <label for="serviceNotes" class="form-label">Notes</label>
                <textarea class="form-control" id="serviceNotes" v-model="newService.notes" rows="2"></textarea>
              </div>
          </form>
        </div>
      </div>

      <!-- Current Client Services Table -->
      <h5>Current Services</h5>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-fadaa-primary">
            <tr>
              <th scope="col">Service Name</th>
              <th scope="col">Category</th>
              <th scope="col">Payment Type</th>
              <th scope="col">Price (DZD)</th>
              <th scope="col">Status</th>
              <th scope="col">Notes</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="clientServices.length === 0">
              <td colspan="7" class="text-center">This client has no active services.</td>
            </tr>
            <tr v-for="service in clientServices" :key="service.id">
              <td>{{ getCategoryName(service.categoryId) }}</td> <!-- Assuming service name is category name for now -->
              <td>{{ getCategoryName(service.categoryId) }}</td>
              <td class="text-capitalize">{{ service.paymentType }}</td>
              <td>{{ service.price.toFixed(2) }}</td>
              <td><span :class="['badge', service.isActive ? 'bg-success' : 'bg-secondary']">{{ service.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td>{{ service.notes }}</td>
              <td>
                <button class="btn btn-sm btn-outline-danger" @click="confirmRemoveService(service.id)">
                  <i class="bi bi-trash"></i> Remove
                </button>
                <!-- Add edit/toggle active status later if needed -->
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else-if="loadingClientData" class="text-center mt-5">
      <div class="spinner-border text-fadaa-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading client data...</p>
    </div>
     <div v-else class="alert alert-info mt-4" role="alert">
      Please select a client to view and manage their services.
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
// import { useAuthStore } from '@/stores/auth';
// import apiClient from '@/services/ApiClient';

// const authStore = useAuthStore();

const clients = ref([]);
const selectedClientId = ref('');
const clientServices = ref([]);
const availableServiceCategories = ref([]);
const loadingClientData = ref(false);

const newService = ref({
  categoryId: '',
  paymentType: 'recurrent',
  price: 0,
  notes: ''
});

const selectedClientName = computed(() => {
  const client = clients.value.find(c => c.id === selectedClientId.value);
  return client ? `${client.firstName} ${client.lastName}` : '';
});

const fetchClients = async () => {
  // Placeholder: API call to get clients
  console.log('Fetching clients...');
  await new Promise(resolve => setTimeout(resolve, 500));
  clients.value = [
    { id: 1, firstName: 'Ahmed', lastName: 'Benali', companyName: 'Tech Solutions Inc.' },
    { id: 2, firstName: 'Fatima', lastName: 'Zahra', companyName: 'Global Exports Co.' },
    { id: 3, firstName: 'Youssef', lastName: 'Cherif', companyName: 'Creative Minds Agency' }
  ];
};

const fetchServiceCategories = async () => {
  // Placeholder: API call to get service categories
  console.log('Fetching available service categories...');
  await new Promise(resolve => setTimeout(resolve, 500));
  availableServiceCategories.value = [
    { id: 1, name: 'Equipment Rental', description: 'Rental of office equipment.' },
    { id: 2, name: 'Cleaning Services', description: 'Office cleaning.' },
    { id: 3, name: 'Utilities', description: 'Internet, electricity, etc.' },
    { id: 4, name: 'Catering & Refreshments', description: 'Coffee, snacks, catering.' }
  ];
};

const loadClientServices = async () => {
  if (!selectedClientId.value) {
    clientServices.value = [];
    return;
  }
  loadingClientData.value = true;
  console.log(`Fetching services for client ID: ${selectedClientId.value}`);
  // Placeholder: API call to get services for the selected client
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Sample data based on client ID
  if (selectedClientId.value === 1) {
    clientServices.value = [
      { id: 101, categoryId: 3, paymentType: 'recurrent', price: 5000, isActive: true, notes: 'High-speed internet' },
      { id: 102, categoryId: 2, paymentType: 'recurrent', price: 15000, isActive: true, notes: 'Daily cleaning' }
    ];
  } else if (selectedClientId.value === 2) {
    clientServices.value = [
      { id: 201, categoryId: 1, paymentType: 'one-shot', price: 20000, isActive: true, notes: 'Projector for event' }
    ];
  } else {
    clientServices.value = [];
  }
  loadingClientData.value = false;
};

const getCategoryName = (categoryId) => {
  const category = availableServiceCategories.value.find(cat => cat.id === categoryId);
  return category ? category.name : 'Unknown Category';
};

const handleAddServiceToClient = async () => {
  if (!selectedClientId.value || !newService.value.categoryId) {
    alert('Please select a client and a service category.');
    return;
  }
  console.log('Adding service to client:', selectedClientId.value, newService.value);
  // Placeholder: API call to add service to client
  const serviceToAdd = {
    id: Math.floor(Math.random() * 1000) + 300, // temp ID
    ...newService.value,
    isActive: true
  };
  clientServices.value.push(serviceToAdd);
  // Reset form
  newService.value = { categoryId: '', paymentType: 'recurrent', price: 0, notes: '' };
  alert('Service added successfully (mock).');
};

const confirmRemoveService = (serviceId) => {
  if (confirm('Are you sure you want to remove this service from the client?')) {
    console.log('Removing service ID:', serviceId, 'from client ID:', selectedClientId.value);
    // Placeholder: API call to remove service
    clientServices.value = clientServices.value.filter(s => s.id !== serviceId);
    alert('Service removed successfully (mock).');
  }
};

onMounted(() => {
  fetchClients();
  fetchServiceCategories();
});

</script>

<style scoped>
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
.bg-fadaa-light-blue {
  background-color: var(--fadaa-light-blue) !important;
}
.text-fadaa-primary {
    color: var(--fadaa-blue) !important;
}
</style>