<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import apiClient from '@/services/ApiClient';
import { useToast } from '@/helpers/toast';

const { t } = useI18n();
const router = useRouter();
const { showErrorToast } = useToast();
const route = useRoute();
const clientId = ref(route.params.clientId || null);

const client = ref({
  company_name: '',
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  address: '',
  status: 'Active',
  client_type: '',
  service_type: '',
  id_type: '',
  id_number: '',
  id_expiry_date: '',
  tax_id: '',
  nis: '',
  rc_number: '',
  contact_person_name: '',
  contact_person_email: '',
  contact_person_phone: '',
  contract_start_date: '',
  contract_end_date: '',
  payment_terms: '',
  office_id: null,
  attachments: [],
});

const pageTitle = computed(() => clientId.value ? t('addClient.editTitle') : t('addClient.addTitle'));
const submitButtonText = computed(() => clientId.value ? t('addClient.submitButtonUpdate') : t('addClient.submitButtonAdd'));
const validationErrors = ref({});
const availableOffices = ref([]);
const availableBranches = ref([]);
const selectedBranchId = ref(null);

const fetchAvailableBranches = async () => {
    try {
        const response = await apiClient.get('/misc/branches');
        if(response.data.success) {
            availableBranches.value = response.data.branches;
        }
    } catch (error) {
        console.error("Failed to fetch available branches:", error);
    }
};

const fetchAvailableOffices = async (branchId = null) => {
    try {
        const params = branchId ? { branch_id: branchId } : {};
        const response = await apiClient.get('/misc/offices', { params });
        if(response.data.success) {
            availableOffices.value = response.data.offices;
        }
    } catch (error) {
        console.error("Failed to fetch available offices:", error);
    }
};

const ensureSelectedOfficeInOptions = async () => {
    if (client.value.office_id && !availableOffices.value.some(o => o.id === client.value.office_id)) {
        try {
            const officeResp = await apiClient.get(`/offices/${client.value.office_id}`);
            if (officeResp.data.success && officeResp.data.data) {
                availableOffices.value = [...availableOffices.value, officeResp.data.data];
            }
        } catch (e) {
            console.error('Failed to ensure selected office present in options:', e);
        }
    }
};

const onBranchChange = () => {
    // Reset office selection when branch changes
    client.value.office_id = null;
    // Fetch offices for the selected branch
    if (selectedBranchId.value) {
        fetchAvailableOffices(selectedBranchId.value);
    } else {
        availableOffices.value = [];
    }
};

const validateForm = () => {
    const errors = {};
    if (!client.value.company_name) errors.company_name = 'Company name is required.';
    if (!client.value.first_name) errors.first_name = 'First name is required.';
    if (!client.value.last_name) errors.last_name = 'Last name is required.';
    if (!client.value.phone_number) errors.phone_number = 'Phone number is required.';

    validationErrors.value = errors;
    return Object.keys(errors).length === 0;
};

onMounted(async () => {
  await fetchAvailableBranches();
  if (clientId.value) {
    try {
        const response = await apiClient.get(`/clients/${clientId.value}`);
        if(response.data.success) {
            client.value = response.data.data;
            // If client has an assigned office, infer the branch and load offices accordingly
            if (client.value.office_id) {
                try {
                    const officeResp = await apiClient.get(`/offices/${client.value.office_id}`);
                    if (officeResp.data.success && officeResp.data.data) {
                        const office = officeResp.data.data;
                        selectedBranchId.value = office.branch_id || (office.branch ? office.branch.id : null);
                        if (selectedBranchId.value) {
                            await fetchAvailableOffices(selectedBranchId.value);
                            await ensureSelectedOfficeInOptions();
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch office for client to determine branch:', err);
                }
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
    if (!validateForm()) {
        return;
    }
    try {
        const formData = new FormData();
        Object.keys(client.value).forEach(key => {
            if (key === 'attachments') {
                client.value.attachments.forEach(file => {
                    formData.append('attachments', file);
                });
            } else {
                formData.append(key, client.value[key]);
            }
        });
        
        let response;
        if (clientId.value) {
            response = await apiClient.put(`/clients/${clientId.value}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log(t('addClient.messages.updateSuccess'));
        } else {
            response = await apiClient.post('/clients', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log(t('addClient.messages.addSuccess'));
        }
        
        if (response.data.success && client.value.attachments.length > 0) {
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
        console.error(`${clientId.value ? 'Update' : 'Add'} client error:`, error);
        if (error.response && error.response.data && error.response.data.message) {
            // Display backend validation errors
            // This is a simple implementation; a more robust solution would map errors to fields
            showErrorToast(`Error: ${error.response.data.message}`);
        }
    }
};

const handleFileUpload = (event) => {
  client.value.attachments = Array.from(event.target.files);
};

</script>

<template>
    <div class="container mt-4">
      <h2>{{ pageTitle }}</h2>
      <form @submit.prevent="submitForm">
        <div class="mb-3">
          <label for="companyName" class="form-label">{{ t('addClient.form.clientName') }} <span class="text-danger">*</span></label>
          <input type="text" class="form-control" :class="{'is-invalid': validationErrors.company_name}" id="companyName" v-model="client.company_name" required>
          <div v-if="validationErrors.company_name" class="invalid-feedback">{{ validationErrors.company_name }}</div>
        </div>

        <h5 class="mt-4">{{ t('addClient.form.contactPerson') }}</h5>
        <div class="row mb-3">
            <div class="col-md-6">
                <label for="firstName" class="form-label">{{ t('userProfile.firstName') }} <span class="text-danger">*</span></label>
                <input type="text" class="form-control" :class="{'is-invalid': validationErrors.first_name}" id="firstName" v-model="client.first_name" required>
                <div v-if="validationErrors.first_name" class="invalid-feedback">{{ validationErrors.first_name }}</div>
            </div>
            <div class="col-md-6">
                <label for="lastName" class="form-label">{{ t('userProfile.lastName') }} <span class="text-danger">*</span></label>
                <input type="text" class="form-control" :class="{'is-invalid': validationErrors.last_name}" id="lastName" v-model="client.last_name" required>
                <div v-if="validationErrors.last_name" class="invalid-feedback">{{ validationErrors.last_name }}</div>
            </div>
        </div>

        <div class="mb-3">
          <label for="clientEmail" class="form-label">{{ t('addClient.form.email') }}</label>
          <input type="email" class="form-control" :class="{'is-invalid': validationErrors.email}" id="clientEmail" v-model="client.email">
          <div v-if="validationErrors.email" class="invalid-feedback">{{ validationErrors.email }}</div>
        </div>
        <div class="mb-3">
          <label for="clientPhone" class="form-label">{{ t('addClient.form.phone') }} <span class="text-danger">*</span></label>
          <input type="tel" class="form-control" :class="{'is-invalid': validationErrors.phone_number}" id="clientPhone" v-model="client.phone_number" required>
          <div v-if="validationErrors.phone_number" class="invalid-feedback">{{ validationErrors.phone_number }}</div>
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
            <label for="serviceType" class="form-label">{{ t('addClient.form.serviceType') }}</label>
            <select class="form-select" id="serviceType" v-model="client.service_type">
              <option value="">{{ t('addClient.form.selectService') }}</option>
              <option value="Domiciliation">{{ t('addClient.form.domiciliation') }}</option>
              <option value="Office Rental">{{ t('addClient.form.officeRental') }}</option>
              <option value="Coworking">{{ t('addClient.form.coworking') }}</option>
              <option value="Meeting Room">{{ t('addClient.form.meetingRoom') }}</option>
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
        <h5 class="mt-4">{{ t('addClient.form.contractDetails') }}</h5>
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="contractStartDate" class="form-label">{{ t('addClient.form.contractStartDate') }}</label>
            <input type="date" class="form-control" id="contractStartDate" v-model="client.contract_start_date">
          </div>
          <div class="col-md-4">
            <label for="contractEndDate" class="form-label">{{ t('addClient.form.contractEndDate') }}</label>
            <input type="date" class="form-control" id="contractEndDate" v-model="client.contract_end_date">
          </div>
          <div class="col-md-4">
            <label for="paymentTerms" class="form-label">{{ t('addClient.form.paymentTerms') }}</label>
            <select class="form-select" id="paymentTerms" v-model="client.payment_terms">
              <option value="">{{ t('addClient.form.selectTerms') }}</option>
              <option value="Monthly">{{ t('addClient.form.monthly') }}</option>
              <option value="Quarterly">{{ t('addClient.form.quarterly') }}</option>
              <option value="Annually">{{ t('addClient.form.annually') }}</option>
            </select>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="branchId" class="form-label">{{ t('addClient.form.selectBranch') }}</label>
            <select class="form-select" id="branchId" v-model="selectedBranchId" @change="onBranchChange">
              <option :value="null">{{ t('addClient.form.selectBranchPlaceholder') }}</option>
              <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
          </div>
          <div class="col-md-6">
            <label for="officeId" class="form-label">{{ t('addClient.form.assignOffice') }}</label>
            <select class="form-select" id="officeId" v-model="client.office_id" :disabled="!selectedBranchId">
              <option :value="null">{{ t('addClient.form.noOfficeAssigned') }}</option>
              <option v-for="office in availableOffices" :key="office.id" :value="office.id">
                {{ office.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="mb-3">
          <label for="attachments" class="form-label">{{ t('addClient.form.attachments') }}</label>
          <input type="file" class="form-control" id="attachments" @change="handleFileUpload" multiple>
        </div>
        <button type="submit" class="btn btn-primary me-2">{{ submitButtonText }}</button>
        <router-link to="/manage-clients" class="btn btn-secondary">{{ t('addClient.form.cancel') }}</router-link>
      </form>
    </div>
  </template>
  
<style scoped>
  /* Add component-specific styles here */
</style>