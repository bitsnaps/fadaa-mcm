<template>
  <div class="container mt-4">
    <h2 class="mb-4">{{ $t('clientServices.title') }}</h2>
    <p class="text-muted mb-4">{{ $t('clientServices.description') }}</p>

    <!-- Clients Table -->
    <div class="card shadow-sm">
      <div class="card-header bg-fadaa-light-blue d-flex justify-content-between align-items-center">
        <h5 class="mb-0">{{ $t('clientServices.clients') }}</h5>
        <div class="col-md-4">
          <input type="text" class="form-control" :placeholder="$t('clientServices.searchClientPlaceholder')" v-model="filter">
        </div>
      </div>
      <div class="card-body">
        <b-table
          :items="clients"
          :fields="fields"
          :filter="filter"
          :per-page="perPage"
          :current-page="currentPage"
          responsive
          striped
          hover
          sort-icon-left
          show-empty
        >
          <template #empty>
            <div class="text-center my-2">{{ $t('clientServices.noClientsFound') }}</div>
          </template>
          
          <template #cell(actions)="row">
            <button class="btn btn-sm btn-primary me-2" @click="openAddServiceModal(row.item)">
              <i class="bi bi-plus-circle"></i> {{ $t('clientServices.addService') }}
            </button>
            <button class="btn btn-sm btn-info" @click="openViewServicesModal(row.item)">
              <i class="bi bi-eye"></i> {{ $t('clientServices.viewServices') }}
            </button>
          </template>
        </b-table>
        <b-pagination
          v-model="currentPage"
          :total-rows="totalRows"
          :per-page="perPage"
          aria-controls="clients-table"
        ></b-pagination>
      </div>
    </div>

    <AddServiceModal :client="selectedClient" @service-added="handleServiceAdded" />
    <ClientServicesModal :client="selectedClient" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useModal } from 'bootstrap-vue-next';
import apiClient from '@/services/ApiClient';
import AddServiceModal from '@/components/AddServiceModal.vue';
import ClientServicesModal from '@/components/ClientServicesModal.vue';

const { t } = useI18n();
const addServiceModal = useModal('add-service-modal');
const viewServicesModal = useModal('client-services-modal');

const clients = ref([]);
const filter = ref('');
const currentPage = ref(1);
const perPage = ref(10);
const totalRows = computed(() => clients.value.length);
const selectedClient = ref(null);

const fields = computed(() => [
  { key: 'company_name', label: t('client.companyName'), sortable: true },
  { key: 'first_name', label: t('client.firstName'), sortable: true },
  { key: 'last_name', label: t('client.lastName'), sortable: true },
  { key: 'email', label: t('client.email'), sortable: true },
  { key: 'phone_number', label: t('client.phoneNumber'), sortable: true },
  { key: 'status', label: t('client.status'), sortable: true },
  { key: 'actions', label: t('clientServices.actions') }
]);

const fetchClients = async () => {
  try {
    const response = await apiClient.get('/clients');
    clients.value = response.data.data;
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    // Handle error appropriately, e.g., show a notification
  }
};

const openAddServiceModal = (client) => {
  selectedClient.value = client;
  addServiceModal.show();
};

const openViewServicesModal = (client) => {
  selectedClient.value = client;
  viewServicesModal.show();
};

const handleServiceAdded = () => {
  fetchClients();
};

onMounted(() => {
  fetchClients();
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