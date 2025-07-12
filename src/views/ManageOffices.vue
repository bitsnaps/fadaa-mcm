<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import * as bootstrap from 'bootstrap';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();

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
    status: t('offices.status.available'),
    capacity: 10,
    amenities: [t('offices.details.amenities.wifi'), t('offices.details.amenities.coffee'), t('offices.details.amenities.meetingRoom')],
  },
  {
    id: 'off002',
    name: 'Creative Studio',
    branch: 'Tech Park Branch',
    status: t('offices.status.occupied'),
    capacity: 5,
    amenities: [t('offices.details.amenities.wifi'), t('offices.details.amenities.whiteboard')],
  },
  {
    id: 'off003',
    name: 'Executive Office',
    branch: 'Downtown Branch',
    status: t('offices.status.maintenance'),
    capacity: 2,
    amenities: [t('offices.details.amenities.wifi'), t('offices.details.amenities.printer'), t('offices.details.amenities.privateRestroom')],
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
      <h2>{{ t('offices.manageOffices') }}</h2>
      <button class="btn btn-primary">
        <i class="bi bi-plus-circle me-2"></i>{{ t('offices.addNewOffice') }}
      </button>
    </div>

    <div class="mb-3">
      <input 
        type="text" 
        class="form-control" 
        v-model="searchTerm" 
        :placeholder="t('offices.searchPlaceholder')"
      />
    </div>

    <div v-if="filteredOffices.length > 0" class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th scope="col">{{ t('offices.tableHeaders.id') }}</th>
            <th scope="col">{{ t('offices.tableHeaders.name') }}</th>
            <th scope="col">{{ t('offices.tableHeaders.branch') }}</th>
            <th scope="col">{{ t('offices.tableHeaders.status') }}</th>
            <th scope="col">{{ t('offices.tableHeaders.capacity') }}</th>
            <th scope="col">{{ t('offices.tableHeaders.actions') }}</th>
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
                         office.status === t('offices.status.available') ? 'bg-success' :
                         office.status === t('offices.status.occupied') ? 'bg-secondary' :
                         'bg-warning text-dark']">
                {{ office.status }}
              </span>
            </td>
            <td>{{ office.capacity }}</td>
            <td>
              <button @click="viewOfficeDetails(office.id)" class="btn btn-sm btn-outline-info me-1" :title="t('offices.viewDetails')">
                <i class="bi bi-eye"></i>
              </button>
              <button @click="editOffice(office.id)" class="btn btn-sm btn-outline-warning me-1" :title="t('offices.editOffice')">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button @click="deleteOffice(office.id)" class="btn btn-sm btn-outline-danger" :title="t('offices.deleteOffice')">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="alert alert-info text-center" role="alert">
      {{ t('offices.noOfficesFound') }}
    </div>

    <!-- View Office Details Modal -->
    <div class="modal fade" id="viewOfficeDetailsModal" tabindex="-1" aria-labelledby="viewOfficeDetailsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="viewOfficeDetailsModalLabel">{{ t('offices.officeDetails') }}: {{ selectedOffice?.name }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('close')"></button>
          </div>
          <div class="modal-body" v-if="selectedOffice">
            <p><strong>{{ t('offices.details.id') }}:</strong> {{ selectedOffice.id }}</p>
            <p><strong>{{ t('offices.details.name') }}:</strong> {{ selectedOffice.name }}</p>
            <p><strong>{{ t('offices.details.branch') }}:</strong> {{ selectedOffice.branch }}</p>
            <p><strong>{{ t('offices.details.status') }}:</strong> {{ selectedOffice.status }}</p>
            <p><strong>{{ t('offices.details.capacity') }}:</strong> {{ selectedOffice.capacity }} {{ t('people') }}</p>
            <p><strong>{{ t('offices.details.amenities') }}:</strong> {{ selectedOffice.amenities.join(', ') }}</p>
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