<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import apiClient from '@/services/ApiClient';
import { useVuelidate } from '@vuelidate/core';
import { required, email } from '@vuelidate/validators';
import { useFilePreview } from '@/composables/useFilePreview';
import FilePreview from '@/components/FilePreview.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const clientId = ref(route.params.clientId || null);
const { selectedFile, openPreviewModal } = useFilePreview();

const client = ref({
  company_name: '',
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  address: '',
  status: 'Active',
  client_type: '',
  id_type: '',
  id_number: '',
  id_expiry_date: '',
  tax_id: '',
  nis: '',
  rc_number: '',
  contact_person_name: '',
  contact_person_email: '',
  contact_person_phone: '',
  attachments: [],
});

const rules = computed(() => ({
  company_name: { required },
  first_name: { required },
  last_name: { required },
  email: { email },
  phone_number: { required },
}));

const v$ = useVuelidate(rules, client);
const errors = ref({});

const pageTitle = computed(() => clientId.value ? t('addClient.editTitle') : t('addClient.addTitle'));
const submitButtonText = computed(() => clientId.value ? t('addClient.submitButtonUpdate') : t('addClient.submitButtonAdd'));

onMounted(async () => {
  if (clientId.value) {
    try {
        const response = await apiClient.get(`/clients/${clientId.value}`);
        if(response.data.success) {
            client.value = response.data.data;
            if (!client.value.attachments) {
              client.value.attachments = [];
            }
        } else {
            console.error(t('addClient.messages.clientNotFound'));
            router.push('/manage-clients');
        }
    } catch (error) {
      console.error(t('addClient.messages.fetchError'), error);
      router.push('/manage-clients');
    }
  }
});

const submitForm = async () => {
    v$.value.$touch();
    if (v$.value.$invalid) return;

    try {
        const formData = new FormData();
        Object.keys(client.value).forEach(key => {
            if (key !== 'attachments') {
                formData.append(key, client.value[key]);
            }
        });

        let response;
        if (clientId.value) {
            response = await apiClient.put(`/clients/${clientId.value}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            response = await apiClient.post('/clients', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }

        if (response.data.success && client.value.attachments && client.value.attachments.length > 0) {
            const newClientId = response.data.data.id;
            const attachmentFormData = new FormData();
            client.value.attachments.forEach(file => {
                attachmentFormData.append('attachments', file);
            });
            attachmentFormData.append('uploaded_by_user_id', response.data.data.managed_by_user_id);

            await apiClient.post(`/client-attachments/${newClientId}`, attachmentFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }

        router.push('/manage-clients');
    } catch (error) {
        if (error.response && error.response.status === 422) {
            errors.value = error.response.data.errors;
        } else {
            console.error(`${clientId.value ? 'Update' : 'Add'} client error:`, error);
        }
    }
};

const handleFileUpload = (event) => {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    client.value.attachments.push(...files);
  }
};

</script>

<template>
    <div class="container mt-4">
      <h2>{{ pageTitle }}</h2>
      <form @submit.prevent="submitForm">
        <div class="mb-3">
          <label for="companyName" class="form-label">{{ t('addClient.form.clientName') }} <span class="text-danger">*</span></label>
          <input type="text" class="form-control" :class="{'is-invalid': v$.company_name.$error || errors.company_name}" id="companyName" v-model="client.company_name">
          <div v-if="v$.company_name.$error" class="invalid-feedback">
            <p v-for="error of v$.company_name.$errors" :key="error.$uid">{{ error.$message }}</p>
          </div>
          <div v-if="errors.company_name" class="invalid-feedback">{{ errors.company_name }}</div>
        </div>

        <h5 class="mt-4">{{ t('addClient.form.contactPerson') }}</h5>
        <div class="row mb-3">
            <div class="col-md-6">
                <label for="firstName" class="form-label">{{ t('userProfile.firstName') }} <span class="text-danger">*</span></label>
                <input type="text" class="form-control" :class="{'is-invalid': v$.first_name.$error || errors.first_name}" id="firstName" v-model="client.first_name">
                 <div v-if="v$.first_name.$error" class="invalid-feedback">
                    <p v-for="error of v$.first_name.$errors" :key="error.$uid">{{ error.$message }}</p>
                </div>
                <div v-if="errors.first_name" class="invalid-feedback">{{ errors.first_name }}</div>
            </div>
            <div class="col-md-6">
                <label for="lastName" class="form-label">{{ t('userProfile.lastName') }} <span class="text-danger">*</span></label>
                <input type="text" class="form-control" :class="{'is-invalid': v$.last_name.$error || errors.last_name}" id="lastName" v-model="client.last_name">
                <div v-if="v$.last_name.$error" class="invalid-feedback">
                    <p v-for="error of v$.last_name.$errors" :key="error.$uid">{{ error.$message }}</p>
                </div>
                <div v-if="errors.last_name" class="invalid-feedback">{{ errors.last_name }}</div>
            </div>
        </div>

        <div class="mb-3">
          <label for="clientEmail" class="form-label">{{ t('addClient.form.email') }}</label>
          <input type="email" class="form-control" :class="{'is-invalid': v$.email.$error || errors.email}" id="clientEmail" v-model="client.email">
          <div v-if="v$.email.$error" class="invalid-feedback">
            <p v-for="error of v$.email.$errors" :key="error.$uid">{{ error.$message }}</p>
          </div>
          <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
        </div>
        <div class="mb-3">
          <label for="clientPhone" class="form-label">{{ t('addClient.form.phone') }} <span class="text-danger">*</span></label>
          <input type="tel" class="form-control" :class="{'is-invalid': v$.phone_number.$error || errors.phone_number}" id="clientPhone" v-model="client.phone_number">
           <div v-if="v$.phone_number.$error" class="invalid-feedback">
            <p v-for="error of v$.phone_number.$errors" :key="error.$uid">{{ error.$message }}</p>
          </div>
          <div v-if="errors.phone_number" class="invalid-feedback">{{ errors.phone_number }}</div>
        </div>
        <div class="mb-3">
          <label for="clientAddress" class="form-label">{{ t('addClient.form.address') }}</label>
          <input type="text" class="form-control" id="clientAddress" v-model="client.address">
        </div>
        <div class="row mb-3">          
          <div class="col-md-6">
            <label for="clientType" class="form-label">{{ t('addClient.form.clientType') }}</label>
            <select class="form-select" id="clientType" v-model="client.client_type">
              <option value="">{{ t('addClient.form.selectType') }}</option>
              <option value="Individual">{{ t('addClient.form.individual') }}</option>
              <option value="Company">{{ t('addClient.form.company') }}</option>
            </select>
          </div>
          <div class="col-md-6">
            <label for="clientStatus" class="form-label">{{ t('addClient.form.status') }}</label>
            <select class="form-select" id="clientStatus" v-model="client.status">
              <option value="Active">{{ t('manageClients.statuses.active') }}</option>
              <option value="Inactive">{{ t('manageClients.statuses.inactive') }}</option>
              <option value="Lead">{{ t('manageClients.statuses.lead') }}</option>
            </select>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="idType" class="form-label">{{ t('addClient.form.idType') }}</label>
            <select class="form-select" id="idType" v-model="client.id_type">
              <option value="">{{ t('addClient.form.selectIdType') }}</option>
              <option value="National ID">{{ t('addClient.form.nationalId') }}</option>
              <option value="Passport">{{ t('addClient.form.passport') }}</option>
              <option value="Trade Register">{{ t('addClient.form.tradeRegister') }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <label for="idNumber" class="form-label">{{ t('addClient.form.idNumber') }}</label>
            <input type="text" class="form-control" id="idNumber" v-model="client.id_number">
          </div>
          <div class="col-md-4">
            <label for="idExpiryDate" class="form-label">{{ t('addClient.form.idExpiryDate') }}</label>
            <input type="date" class="form-control" id="idExpiryDate" v-model="client.id_expiry_date">
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="taxId" class="form-label">{{ t('addClient.form.taxId') }}</label>
            <input type="text" class="form-control" id="taxId" v-model="client.tax_id">
          </div>
          <div class="col-md-4">
            <label for="nis" class="form-label">{{ t('addClient.form.nis') }}</label>
            <input type="text" class="form-control" id="nis" v-model="client.nis">
          </div>
          <div class="col-md-4">
            <label for="rcNumber" class="form-label">{{ t('addClient.form.rcNumber') }}</label>
            <input type="text" class="form-control" id="rcNumber" v-model="client.rc_number">
          </div>
        </div>
        <h5 class="mt-4">{{ t('addClient.form.contactPerson') }}</h5>
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="contactPersonName" class="form-label">{{ t('addClient.form.name') }}</label>
            <input type="text" class="form-control" id="contactPersonName" v-model="client.contact_person_name">
          </div>
          <div class="col-md-4">
            <label for="contactPersonEmail" class="form-label">{{ t('addClient.form.email') }}</label>
            <input type="email" class="form-control" id="contactPersonEmail" v-model="client.contact_person_email">
          </div>
          <div class="col-md-4">
            <label for="contactPersonPhone" class="form-label">{{ t('addClient.form.phone') }}</label>
            <input type="tel" class="form-control" id="contactPersonPhone" v-model="client.contact_person_phone">
          </div>
        </div>


        <div class="mb-3">
          <label for="attachments" class="form-label">{{ t('addClient.form.attachments') }}</label>
          <input type="file" class="form-control" id="attachments" @change="handleFileUpload" multiple>
        </div>

        <div class="mb-3">
          <span>Nbr of Attachments: {{ client.attachments ? client.attachments.length:0 }}</span>
        </div>

        <div v-if="client.attachments && client.attachments.length" class="mb-3">
            <h5>{{ t('addClient.form.selectedAttachments') }}</h5>
            <ul class="list-group">
                <li v-for="(file, index) in client.attachments" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                    {{ file.name }}
                    <button type="button" class="btn btn-sm btn-outline-primary" @click="openPreviewModal(file)">
                        <i class="bi bi-eye"></i>
                    </button>
                </li>
            </ul>
        </div>

        <button type="submit" class="btn btn-primary me-2">{{ submitButtonText }}</button>
        <router-link to="/manage-clients" class="btn btn-secondary">{{ t('addClient.form.cancel') }}</router-link>
      </form>

        <!-- File Preview Modal -->
        <div class="modal fade" id="filePreviewModal" tabindex="-1" aria-labelledby="filePreviewModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="filePreviewModalLabel">{{ selectedFile?.name }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <FilePreview v-if="selectedFile" :file="selectedFile" />
                    </div>
                </div>
            </div>
        </div>
    </div>
  </template>
  
<style scoped>
  /* Add component-specific styles here */
</style>
