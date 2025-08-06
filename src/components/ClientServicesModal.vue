<template>
  <b-modal id="client-services-modal" :title="$t('clientServices.servicesFor') + ' ' + (client ? client.company_name : '')" size="lg">
    <div v-if="loading" class="text-center">
      <b-spinner label="Loading..."></b-spinner>
    </div>
    <div v-else>
      <b-table
        :items="services"
        :fields="fields"
        responsive
        striped
        hover
        show-empty
      >
        <template #empty>
          <div class="text-center my-2">{{ $t('clientServices.noServicesYet') }}</div>
        </template>
        <template #cell(actions)="row">
          <b-button size="sm" variant="primary" class="me-1" @click="openEditServiceModal(row.item)">
            <i class="bi bi-pencil"></i> {{ $t('clientServices.edit') }}
          </b-button>
          <b-button size="sm" variant="danger" @click="confirmRemoveService(row.item.id)">
            <i class="bi bi-trash"></i> {{ $t('clientServices.remove') }}
          </b-button>
        </template>
      </b-table>
    </div>
    <template #modal-footer="{ cancel }">
      <b-button @click="cancel()">{{ $t('manageUsers.cancel') }}</b-button>
    </template>
  </b-modal>
  <AddServiceModal ref="addServiceModalRef" :client="client" :editingService="serviceToEdit" :profileId="profileId" @service-added="fetchClientServices(client.id, profileId)" @service-updated="fetchClientServices(client.id, profileId)" />
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import apiClient from '@/services/ApiClient';
import AddServiceModal from '@/components/AddServiceModal.vue';

const { t } = useI18n();

const props = defineProps({
  client: {
    type: Object,
    default: null
  },
  profileId: {
    type: Number,
    default: null
  }
});

const services = ref([]);
const loading = ref(false);
const serviceToEdit = ref(null);
const addServiceModalRef = ref(null);

const fields = computed(() => [
  { key: 'ServiceCategory.name', label: t('clientServices.service'), sortable: true },
  { key: 'payment_type', label: t('clientServices.paymentType'), sortable: true },
  { key: 'price', label: t('clientServices.price'), sortable: true },
  { key: 'status', label: t('clientServices.status'), sortable: true },
  { key: 'notes', label: t('clientServices.notes'), sortable: true },
  { key: 'Tax.name', label: t('manageTaxes.title'), sortable: true },
  { key: 'actions', label: t('clientServices.actions') }
]);

const fetchClientServices = async (clientId, profileId) => {
  if (!clientId || !profileId) {
    services.value = [];
    return;
  }
  loading.value = true;
  try {
    const response = await apiClient.get(`/client-services/${clientId}`, { params: { profile_id: profileId } });
    services.value = response.data.services;
  } catch (error) {
    console.error('Failed to fetch client services:', error);
    services.value = [];
  } finally {
    loading.value = false;
  }
};

const confirmRemoveService = (serviceId) => {
  if (confirm(t('clientServices.confirmRemove'))) {
    removeService(serviceId);
  }
};

const removeService = async (serviceId) => {
  try {
    await apiClient.delete(`/client-services/${serviceId}`);
    fetchClientServices(props.client.id, props.profileId);
  } catch (error) {
    console.error('Failed to remove service:', error);
  }
};

watch(() => [props.client, props.profileId], ([newClient, newProfileId]) => {
  if (newClient && newProfileId) {
    fetchClientServices(newClient.id, newProfileId);
  } else {
    services.value = [];
  }
});

const openEditServiceModal = (service) => {
  serviceToEdit.value = service;
  addServiceModalRef.value.show();
};
</script>