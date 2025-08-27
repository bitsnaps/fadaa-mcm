<template>
  <div class="container mt-4">
    <h2 class="mb-4">{{ $t('clientServices.title') }}</h2>

    <ProfileTabs @update:activeProfile="onProfileChange">
      <template #default="{ profileId }">
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

              <template #cell(total_services)="row">
                <span class="badge bg-primary">{{ row.item.total_services || 0 }}</span>
              </template>

              <template #cell(total_amount_without_taxes)="row">
                <span class="fw-bold text-info">{{ formatCurrency(row.item.total_amount_without_taxes || 0, '') }}</span>
              </template>

              <template #cell(total_amount_with_taxes)="row">
                <span class="fw-bold text-success">{{ formatCurrency(row.item.total_amount_with_taxes || 0, '') }}</span>
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
      </template>
    </ProfileTabs>

    <AddServiceModal :client="selectedClient" :profileId="activeProfileId" @service-added="fetchClients" />
    <ClientServicesModal :client="selectedClient" :profileId="activeProfileId" @service-updated="fetchClients" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useModal } from 'bootstrap-vue-next';
import apiClient from '@/services/ApiClient';
import AddServiceModal from '@/components/AddServiceModal.vue';
import ClientServicesModal from '@/components/ClientServicesModal.vue';
import ProfileTabs from '@/components/ProfileTabs.vue';
import { formatCurrency } from '@/helpers/utils.js';

const { t } = useI18n();
const addServiceModal = useModal('add-service-modal');
const viewServicesModal = useModal('client-services-modal');

const clients = ref([]);
const filter = ref('');
const currentPage = ref(1);
const perPage = ref(10);
const totalRows = computed(() => clients.value.length);
const selectedClient = ref(null);
const activeProfileId = ref(null);

const fields = computed(() => [
  { key: 'company_name', label: t('client.companyName'), sortable: true },
  { key: 'first_name', label: t('client.firstName'), sortable: true },
  { key: 'last_name', label: t('client.lastName'), sortable: true },
  { key: 'email', label: t('client.email'), sortable: true },
  { key: 'phone_number', label: t('client.phoneNumber'), sortable: true },
  { key: 'status', label: t('client.status'), sortable: true },
  { key: 'total_services', label: t('clientServices.totalServices'), sortable: true },
  { key: 'total_amount_without_taxes', label: t('clientServices.totalAmountWithoutTaxes'), sortable: true },
  { key: 'total_amount_with_taxes', label: t('clientServices.totalAmountWithTaxes'), sortable: true },
  { key: 'actions', label: t('clientServices.actions') }
]);

const fetchClients = async () => {
  try {
    const params = {};
    if (activeProfileId.value) {
      params.profile_id = activeProfileId.value;
    }
    const response = await apiClient.get('/clients', { params });
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

const onProfileChange = (profileId) => {
  activeProfileId.value = profileId;
  fetchClients();
  // Data related to a specific profile is in the modals, not on this main page
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