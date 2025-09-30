<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { BTable, BPagination } from 'bootstrap-vue-next';
import * as bootstrap from 'bootstrap';
import { useI18n } from 'vue-i18n';
import { getClients, deleteClient } from '@/services/ClientService';
import { getBranchesWithContracts } from '@/services/BranchService';
import { formatDate } from '@/helpers/utils';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const clients = ref([]);
const branches = ref([]);
const selectedBranch = ref(null);
const searchTerm = ref('');
const selectedClient = ref(null);
let viewClientModal = null;
const totalRows = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isLoading = ref(true);

const tableFields = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'company_name', label: 'Company Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone_number', label: 'Phone', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions' }
];

const fetchClients = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: itemsPerPage.value,
      q: searchTerm.value,
      branchId: selectedBranch.value
    };
    const response = await getClients(params);
    if (response.data.success) {
      clients.value = response.data.items;
      totalRows.value = response.data.total;
    }
  } catch (error) {
    console.error("Failed to fetch clients:", error);
  } finally {
    isLoading.value = false;
  }
};

const fetchBranches = async () => {
  try {
    const response = await getBranchesWithContracts();
    if (response.data.success) {
      branches.value = response.data.data;
    }
  } catch (error) {
    console.error("Failed to fetch branches:", error);
  }
};

const applyBranchFilter = () => {
  currentPage.value = 1;
  fetchClients();
};

watch([currentPage, searchTerm, selectedBranch], fetchClients, { deep: true });


onMounted(() => {
  fetchClients();
  fetchBranches();
  const modalElement = document.getElementById('viewClientDetailsModal');
  if (modalElement) {
    viewClientModal = new bootstrap.Modal(modalElement);
  }
});

const viewClientDetails = (client) => {
  selectedClient.value = client;
  if (selectedClient.value && viewClientModal) {
    viewClientModal.show();
  }
};

const editClient = (clientId) => {
  router.push({ name: 'EditClient', params: { clientId } });
};

const manageClientServices = (clientId) => {
  router.push({ name: 'ManageClientServices', query: { clientId } });
};

const removeClient = async (clientId) => {
    if(confirm(t('manageClients.confirmDelete'))) {
        try {
            await deleteClient(clientId);
            fetchClients();
        } catch (error) {
            console.error('Failed to delete client:', error);
        }
    }
};

</script>

<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ $t('manageClients.title') }}</h2>
      <router-link to="/add-client" class="btn btn-primary">
        <i class="bi bi-plus-circle me-2"></i>{{ $t('manageClients.addNewClient') }}
      </router-link>
    </div>

    <div class="row mb-3">
      <div class="col-md-8">
        <input
          type="text"
          class="form-control"
          v-model="searchTerm"
          :placeholder="$t('manageClients.searchPlaceholder')"
        />
      </div>
      <div class="col-md-4" v-if="authStore && authStore.userRole == 'admin'">
        <select class="form-select" v-model="selectedBranch" @change="applyBranchFilter">
          <option :value="null">{{ $t('manageClients.allBranches') }}</option>
          <option v-for="branch in branches" :key="branch.id" :value="branch.id">
            {{ branch.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else>
      <BTable
        :items="clients"
        :fields="tableFields"
        striped
        hover
        responsive
        show-empty
        :empty-text="$t('manageClients.noClientsFound')"
      >
        <template #cell(status)="data">
          <span
            :class="['badge',
                     data.value === 'Active' ? 'bg-success' :
                     data.value === 'Inactive' ? 'bg-secondary' :
                     'bg-warning text-dark']"
          >
            {{ $t(`manageClients.statuses.${data.value.toLowerCase()}`) }}
          </span>
        </template>
        <template #cell(actions)="data">
          <button @click="viewClientDetails(data.item)" class="btn btn-sm btn-outline-info me-1" :title="$t('manageClients.viewDetails')">
            <i class="bi bi-eye"></i>
          </button>
          <button @click="editClient(data.item.id)" class="btn btn-sm btn-outline-warning me-1" :title="$t('manageClients.editClient')">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button @click="manageClientServices(data.item.id)" class="btn btn-sm btn-outline-primary" :title="$t('manageClients.manageServices')">
            <i class="bi bi-gear"></i>
          </button>
          <button @click="removeClient(data.item.id)" class="btn btn-sm btn-outline-danger" :title="$t('manageClients.deleteClient')">
            <i class="bi bi-trash"></i>
          </button>
        </template>
      </BTable>
      <div class="d-flex justify-content-center mt-4" v-if="totalRows > itemsPerPage">
        <BPagination
          v-model="currentPage"
          :total-rows="totalRows"
          :per-page="itemsPerPage"
        />
      </div>
    </div>

    <!-- View Client Details Modal -->
    <div class="modal fade" id="viewClientDetailsModal" tabindex="-1" aria-labelledby="viewClientDetailsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="viewClientDetailsModalLabel">{{ $t('manageClients.clientDetailsTitle', { companyName: selectedClient?.company_name }) }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedClient">
            <div class="row">
              <div class="col-md-6">
                <h5>{{ t('manageClients.companyInformation') }}</h5>
                <p><strong>{{ $t('manageClients.detailsId') }}</strong> {{ selectedClient.id }}</p>
                <p><strong>{{ $t('manageClients.companyName') }}</strong> {{ selectedClient.company_name }}</p>
                <p><strong>{{ $t('manageClients.detailsEmail') }}</strong> {{ selectedClient.email }}</p>
                <p><strong>{{ $t('manageClients.detailsPhone') }}</strong> {{ selectedClient.phone_number || 'N/A' }}</p>
                <p><strong>{{ $t('manageClients.detailsAddress') }}</strong> {{ selectedClient.address || 'N/A' }}</p>
              </div>
              <div class="col-md-6">
                <h5>{{ t('manageClients.contactPersonInformation') }}</h5>
                <p><strong>{{ $t('manageClients.contactName') }}</strong> {{ selectedClient.contact_person_name || `${selectedClient.first_name} ${selectedClient.last_name}` }}</p>
                <p><strong>{{ $t('manageClients.detailsEmail') }}</strong> {{ selectedClient.contact_person_email }}</p>
                <p><strong>{{ $t('manageClients.detailsPhone') }}</strong> {{ selectedClient.contact_person_phone }}</p>
                <hr>
                <p><strong>{{ $t('manageClients.detailsStatus') }}</strong>
                  <span
                    :class="['badge',
                             selectedClient.status === 'Active' ? 'bg-success' :
                             selectedClient.status === 'Inactive' ? 'bg-secondary' :
                              'bg-warning text-dark']">
                    {{ $t(`manageClients.statuses.${selectedClient.status.toLowerCase()}`) }}
                  </span>
                </p>
                <p><strong>{{ $t('manageClients.detailsRegistrationDate') }}</strong> {{ formatDate(selectedClient.created_at) }}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t('manageClients.close') }}</button>
            <button type="button" class="btn btn-warning" @click="editClient(selectedClient.id); if(viewClientModal) viewClientModal.hide();">{{ $t('manageClients.editClient') }}</button>
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