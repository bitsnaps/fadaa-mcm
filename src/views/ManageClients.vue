<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import * as bootstrap from 'bootstrap'; // Import bootstrap for modal

const router = useRouter();

const clients = ref([]);
const searchTerm = ref('');
const selectedClient = ref(null);
let viewClientModal = null;

// Mock client data - replace with API call
const mockClients = [
  {
    id: 'cli001',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-1234',
    status: 'Active',
    address: '123 Main St, Anytown, USA',
    registrationDate: '2023-01-15',
    type: 'Individual',
  },
  {
    id: 'cli002',
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '555-5678',
    status: 'Inactive',
    address: '456 Oak Ave, Otherville, USA',
    registrationDate: '2022-11-30',
    type: 'Corporate',
  },
  {
    id: 'cli003',
    fullName: 'Alice Brown',
    email: 'alice.brown@example.com',
    phone: '555-8765',
    status: 'Active',
    address: '789 Pine Ln, Sometown, USA',
    registrationDate: '2023-03-01',
    type: 'Individual',
  },
  {
    id: 'cli004',
    fullName: 'Robert Green',
    email: 'robert.green@example.com',
    phone: '555-4321',
    status: 'Pending',
    address: '101 Maple Dr, Yourtown, USA',
    registrationDate: '2023-05-20',
    type: 'Corporate',
  },
];

const fetchClients = () => {
  // Simulate API call
  setTimeout(() => {
    clients.value = mockClients;
  }, 500);
};

onMounted(() => {
  fetchClients();
  // Initialize modal instance
  const modalElement = document.getElementById('viewClientDetailsModal');
  if (modalElement) {
    viewClientModal = new bootstrap.Modal(modalElement);
  }
});

const filteredClients = computed(() => {
  if (!searchTerm.value) {
    return clients.value;
  }
  return clients.value.filter(client =>
    client.fullName.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    client.status.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const viewClientDetails = (clientId) => {
  selectedClient.value = clients.value.find(c => c.id === clientId);
  if (selectedClient.value && viewClientModal) {
    viewClientModal.show();
  }
};

const editClient = (clientId) => {
  router.push({ name: 'AddClient', params: { clientId } });
};

const manageClientServices = (clientId) => {
  console.log('Manage services for client:', clientId);
  router.push({ name: 'ManageClientServices', query: { clientId } });
};

</script>

<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Manage Clients</h2>
      <router-link to="/add-client" class="btn btn-primary">
        <i class="bi bi-plus-circle me-2"></i>Add New Client
      </router-link>
    </div>

    <div class="mb-3">
      <input 
        type="text" 
        class="form-control" 
        v-model="searchTerm" 
        placeholder="Search clients by name, email, phone, or status..."
      />
    </div>

    <div v-if="filteredClients.length > 0" class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th scope="col">#ID</th>
            <th scope="col">Full Name</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in filteredClients" :key="client.id">
            <td>{{ client.id }}</td>
            <td>{{ client.fullName }}</td>
            <td>{{ client.email }}</td>
            <td>{{ client.phone }}</td>
            <td>
              <span 
                :class="['badge', 
                         client.status === 'Active' ? 'bg-success' : 
                         client.status === 'Inactive' ? 'bg-secondary' : 
                         'bg-warning text-dark']">
                {{ client.status }}
              </span>
            </td>
            <td>
              <button @click="viewClientDetails(client.id)" class="btn btn-sm btn-outline-info me-1" title="View Details">
                <i class="bi bi-eye"></i>
              </button>
              <button @click="editClient(client.id)" class="btn btn-sm btn-outline-warning me-1" title="Edit Client">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button @click="manageClientServices(client.id)" class="btn btn-sm btn-outline-primary" title="Manage Services">
                <i class="bi bi-gear"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="alert alert-info text-center" role="alert">
      <div v-if="searchTerm && filteredClients.length === 0">
        No clients found matching your search criteria "<strong>{{ searchTerm }}</strong>".
      </div>
      <div v-else>
        No clients available. <router-link to="/add-client">Add a new client</router-link> to get started.
      </div>
    </div>

    <!-- View Client Details Modal -->
    <div class="modal fade" id="viewClientDetailsModal" tabindex="-1" aria-labelledby="viewClientDetailsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="viewClientDetailsModalLabel">Client Details: {{ selectedClient?.fullName }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedClient">
            <div class="row">
              <div class="col-md-6">
                <p><strong>ID:</strong> {{ selectedClient.id }}</p>
                <p><strong>Full Name:</strong> {{ selectedClient.fullName }}</p>
                <p><strong>Email:</strong> {{ selectedClient.email }}</p>
                <p><strong>Phone:</strong> {{ selectedClient.phone }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Status:</strong> 
                  <span 
                    :class="['badge', 
                             selectedClient.status === 'Active' ? 'bg-success' : 
                             selectedClient.status === 'Inactive' ? 'bg-secondary' : 
                             'bg-warning text-dark']">
                    {{ selectedClient.status }}
                  </span>
                </p>
                <p><strong>Address:</strong> {{ selectedClient.address }}</p>
                <p><strong>Registration Date:</strong> {{ selectedClient.registrationDate }}</p>
                <p><strong>Client Type:</strong> {{ selectedClient.type }}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-warning" @click="editClient(selectedClient.id); viewClientModal.hide();">Edit Client</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.table th, .table td {
  vertical-align: middle;
}

.badge {
  font-size: 0.85em;
}
</style>