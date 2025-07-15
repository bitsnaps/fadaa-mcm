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
let addEditOfficeModal = null;

const isEditMode = ref(false);
const officeForm = ref({
  id: null,
  name: '',
  branch: '',
  capacity: 0,
  amenities: [],
  status: '',
});

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
    offices.value = mockOffices.map(o => ({...o})); // Create copies to avoid direct mutation
  }, 500);
};

onMounted(() => {
  fetchOffices();
  const viewModalEl = document.getElementById('viewOfficeDetailsModal');
  if (viewModalEl) {
    viewOfficeModal = new bootstrap.Modal(viewModalEl);
  }
  const addEditModalEl = document.getElementById('addEditOfficeModal');
  if (addEditModalEl) {
    addEditOfficeModal = new bootstrap.Modal(addEditModalEl);
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

const openAddOfficeModal = () => {
  isEditMode.value = false;
  officeForm.value = { id: null, name: '', branch: '', capacity: 1, amenities: [], status: t('offices.status.available') };
  addEditOfficeModal.show();
};

const openEditOfficeModal = (office) => {
  isEditMode.value = true;
  officeForm.value = { ...office };
  addEditOfficeModal.show();
};

const saveOffice = () => {
  if (isEditMode.value) {
    // Edit existing office
    const index = offices.value.findIndex(o => o.id === officeForm.value.id);
    if (index !== -1) {
      offices.value[index] = { ...officeForm.value };
    }
  } else {
    // Add new office
    const newOffice = {
      ...officeForm.value,
      id: `off${String(Date.now()).slice(-3)}${offices.value.length + 1}`,
    };
    offices.value.unshift(newOffice);
  }
  addEditOfficeModal.hide();
};


const deleteOffice = (officeId) => {
  if (confirm(t('offices.confirmDeleteOffice.message', { officeName: offices.value.find(o => o.id === officeId)?.name }))) {
    const index = offices.value.findIndex(o => o.id === officeId);
    if (index !== -1) {
      offices.value.splice(index, 1);
    }
  }
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
      <button class="btn btn-primary" @click="openAddOfficeModal">
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
              <button @click="openEditOfficeModal(office)" class="btn btn-sm btn-outline-warning me-1" :title="t('offices.editOffice')">
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
            <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('offices.addEditOfficeModal.close')"></button>
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
        <!-- Add/Edit Office Modal -->
    <div class="modal fade" id="addEditOfficeModal" tabindex="-1" aria-labelledby="addEditOfficeModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addEditOfficeModalLabel">
              {{ isEditMode ? t('offices.addEditOfficeModal.editTitle') : t('offices.addEditOfficeModal.addTitle') }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('offices.addEditOfficeModal.close')"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveOffice">
              <div class="mb-3">
                <label for="officeName" class="form-label">{{ t('offices.addEditOfficeModal.officeName') }}</label>
                <input type="text" class="form-control" id="officeName" v-model="officeForm.name" required>
              </div>
              <div class="mb-3">
                <label for="officeBranch" class="form-label">{{ t('offices.addEditOfficeModal.branch') }}</label>
                <input type="text" class="form-control" id="officeBranch" v-model="officeForm.branch" required>
              </div>
              <div class="mb-3">
                <label for="officeCapacity" class="form-label">{{ t('offices.addEditOfficeModal.capacity') }}</label>
                <input type="number" class="form-control" id="officeCapacity" v-model.number="officeForm.capacity" min="1" required>
              </div>
              <div class="mb-3">
                <label class="form-label">{{ t('offices.addEditOfficeModal.status') }}</label>
                <select class="form-select" v-model="officeForm.status">
                  <option :value="t('offices.status.available')">{{ t('offices.status.available') }}</option>
                  <option :value="t('offices.status.occupied')">{{ t('offices.status.occupied') }}</option>
                  <option :value="t('offices.status.maintenance')">{{ t('offices.status.maintenance') }}</option>
                </select>
              </div>
               <!-- Simple text input for amenities for now -->
              <div class="mb-3">
                <label for="officeAmenities" class="form-label">{{ t('offices.addEditOfficeModal.amenities') }}</label>
                <input type="text" class="form-control" id="officeAmenities" v-model="officeForm.amenities" :placeholder="t('offices.amenities.wifi') + ', ' + t('offices.amenities.coffee')">
                 <small class="form-text text-muted">Comma-separated values.</small>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('offices.addEditOfficeModal.close') }}</button>
            <button type="button" class="btn btn-primary" @click="saveOffice">
              {{ isEditMode ? t('offices.addEditOfficeModal.save') : t('offices.addEditOfficeModal.add') }}
            </button>
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