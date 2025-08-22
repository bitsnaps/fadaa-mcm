<template>
  <b-modal ref="modal" id="add-service-modal" :title="modalTitle" @hidden="resetModal" @ok.prevent="handleSubmit">
    <form>
      <div class="mb-3">
        <label for="serviceCategorySelect" class="form-label">{{ $t('clientServices.serviceCategory') }} <span class="text-danger">*</span></label>
        <select class="form-select" id="serviceCategorySelect" v-model="newService.categoryId" required>
          <option value="" disabled>{{ $t('clientServices.selectCategoryPlaceholder') }}</option>
          <option v-for="category in availableServiceCategories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
      <div class="mb-3">
        <label for="paymentType" class="form-label">{{ $t('clientServices.paymentType') }} <span class="text-danger">*</span></label>
        <select class="form-select" id="paymentType" v-model="newService.paymentType" required>
          <option value="recurrent">{{ $t('clientServices.recurrent') }}</option>
          <option value="one-shot">{{ $t('clientServices.oneShot') }}</option>
        </select>
      </div>
      <div class="mb-3">
        <label for="servicePrice" class="form-label">{{ $t('clientServices.price') }} <span class="text-danger">*</span></label>
        <input type="number" class="form-control" id="servicePrice" v-model.number="newService.price" min="0" required>
      </div>
      <div class="mb-3">
        <label for="serviceTaxes" class="form-label">{{ $t('manageTaxes.title') }}</label>
        <select class="form-select" id="serviceTaxes" v-model="newService.taxId">
            <option :value="null">-- {{ $t('manageTaxes.selectTax') }} --</option>
            <option v-for="tax in availableTaxes" :key="tax.id" :value="tax.id">
                {{ tax.name }} ({{ tax.rate }}%)
            </option>
        </select>
      </div>
      <div class="mb-3">
        <label for="status" class="form-label">{{ $t('clientServices.status') }} <span class="text-danger">*</span></label>
        <select class="form-select" id="status" v-model="newService.status" required>
          <option value="Active">{{ $t('clientServices.active') }}</option>
          <option value="Inactive">{{ $t('clientServices.inactive') }}</option>
          <option value="Cancelled">{{ $t('clientServices.cancelled') }}</option>
        </select>
      </div>
      <div class="mb-3">
        <label for="serviceNotes" class="form-label">{{ $t('clientServices.notes') }}</label>
        <textarea class="form-control" id="serviceNotes" v-model="newService.notes" rows="2"></textarea>
      </div>
    </form>
    <template #modal-footer="{ ok, cancel }">
        <b-button @click="cancel()">{{ $t('manageUsers.cancel') }}</b-button>
       <b-button variant="primary" @click="ok()" :disabled="!isFormValid">{{ props.editingService ? $t('clientServices.saveChanges') : $t('clientServices.addService') }}</b-button>
    </template>
  </b-modal>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import apiClient from '@/services/ApiClient';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const modal = ref(null);

const props = defineProps({
  client: {
    type: Object,
    default: null
  },
  editingService: {
    type: Object,
    default: null
  },
  profileId: {
    type: Number,
    default: null
  }
});

const emit = defineEmits(['service-added', 'service-updated']);

const newService = ref({
  categoryId: '',
  paymentType: 'recurrent',
  price: 0,
  notes: '',
  status: 'Active',
  taxId: null
});

const availableServiceCategories = ref([]);
const availableTaxes = ref([]);

const modalTitle = computed(() => {
  return props.editingService
    ? t('clientServices.editService')
    : t('clientServices.addNewService');
});

const isFormValid = computed(() => {
  return newService.value.categoryId && newService.value.price > 0;
});


const fetchServiceCategories = async () => {
  try {
    const response = await apiClient.get('/service-categories');
    availableServiceCategories.value = response.data.data;
  } catch (error) {
    console.error('Failed to fetch service categories:', error);
  }
};

const fetchTaxes = async () => {
  try {
    const response = await apiClient.get('/taxes');
    availableTaxes.value = response.data.taxes;
  } catch (error) {
    console.error('Failed to fetch taxes:', error);
  }
};

const resetModal = () => {
  if (props.editingService) {
    newService.value = { ...props.editingService };
  } else {
    newService.value = {
      categoryId: '',
      paymentType: 'recurrent',
      price: 0,
      notes: '',
      status: 'Active',
      taxId: null
    };
  }
};

defineExpose({
  show: () => modal.value.show()
});

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    const payload = {
      ...newService.value,
      profile_id: props.profileId
    };
    if (props.editingService) {
      await apiClient.put(`/client-services/${props.editingService.id}`, payload);
      emit('service-updated');
    } else {
      await apiClient.post(`/client-services/${props.client.id}`, payload);
      emit('service-added');
    }
    modal.value.hide();
  } catch (error) {
    console.error('Failed to save service:', error);
  }
};

onMounted(() => {
  fetchServiceCategories();
  fetchTaxes();
});

watch(() => props.client, (newClient) => {
  if (newClient) {
    resetModal();
  }
});

watch(() => props.editingService, (newVal) => {
  if (newVal) {
    newService.value = {
      id: newVal.id,
      categoryId: newVal.service_category_id,
      paymentType: newVal.payment_type,
      price: newVal.price,
      notes: newVal.notes,
      status: newVal.status,
      taxId: newVal.taxId
    };
  } else {
    resetModal();
  }
}, { immediate: true });
</script>