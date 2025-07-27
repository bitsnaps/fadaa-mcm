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
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import apiClient from '@/services/ApiClient';

const { t } = useI18n();

const props = defineProps({
  client: {
    type: Object,
    default: null
  }
});

const services = ref([]);
const loading = ref(false);

const fields = computed(() => [
  { key: 'ServiceCategory.name', label: t('clientServices.service'), sortable: true },
  { key: 'payment_type', label: t('clientServices.paymentType'), sortable: true },
  { key: 'price', label: t('clientServices.price'), sortable: true },
  { key: 'status', label: t('clientServices.status'), sortable: true },
  { key: 'notes', label: t('clientServices.notes'), sortable: true },
  { key: 'actions', label: t('clientServices.actions') }
]);

const fetchClientServices = async (clientId) => {
  if (!clientId) return;
  loading.value = true;
  try {
    const response = await apiClient.get(`/client-services/${clientId}`);
    services.value = response.data.services;
  } catch (error) {
    console.error('Failed to fetch client services:', error);
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
    fetchClientServices(props.client.id);
  } catch (error) {
    console.error('Failed to remove service:', error);
  }
};

watch(() => props.client, (newClient) => {
  if (newClient) {
    fetchClientServices(newClient.id);
  }
});
</script>