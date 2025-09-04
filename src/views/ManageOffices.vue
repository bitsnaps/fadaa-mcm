<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as bootstrap from 'bootstrap';
import { useI18n } from 'vue-i18n';
import { getOffices, getBranches, addOffice, updateOffice, deleteOffice as deleteOfficeApi } from '@/services/OfficeService';

const router = useRouter();
const { t } = useI18n();

const offices = ref([]);
const branches = ref([]);
const searchTerm = ref('');
const selectedOffice = ref(null);
let viewOfficeModal = null;
let addEditOfficeModal = null;

const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const isEditMode = ref(false);
const validationErrors = ref({});

const officeForm = ref({
  id: null,
  name: '',
  branch_id: null,
  capacity: 1,
  amenities: '',
  status: 'Available',
  type: 'Private Suite',
});

const fetchOffices = async () => {
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: searchTerm.value,
    };
    const response = await getOffices(params);
    if (response.data.success) {
      offices.value = response.data.data;
      pagination.value = response.data.pagination;
    }
  } catch (error) {
    console.error("Failed to fetch offices:", error);
  }
};

const fetchBranches = async () => {
    try {
        const response = await getBranches();
        if(response.data.success) {
            branches.value = response.data.branches;
        }
    } catch(error) {
        console.error("Failed to fetch branches:", error);
    }
}

watch(searchTerm, () => {
    pagination.value.page = 1;
    fetchOffices();
});

onMounted(() => {
  fetchOffices();
  fetchBranches();
  const viewModalEl = document.getElementById('viewOfficeDetailsModal');
  if (viewModalEl) viewOfficeModal = new bootstrap.Modal(viewModalEl);
  const addEditModalEl = document.getElementById('addEditOfficeModal');
  if (addEditModalEl) addEditOfficeModal = new bootstrap.Modal(addEditModalEl);
});

const filteredOffices = computed(() => offices.value);

const viewOfficeDetails = (office) => {
  selectedOffice.value = office;
  if (viewOfficeModal) viewOfficeModal.show();
};

const openAddOfficeModal = () => {
  isEditMode.value = false;
  officeForm.value = { id: null, name: '', branch_id: null, capacity: 1, amenities: '', status: 'Available', type: 'Private Suite' };
  validationErrors.value = {};
  if(addEditOfficeModal) addEditOfficeModal.show();
};

const openEditOfficeModal = (office) => {
  isEditMode.value = true;
  officeForm.value = { ...office, branch_id: office.branch?.id, amenities: Array.isArray(office.amenities) ? office.amenities.join(', ') : office.amenities };
  validationErrors.value = {};
  if(addEditOfficeModal) addEditOfficeModal.show();
};

const validateForm = () => {
    const errors = {};
    if (!officeForm.value.name) errors.name = 'Office name is required.';
    if (!officeForm.value.branch_id) errors.branch_id = 'Branch is required.';
    if (!officeForm.value.status) errors.status = 'Status is required.';
    if (!officeForm.value.type) errors.type = 'Type is required.';
    validationErrors.value = errors;
    return Object.keys(errors).length === 0;
};

const saveOffice = async () => {
    if (!validateForm()) return;

  try {
    const payload = { ...officeForm.value };
    if (isEditMode.value) {
      await updateOffice(payload.id, payload);
    } else {
      await addOffice(payload);
    }
    fetchOffices();
    if(addEditOfficeModal) addEditOfficeModal.hide();
  } catch (error) {
    console.error("Failed to save office:", error);
  }
};

const deleteOffice = async (officeId) => {
  if (confirm(t('offices.confirmDeleteOffice.message', { officeName: offices.value.find(o => o.id === officeId)?.name }))) {
    try {
        await deleteOfficeApi(officeId);
        fetchOffices();
    } catch (error) {
        console.error("Failed to delete office:", error);
    }
  }
};

const changePage = (page) => {
    if(page > 0 && page <= pagination.value.totalPages) {
        pagination.value.page = page;
        fetchOffices();
    }
}
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
            <td>{{ office.branch?.name || 'N/A' }}</td>
            <td>
              <span
                :class="['badge',
                         office.status === 'Available' ? 'bg-success' :
                         office.status === 'Occupied' ? 'bg-secondary' :
                         'bg-warning text-dark']">
               {{ t(`offices.status.${office.status.toLowerCase()}`) }}
              </span>
            </td>
            <td>{{ office.capacity }}</td>
            <td>
              <button @click="viewOfficeDetails(office)" class="btn btn-sm btn-outline-info me-1" :title="t('offices.viewDetails')">
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
        <nav aria-label="Page navigation" v-if="pagination.totalPages > 1">
            <ul class="pagination justify-content-center">
                <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
                    <a class="page-link" href="#" @click.prevent="changePage(pagination.page - 1)">{{ t('dashboard.officeList.pagination.previous') }}</a>
                </li>
                <li class="page-item" v-for="page in pagination.totalPages" :key="page" :class="{ active: page === pagination.page }">
                    <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
                </li>
                <li class="page-item" :class="{ disabled: pagination.page >= pagination.totalPages }">
                    <a class="page-link" href="#" @click.prevent="changePage(pagination.page + 1)">{{ t('dashboard.officeList.pagination.next') }}</a>
                </li>
            </ul>
        </nav>
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
            <p><strong>{{ t('offices.details.branch') }}:</strong> {{ selectedOffice.branch?.name }}</p>
            <p><strong>{{ t('offices.details.status') }}:</strong> {{ t(`offices.status.${selectedOffice.status.toLowerCase()}`) }}</p>
            <p><strong>{{ t('offices.details.capacity') }}:</strong> {{ selectedOffice.capacity }}</p>
            <p><strong>{{ t('offices.details.amenities') }}:</strong> {{ selectedOffice.amenities }}</p>
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
                <label for="officeName" class="form-label">{{ t('offices.addEditOfficeModal.officeName') }} <span class="text-danger">*</span></label>
                <input type="text" class="form-control" :class="{'is-invalid': validationErrors.name}" id="officeName" v-model="officeForm.name" required>
                <div v-if="validationErrors.name" class="invalid-feedback">{{ validationErrors.name }}</div>
              </div>
              <div class="mb-3">
                <label for="officeBranch" class="form-label">{{ t('offices.addEditOfficeModal.branch') }} <span class="text-danger">*</span></label>
                <select class="form-select" :class="{'is-invalid': validationErrors.branch_id}" id="officeBranch" v-model="officeForm.branch_id" required>
                    <option :value="null" disabled>Select a branch</option>
                    <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                </select>
                <div v-if="validationErrors.branch_id" class="invalid-feedback">{{ validationErrors.branch_id }}</div>
              </div>
              <div class="mb-3">
                  <label for="officeType" class="form-label">{{ t('offices.tableHeaders.type') }} <span class="text-danger">*</span></label>
                  <select class="form-select" :class="{'is-invalid': validationErrors.type}" v-model="officeForm.type" required>
                      <option value="Private Suite">Private Suite</option>
                      <option value="Coworking Desk">Coworking Desk</option>
                      <option value="Virtual Office">Virtual Office</option>
                  </select>
                  <div v-if="validationErrors.type" class="invalid-feedback">{{ validationErrors.type }}</div>
              </div>
              <div class="mb-3">
                <label for="officeCapacity" class="form-label">{{ t('offices.addEditOfficeModal.capacity') }}</label>
                <input type="number" class="form-control" id="officeCapacity" v-model.number="officeForm.capacity" min="1">
              </div>
              <div class="mb-3">
                <label class="form-label">{{ t('offices.addEditOfficeModal.status') }} <span class="text-danger">*</span></label>
                <select class="form-select" :class="{'is-invalid': validationErrors.status}" v-model="officeForm.status" required>
                  <option value="Available">{{ t('offices.status.available') }}</option>
                  <option value="Occupied">{{ t('offices.status.occupied') }}</option>
                  <option value="Maintenance">{{ t('offices.status.maintenance') }}</option>
                  <option value="Unavailable">{{ t('offices.status.unavailable') }}</option>
                </select>
                <div v-if="validationErrors.status" class="invalid-feedback">{{ validationErrors.status }}</div>
              </div>
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