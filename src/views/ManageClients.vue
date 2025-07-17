<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import * as bootstrap from 'bootstrap';
import { useI18n } from 'vue-i18n';
import apiClient from '@/services/ApiClient';
import { formatDate } from '@/helpers/utils';

const { t } = useI18n();
const router = useRouter();

const clients = ref([]);
const searchTerm = ref('');
const selectedClient = ref(null);
let viewClientModal = null;

const fetchClients = async () => {
  try {
    const response = await apiClient.get('/clients');
    if (response.data.success) {
      clients.value = response.data.data;
    }
  } catch (error) {
    console.error("Failed to fetch clients:", error);
  }
};

onMounted(() => {
  fetchClients();
  const modalElement = document.getElementById('viewClientDetailsModal');
  if (modalElement) {
    viewClientModal = new bootstrap.Modal(modalElement);
  }
});

const filteredClients = computed(() => {
  if (!searchTerm.value) {
    return clients.value;
  }
  const lowerSearchTerm = searchTerm.value.toLowerCase();
  return clients.value.filter(client =>
    (client.company_name && client.company_name.toLowerCase().includes(lowerSearchTerm)) ||
    (client.first_name && client.first_name.toLowerCase().includes(lowerSearchTerm)) ||
    (client.last_name && client.last_name.toLowerCase().includes(lowerSearchTerm)) ||
    (client.email && client.email.toLowerCase().includes(lowerSearchTerm)) ||
    (client.phone_number && client.phone_number.toLowerCase().includes(lowerSearchTerm)) ||
    (client.status && client.status.toLowerCase().includes(lowerSearchTerm))
  );
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
  console.log('Manage services for client:', clientId);
  router.push({ name: 'ManageClientServices', query: { clientId } });
};

const deleteClient = async (clientId) => {
    if(confirm(t('manageClients.confirmDelete'))) {
        try {
            await apiClient.delete(`/clients/${clientId}`);
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

    <div class="mb-3">
      <input 
        type="text" 
        class="form-control" 
        v-model="searchTerm" 
        :placeholder="$t('manageClients.searchPlaceholder')"
      />
    </div>

    <div v-if="filteredClients.length > 0" class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th scope="col">{{ $t('manageClients.idHeader') }}</th>
            <th scope="col">{{ $t('manageClients.companyName') }}</th>
            <th scope="col">{{ $t('manageClients.emailHeader') }}</th>
            <th scope="col">{{ $t('manageClients.phoneHeader') }}</th>
            <th scope="col">{{ $t('manageClients.statusHeader') }}</th>
            <th scope="col">{{ $t('manageClients.actionsHeader') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in filteredClients" :key="client.id">
            <td>{{ client.id }}</td>
            <td>{{ client.company_name }}</td>
            <td>{{ client.email }}</td>
            <td>{{ client.phone_number }}</td>
            <td>
              <span 
                :class="['badge', 
                         client.status === 'Active' ? 'bg-success' : 
                         client.status === 'Inactive' ? 'bg-secondary' : 
                         'bg-warning text-dark']">
                {{ client.status === 'Active' ? $t('manageClients.statusActive') : client.status === 'Inactive' ? $t('manageClients.statusInactive') : $t('manageClients.statusPending') }}
              </span>
            </td>
            <td>
              <button @click="viewClientDetails(client)" class="btn btn-sm btn-outline-info me-1" :title="$t('manageClients.viewDetails')">
                <i class="bi bi-eye"></i>
              </button>
              <button @click="editClient(client.id)" class="btn btn-sm btn-outline-warning me-1" :title="$t('manageClients.editClient')">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button @click="manageClientServices(client.id)" class="btn btn-sm btn-outline-primary" :title="$t('manageClients.manageServices')">
               <i class="bi bi-gear"></i>
             </button>
             <button @click="deleteClient(client.id)" class="btn btn-sm btn-outline-danger" :title="$t('manageClients.deleteClient')">
               <i class="bi bi-trash"></i>
             </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="alert alert-info text-center" role="alert">
      <div v-if="searchTerm && filteredClients.length === 0">
        {{ $t('manageClients.noClientsFoundSearch', { searchTerm: searchTerm }) }}
      </div>
      <div v-else>
        {{ $t('manageClients.noClientsAvailable') }} <router-link to="/add-client">{{ $t('manageClients.addClientLink') }}</router-link> to get started.
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