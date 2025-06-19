<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import * as bootstrap from 'bootstrap';

const router = useRouter();

const offices = ref([]);
const searchTerm = ref('');
const selectedOffice = ref(null);
let viewOfficeModal = null;

// Mock office data - replace with API call
const mockOffices = [
  {
    id: 'off001',
    name: 'Modern Office Suite',
    branch: 'Downtown Branch',
    status: 'Available',
    capacity: 10,
    amenities: ['Wi-Fi', 'Coffee', 'Meeting Room'],
  },
  {
    id: 'off002',
    name: 'Creative Studio',
    branch: 'Tech Park Branch',
    status: 'Occupied',
    capacity: 5,
    amenities: ['Wi-Fi', 'Whiteboard'],
  },
  {
    id: 'off003',
    name: 'Executive Office',
    branch: 'Downtown Branch',
    status: 'Maintenance',
    capacity: 2,
    amenities: ['Wi-Fi', 'Printer', 'Private Restroom'],
  },
];

const fetchOffices = () => {
  setTimeout(() => {
    offices.value = mockOffices;
  }, 500);
};

onMounted(() => {
  fetchOffices();
  const modalElement = document.getElementById('viewOfficeDetailsModal');
  if (modalElement) {
    viewOfficeModal = new bootstrap.Modal(modalElement);
  }
});

const filteredOffices = computed(() => {
  if (!searchTerm.value) {
    return offices.value;
  }
  return offices.value.filter(office =>
    office.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    office.branch.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    office.status.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const viewOfficeDetails = (officeId) => {
  selectedOffice.value = offices.value.find(o => o.id === officeId);
  if (selectedOffice.value && viewOfficeModal) {
    viewOfficeModal.show();
  }
};

const editOffice = (officeId) => {
  // Placeholder for edit functionality
  console.log('Edit office:', officeId);
};

const deleteOffice = (officeId) => {
  // Placeholder for delete functionality
  console.log('Delete office:', officeId);
};

const changeOfficeStatus = (officeId, newStatus) => {
  const office = offices.value.find(o => o.id === officeId);
  if (office) {
    office.status = newStatus;
  }
};
</script>

<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Manage Coworking Offices</h2>
      <button class="btn btn-primary">
        <i class="bi bi-plus-circle me-2"></i>Add New Office
      </button>
    </div>

    <div class="mb-3">
      <input 
        type="text" 
        class="form-control" 
        v-model="searchTerm" 
        placeholder="Search offices by name, branch, or status..."
      />
    </div>

    <div v-if="filteredOffices.length > 0" class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th scope="col">#ID</th>
            <th scope="col">Name</th>
            <th scope="col">Branch</th>
            <th scope="col">Status</th>
            <th scope="col">Capacity</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="office in filteredOffices" :key="office.id">
            <td>{{ office.id }}</td>
            <td>{{ office.name }}</td>
            <td>{{ office.branch }}</td>
            <td>
              <span 
                :class="['badge', 
                         office.status === 'Available' ? 'bg-success' : 
                         office.status === 'Occupied' ? 'bg-secondary' : 
                         'bg-warning text-dark']">
                {{ office.status }}
              </span>
            </td>
            <td>{{ office.capacity }}</td>
            <td>
              <button @click="viewOfficeDetails(office.id)" class="btn btn-sm btn-outline-info me-1" title="View Details">
                <i class="bi bi-eye"></i>
              </button>
              <button @click="editOffice(office.id)" class="btn btn-sm btn-outline-warning me-1" title="Edit Office">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button @click="deleteOffice(office.id)" class="btn btn-sm btn-outline-danger" title="Delete Office">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="alert alert-info text-center" role="alert">
      No offices found.
    </div>

    <!-- View Office Details Modal -->
    <div class="modal fade" id="viewOfficeDetailsModal" tabindex="-1" aria-labelledby="viewOfficeDetailsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="viewOfficeDetailsModalLabel">Office Details: {{ selectedOffice?.name }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedOffice">
            <p><strong>ID:</strong> {{ selectedOffice.id }}</p>
            <p><strong>Name:</strong> {{ selectedOffice.name }}</p>
            <p><strong>Branch:</strong> {{ selectedOffice.branch }}</p>
            <p><strong>Status:</strong> {{ selectedOffice.status }}</p>
            <p><strong>Capacity:</strong> {{ selectedOffice.capacity }} people</p>
            <p><strong>Amenities:</strong> {{ selectedOffice.amenities.join(', ') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-hover tbody tr:hover {
  background-color: #f8f9fa;
}
</style>