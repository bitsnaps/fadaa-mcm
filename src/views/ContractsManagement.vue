<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { BTable, BPagination } from 'bootstrap-vue-next';
import apiClient from '@/services/ApiClient';
import { getContracts, addContract, updateContract, exportContracts } from '@/services/ContractService';
import { Modal } from 'bootstrap';
import { useVuelidate } from '@vuelidate/core';
import { saveAs } from 'file-saver';
import { required, minValue } from '@vuelidate/validators';
import SmartSelect from '@/components/SmartSelect.vue';

import ProfileTabs from '@/components/ProfileTabs.vue';
import { formatCurrency, formatDate } from '@/helpers/utils.js';
import { downloadFile } from '@/helpers/files.js';
import { useToast } from '@/helpers/toast';
const { t } = useI18n();
const { showErrorToast } = useToast();

const contracts = ref([]);
const searchTerm = ref('');
const originalPaymentTerms = ref('');
const isLoading = ref(true);
const isSubmitting = ref(false);
const activeProfileId = ref(null);
const errors = ref({});

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Table configuration
const tableFields = computed(() => [
  { key: 'client_name', label: t('contracts.tableHeaders.client'), sortable: true },
  { key: 'office_name', label: t('contracts.tableHeaders.office'), sortable: true },
  { key: 'status', label: t('contracts.tableHeaders.status'), sortable: true },
  { key: 'service_type', label: t('contracts.tableHeaders.serviceType'), sortable: true },
  { key: 'payment_terms', label: t('contracts.tableHeaders.paymentTerms'), sortable: true },
  { key: 'start_date', label: t('contracts.tableHeaders.startDate'), sortable: true, formatter: formatDateContract },
  { key: 'end_date', label: t('contracts.tableHeaders.endDate'), sortable: true, formatter: formatDateContract },
  { key: 'monthly_rate', label: t('contracts.tableHeaders.monthlyRate', 'Monthly Rate'), sortable: true },
  { key: 'net_total_amount', label: t('contracts.tableHeaders.netTotalAmount', 'Net Total'), sortable: true },
  { key: 'actions', label: t('contracts.tableHeaders.actions'), class: 'text-center' }
]);

// Modal state
const addContractModal = ref(null);
const isEditMode = ref(false);
const newContract = ref({
  id: null,
  client_id: null,
  office_id: null,
  start_date: '',
  end_date: '',
  monthly_rate: '',
  document: null,
  tax_ids: [],
  profile_id: null,
  status: 'Active',
  notes: '',
  payment_terms: '',
  service_type: '',
  area: null,
  activity: ''
});

const rules = computed(() => ({
    client_id: { required },
    office_id: { required },
    start_date: { required },
    end_date: { required },
    monthly_rate: { required, minValue: minValue(0) },
    status: { required },
}));

const v$ = useVuelidate(rules, newContract);

const availableTaxes = ref([]);

const viewContractModal = ref(null);
const selectedContract = ref(null);
 
const uploadDocumentModal = ref(null);
const selectedContractId = ref(null);
const documentToUpload = ref(null);
const isUploading = ref(false);

const openViewContractModal = (contract) => {
  // The 'original_contract' is now passed directly from the table
  selectedContract.value = contract;
  const modalInstance = Modal.getOrCreateInstance(viewContractModal.value);
  modalInstance.show();
};

const getStatusClass = (status) => {
  switch (status) {
    case 'Active':
      return 'badge bg-success';
    case 'Pending':
      return 'badge bg-warning text-dark';
    case 'Expired':
      return 'badge bg-danger';
    case 'Terminated':
      return 'badge bg-secondary';
    default:
      return 'badge bg-light text-dark';
  }
};



const fetchContracts = async (profileId) => {
  if (!profileId) return;
  try {
    isLoading.value = true;
    const response = await getContracts({ profile_id: profileId });
    if (response.data.success) {
      contracts.value = response.data.contracts;
    } else {
      console.error('Failed to fetch contracts:', response.data.message);
      contracts.value = [];
    }
  } catch (error) {
    console.error('An error occurred while fetching contracts:', error);
    contracts.value = [];
  } finally {
    isLoading.value = false;
  }
};

const onProfileChange = (profileId) => {
  activeProfileId.value = profileId;
  currentPage.value = 1;
  searchTerm.value = '';
  fetchContracts(profileId);
};

onMounted(() => {
  // fetchContracts is now called by onProfileChange
});

watch(() => newContract.value.payment_terms, (newVal) => {
  if (!newVal) return;
  // If in edit mode and the payment terms haven't changed from the original, do not update dates
  if (isEditMode.value && newVal === originalPaymentTerms.value) return;

  const today = new Date();
  let startDate = new Date(today);
  let endDate = new Date(today);

  switch (newVal) {
    case 'Monthly':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'Quarterly':
      const currentQuarter = Math.floor(today.getMonth() / 3);
      startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
      endDate = new Date(today.getFullYear(), currentQuarter * 3 + 3, 0);
      break;
    case 'Annually':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      break;
  }

  newContract.value.start_date = startDate.toISOString().split('T')[0];
  newContract.value.end_date = endDate.toISOString().split('T')[0];
});

watch([() => newContract.value.start_date, () => newContract.value.end_date], () => {
  // Clear the selected office when the dates change
  // to force the user to re-select from the newly filtered list.
  // We only do this if the office was already selected.
  if (newContract.value.office_id) {
    newContract.value.office_id = null;
  }
});

watch(searchTerm, () => {
  currentPage.value = 1;
});

const filteredContracts = computed(() => {
  let filtered = contracts.value;

  if (searchTerm.value) {
    const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
    filtered = contracts.value.filter(contract =>
      (contract.Client?.company_name.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (contract.Office?.name.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (contract.monthly_rate?.toString() || '').includes(lowerCaseSearchTerm) ||
      contract.status.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }

  return filtered.map(contract => {
    return {
      ...contract,
      client_name: contract.Client?.company_name || 'N/A',
      office_name: contract.Office?.name || 'N/A',
      monthly_rate_display: parseFloat(contract.monthly_rate)
    };
  });
});

// For BTable, we don't need paginatedContracts as BTable handles pagination internally
const totalRows = computed(() => filteredContracts.value.length);

const areDatesValid = computed(() => {
  if (!newContract.value.start_date || !newContract.value.end_date) {
    return true;
  }
  return new Date(newContract.value.start_date) < new Date(newContract.value.end_date);
});

const officeApiUrl = computed(() => {
  return '/misc/offices-available';
  // return isEditMode.value ? '/offices' : '/misc/offices-available';
});

const officeFetchParams = computed(() => {
  const params = {};

  // Only add date filters when creating a new contract
  if (!isEditMode.value) {
    if (newContract.value.start_date) {
      params.start_date = newContract.value.start_date;
    }
    if (newContract.value.end_date) {
      params.end_date = newContract.value.end_date;
    }
  }

  // Pass the current contract ID when editing to exclude it from the conflict check
  if (isEditMode.value && newContract.value.id) {
    params.current_contract_id = newContract.value.id;
  }
  return params;
});

const formatDateContract = (date) => {
  if (!date) return t('documents.notApplicable');
  return formatDate(date);
};


const viewDocument = (docUrl) => {
  if(docUrl) {
    window.open(docUrl, '_blank');
  } else {
    console.log('No document URL to view.');
  }

};

const downloadDocument = async (docUrl) => {
  downloadFile('contracts', docUrl);
};

const archiveContract = async (contractId) => {
    try {
        await apiClient.put(`/contracts/${contractId}/status`, { status: 'Terminated' });
        fetchContracts(activeProfileId.value);
    } catch (error) {
        console.error(`Failed to archive contract ${contractId}:`, error);
    }
};

const deleteContract = async (contractId) => {
    if(confirm(t('contracts.confirmDelete'))) {
        try {
            await apiClient.delete(`/contracts/${contractId}`);
            fetchContracts(activeProfileId.value);
        } catch (error) {
            console.error(`Failed to delete contract ${contractId}:`, error);
        }
    }
};

const openAddContractModal = async (profileIdFromSlot = null) => {
  isEditMode.value = false;
  newContract.value = {
    id: null,
    client_id: null,
    office_id: null,
    start_date: '',
    end_date: '',
    monthly_rate: 0,
    document: null,
    tax_ids: [],
    profile_id: profileIdFromSlot || activeProfileId.value,
    status: 'Active',
    area: null,
    activity: ''
  };
  errors.value = {};
  v$.value.$reset();
  try {
    const [taxesResponse] = await Promise.all([
      apiClient.get('/taxes')
    ]);
    if (taxesResponse.data.success) {
       availableTaxes.value = taxesResponse.data.taxes;
    }
    const modalInstance = Modal.getOrCreateInstance(addContractModal.value);
    modalInstance.show();
  } catch (error) {
    console.error('Error fetching data for modal:', error);
  }
};

const handleFileChange = (event) => {
  newContract.value.document = event.target.files[0];
};

const openEditContractModal = async (contract) => {
  isEditMode.value = true;
  const contractData = JSON.parse(JSON.stringify(contract));

  newContract.value = {
    id: contractData.id,
    client_id: contractData.client_id,
    office_id: contractData.office_id,
    start_date: contractData.start_date ? new Date(contractData.start_date).toISOString().split('T')[0] : '',
    end_date: contractData.end_date ? new Date(contractData.end_date).toISOString().split('T')[0] : '',
    monthly_rate: contractData.monthly_rate ? Number(contractData.monthly_rate) : 0,
    document: null, // Don't pre-fill file input
    tax_ids: contractData.taxes ? contractData.taxes.map(t => Number(t.id)) : [],
    profile_id: contractData.profile_id,
    status: contractData.status,
    notes: contractData.notes || '',
    payment_terms: contractData.payment_terms || '',
    service_type: contractData.service_type || '',
    area: contractData.area || null,
    activity: contractData.activity || '',
    original_office_id: contractData.office_id // Keep track of the original office
  };
  originalPaymentTerms.value = contractData.payment_terms || '';
  
  errors.value = {};
  v$.value.$reset();

  try {
    const [taxesResponse] = await Promise.all([
      apiClient.get('/taxes')
    ]);
    
    if (taxesResponse.data.success) availableTaxes.value = taxesResponse.data.taxes;

    const modalInstance = Modal.getOrCreateInstance(addContractModal.value);
    modalInstance.show();
  } catch (error) {
    console.error('Error fetching data for modal:', error);
  }
};

const submitNewContract = async () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  
  isSubmitting.value = true;
  const formData = new FormData();

  // Clean up the object before sending
  const contractData = { ...newContract.value };
  if (!isEditMode.value) {
    delete contractData.id;
  }

  Object.keys(contractData).forEach(key => {
    if (key === 'tax_ids') {
      if (contractData[key].length > 0) {
        contractData[key].forEach(taxId => {
          formData.append('tax_ids[]', taxId);
        });
      } else {
        // Ensure the key is sent even when the array is empty
        formData.append('tax_ids[]', '');
      }
    } else if (key === 'document' && contractData[key]) {
      formData.append(key, contractData[key]);
    } else if (key !== 'document' && contractData[key] !== null && contractData[key] !== undefined) {
      formData.append(key, contractData[key]);
    }
  });

  try {
    let response;
    if (isEditMode.value) {
      response = await updateContract(newContract.value.id, formData);
    } else {
      response = await addContract(formData);
    }

    if (response.data.success) {
      const modalInstance = Modal.getInstance(addContractModal.value);
      modalInstance.hide();
      fetchContracts(activeProfileId.value);
    }
  } catch (error) {
    if (error.response && error.response.status === 422) {
        errors.value = error.response.data.errors;
    } else {
        console.error(`Error submitting ${isEditMode.value ? 'updated' : 'new'} contract:`, error);
    }
  } finally {
    isSubmitting.value = false;
  }
};

const openUploadDocumentModal = (contractId) => {
  selectedContractId.value = contractId;
  const modalInstance = Modal.getOrCreateInstance(uploadDocumentModal.value);
  modalInstance.show();
};

const handleDocumentFileChange = (event) => {
  documentToUpload.value = event.target.files[0];
};

const submitDocumentUpload = async () => {
  if (!documentToUpload.value) {
    showErrorToast('Please select a document to upload.');
    return;
  }

  isUploading.value = true;
  const formData = new FormData();
  formData.append('document', documentToUpload.value);

  try {
    const response = await apiClient.post(`/contracts/${selectedContractId.value}/document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success) {
      const modalInstance = Modal.getInstance(uploadDocumentModal.value);
      modalInstance.hide();
      fetchContracts(activeProfileId.value); // Refresh the list

    } else {

    }
  } catch (error) {
    console.error('Error uploading document:', error);

  } finally {
    isUploading.value = false;
    documentToUpload.value = null;
    selectedContractId.value = null;
  }
};

const exportListing = async (format) => {
  try {
    const config = {
      format: format,
      profile_id: activeProfileId.value,
    };
    const response = await exportContracts(config);
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    saveAs(blob, `contracts-${new Date().toISOString().split('T')[0]}.${format}`);
  } catch (error) {
    console.error(`Error exporting contracts as ${format}:`, error);
  }
};
</script>

<template>
  <div class="container mt-4">
    <h2>{{ t('contracts.title') }}</h2>

    <ProfileTabs @update:activeProfile="onProfileChange">
      <template #default="{ profileId }">
        <div class="d-flex justify-content-between align-items-center my-4">
          <div>
            <input
              type="text"
              class="form-control"
              v-model="searchTerm"
              :placeholder="t('contracts.searchPlaceholder')"
            />
          </div>
          <div class="btn-group">
            <button class="btn btn-primary" @click="openAddContractModal(profileId)">
              <i class="bi bi-plus-lg me-2"></i>{{ t('contracts.addNewContract') }}
            </button>
            <button type="button" class="btn btn-secondary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-download me-2"></i> {{ t('manageClients.export.title') }}
              <span class="visually-hidden">Toggle Dropdown</span>
            </button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#" @click.prevent="exportListing('csv')">{{ t('manageClients.export.csv') }}</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="exportListing('xlsx')">{{ t('manageClients.export.xlsx') }}</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="exportListing('pdf')">{{ t('manageClients.export.pdf') }}</a></li>
            </ul>
          </div>
        </div>

        <div v-if="isLoading" class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <div v-else-if="filteredContracts.length > 0">
          <BTable
            :items="filteredContracts"
            :fields="tableFields"
            :current-page="currentPage"
            :per-page="itemsPerPage"
            responsive
            striped
            hover
            show-empty
            :empty-text="t('contracts.noContractsFound')"
          >
            <template #cell(status)="data">
              <span
                :class="['badge', {
                  'bg-success': data.value === 'Active',
                  'bg-warning text-dark': data.value === 'Pending',
                  'bg-danger': data.value === 'Expired',
                  'bg-secondary': data.value === 'Terminated'
                }]">
                {{ t(`contracts.status.${data.value.toLowerCase()}`) }}
              </span>
            </template>

            <template #cell(monthly_rate)="data">
              {{ formatCurrency(data.item.monthly_rate_display, '') }}
            </template>

            <template #cell(net_total_amount)="data">
              {{ formatCurrency(data.item.net_total_amount, '') }}
            </template>

            <template #cell(actions)="data">
              <div class="text-center">
                <button @click="openViewContractModal(data.item)" class="btn btn-sm btn-outline-info me-1" :title="t('contracts.viewContract')">
                  <i class="bi bi-eye"></i>
                </button>
                <button @click="downloadDocument(data.item.document_url)" :disabled="!data.item.document_url" class="btn btn-sm btn-outline-primary me-1" :title="t('contracts.downloadContract')">
                  <i class="bi bi-download"></i>
                </button>
                <button v-if="!data.item.document_url" @click="openUploadDocumentModal(data.item.id)" class="btn btn-sm btn-outline-success me-1" :title="t('contracts.uploadDocument')">
                  <i class="bi bi-upload"></i>
                </button>
                <button @click="openEditContractModal(data.item)" class="btn btn-sm btn-outline-secondary me-1" :title="t('contracts.editContract', 'Edit Contract')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button v-if="data.item.status === 'Active'" @click="archiveContract(data.item.id)" class="btn btn-sm btn-outline-warning" :title="t('contracts.archiveContract')">
                  <i class="bi bi-archive"></i>
                </button>
                <button @click="deleteContract(data.item.id)" class="btn btn-sm btn-outline-danger ms-1" :title="t('contracts.deleteContract')">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </template>
          </BTable>

          <div class="d-flex justify-content-center mt-4">
            <BPagination
              v-model="currentPage"
              :total-rows="totalRows"
              :per-page="itemsPerPage"
              aria-controls="contracts-table"
            />
          </div>
        </div>
        <div v-else class="alert alert-info text-center" role="alert">
          {{ t('contracts.noContractsFound') }}
        </div>
      </template>
    </ProfileTabs>

    <!-- Add/Edit Modal -->
    <div class="modal fade" ref="addContractModal" tabindex="-1" aria-labelledby="addContractModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="addContractModalLabel">{{ isEditMode ? t('contracts.editContractTitle', 'Edit Contract') : t('contracts.addNewContract') }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="submitNewContract">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="client" class="form-label">{{ t('contracts.tableHeaders.client') }} <span class="text-danger">*</span></label>
                                <SmartSelect
                                  id="client"
                                  v-model="v$.client_id.$model"
                                  :class="{'is-invalid': v$.client_id.$error || errors.client_id}"
                                  fetch-url="/clients"
                                  label-key="company_name"
                                  value-key="id"
                                  :placeholder="t('contracts.selectClientPlaceholder', 'Search and select a client...')"
                                  :clearable="true"
                                />
                                <div v-if="v$.client_id.$error" class="invalid-feedback">
                                    <p v-for="error of v$.client_id.$errors" :key="error.$uid">{{ error.$message }}</p>
                                </div>
                                <div v-if="errors.client_id" class="invalid-feedback">{{ errors.client_id }}</div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="office" class="form-label">{{ t('contracts.tableHeaders.office') }} <span class="text-danger">*</span></label>
                                <!-- <select id="office" class="form-select" v-model="v$.office_id.$model" :class="{'is-invalid': v$.office_id.$error || errors.office_id}">
                                    <option :value="null" disabled>-- Select Office --</option>
                                    <option v-for="office in offices" :key="office.id" :value="office.id">{{ office.name }}</option>
                                </select> -->
                                <SmartSelect
                                  id="office"
                                  v-model="v$.office_id.$model"
                                  :class="{'is-invalid': v$.office_id.$error || errors.office_id}"
                                  :fetch-url="officeApiUrl"
                                  label-key="name"
                                  value-key="id"
                                  :placeholder="t('contracts.selectOfficePlaceholder', 'Search and select a office...')"
                                  :clearable="true"
                                  :fetch-params="officeFetchParams"
                                />
                                <div v-if="v$.office_id.$error" class="invalid-feedback">
                                    <p v-for="error of v$.office_id.$errors" :key="error.$uid">{{ error.$message }}</p>
                                </div>
                                <div v-if="errors.office_id" class="invalid-feedback">{{ errors.office_id }}</div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="serviceType" class="form-label">{{ t('contracts.tableHeaders.serviceType') }}</label>
                                <select class="form-select" id="serviceType" v-model="newContract.service_type">
                                  <option value="">{{ t('contracts.tableHeaders.selectService') }}</option>
                                  <option value="Domiciliation">{{ t('contracts.tableHeaders.domiciliation') }}</option>
                                  <option value="Office Rental">{{ t('contracts.tableHeaders.officeRental') }}</option>
                                  <option value="Coworking">{{ t('contracts.tableHeaders.coworking') }}</option>
                                  <option value="Meeting Room">{{ t('contracts.tableHeaders.meetingRoom') }}</option>
                                </select>
                            </div>
                          <div class="col-md-6 mb-3">
                            <label for="paymentTerms" class="form-label">{{ t('contracts.tableHeaders.paymentTerms') }}</label>
                            <select class="form-select" id="paymentTerms" v-model="newContract.payment_terms">
                              <option value="">{{ t('contracts.tableHeaders.selectTerms') }}</option>
                              <option value="Monthly">{{ t('contracts.tableHeaders.monthly') }}</option>
                              <option value="Quarterly">{{ t('contracts.tableHeaders.quarterly') }}</option>
                              <option value="Annually">{{ t('contracts.tableHeaders.annually') }}</option>
                            </select>
                          </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="start_date" class="form-label">{{ t('contracts.tableHeaders.startDate') }} <span class="text-danger">*</span></label>
                                <input type="date" id="start_date" class="form-control" v-model="v$.start_date.$model" :class="{'is-invalid': v$.start_date.$error || errors.start_date}">
                                <div v-if="v$.start_date.$error" class="invalid-feedback">
                                    <p v-for="error of v$.start_date.$errors" :key="error.$uid">{{ error.$message }}</p>
                                </div>
                                <div v-if="errors.start_date" class="invalid-feedback">{{ errors.start_date }}</div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="end_date" class="form-label">{{ t('contracts.tableHeaders.endDate') }} <span class="text-danger">*</span></label>
                                <input type="date" id="end_date" class="form-control" v-model="v$.end_date.$model" :class="{'is-invalid': v$.end_date.$error || errors.end_date}">
                                <div v-if="v$.end_date.$error" class="invalid-feedback">
                                    <p v-for="error of v$.end_date.$errors" :key="error.$uid">{{ error.$message }}</p>
                                </div>
                                <div v-if="errors.end_date" class="invalid-feedback">{{ errors.end_date }}</div>
                                <div v-if="!areDatesValid" class="text-danger mt-1">
                                    {{ t('contracts.endDateBeforeStartDateError') }}
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="monthly_rate" class="form-label">{{ t('contracts.tableHeaders.monthlyRate', 'Monthly Rate') }}</label>
                                <input type="number" id="monthly_rate" class="form-control" v-model.number="v$.monthly_rate.$model" :class="{'is-invalid': v$.monthly_rate.$error || errors.monthly_rate}" step="0.01" min="0" placeholder="e.g., 50000.00">
                                <div v-if="v$.monthly_rate.$error" class="invalid-feedback">
                                    <p v-for="error of v$.monthly_rate.$errors" :key="error.$uid">{{ error.$message }}</p>
                                </div>
                                <div v-if="errors.monthly_rate" class="invalid-feedback">{{ errors.monthly_rate }}</div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="status" class="form-label">{{ t('contracts.tableHeaders.status') }} <span class="text-danger">*</span></label>
                                <select id="status" class="form-select" v-model="v$.status.$model" :class="{'is-invalid': v$.status.$error || errors.status}">
                                    <option value="Active">{{ t('contracts.status.active', 'Active') }}</option>
                                    <option value="Pending">{{ t('contracts.status.pending', 'Pending') }}</option>
                                    <option value="Expired">{{ t('contracts.status.expired', 'Expired') }}</option>
                                    <option value="Terminated">{{ t('contracts.status.terminated', 'Terminated') }}</option>
                                </select>
                                <div v-if="v$.status.$error" class="invalid-feedback">
                                    <p v-for="error of v$.status.$errors" :key="error.$uid">{{ error.$message }}</p>
                                </div>
                                <div v-if="errors.status" class="invalid-feedback">{{ errors.status }}</div>
                            </div>
                        </div>
                         <div class="mb-3">
                           <label class="form-label">{{ t('manageTaxes.title') }}</label>
                           <p class="form-text text-muted">{{ t('contracts.taxSelectionNote', 'Taxes are applied to the monthly rate to calculate the total amount.') }}</p>
                           <div class="d-flex flex-wrap gap-3">
                               <div v-for="tax in availableTaxes" :key="tax.id" class="form-check">
                                   <input class="form-check-input" type="checkbox" :value="tax.id" :id="`tax-${tax.id}`" v-model="newContract.tax_ids">
                                   <label class="form-check-label" :for="`tax-${tax.id}`">
                                       {{ tax.name }} ({{ tax.rate }}%)
                                   </label>
                               </div>
                           </div>
                        </div>
                        <div class="mb-3">
                            <label for="document" class="form-label">{{ t('addClient.form.attachments') }}</label>
                            <input type="file" id="document" class="form-control" @change="handleFileChange">
                        </div>
                        <div class="mb-3">
                            <label for="notes" class="form-label">{{ t('contracts.notes') }}</label>
                            <textarea id="notes" class="form-control" v-model="newContract.notes" rows="3"></textarea>
                        </div>
                       <div class="row">
                           <div class="col-md-6 mb-3">
                               <label for="area" class="form-label">{{ t('contracts.tableHeaders.area') }}</label>
                               <input type="number" id="area" class="form-control" v-model.number="newContract.area" min="0">
                           </div>
                           <div class="col-md-6 mb-3">
                               <label for="activity" class="form-label">{{ t('contracts.tableHeaders.activity') }}</label>
                               <input type="text" id="activity" class="form-control" v-model="newContract.activity">
                           </div>
                       </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('manageUsers.cancel') }}</button>
                    <button type="button" class="btn btn-primary" @click="submitNewContract" :disabled="isSubmitting || !areDatesValid">
                        <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        {{ isSubmitting ? t('contracts.submitting', 'Submitting...') : (isEditMode ? t('contracts.updateButton', 'Update') : t('contracts.addButton', 'Add Contract')) }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    <!-- View Contract Modal -->
    <div class="modal fade" ref="viewContractModal" tabindex="-1" aria-labelledby="viewContractModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="viewContractModalLabel">{{ t('contracts.viewContractTitle', 'Contract Details') }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedContract">
            <p><strong>{{ t('contracts.tableHeaders.client') }}:</strong> {{ selectedContract.Client.company_name }}</p>
            <p><strong>{{ t('contracts.tableHeaders.office') }}:</strong> {{ selectedContract.Office.name }}</p>
            <p><strong>{{ t('contracts.tableHeaders.startDate') }}:</strong> {{ formatDate(selectedContract.start_date) }}</p>
            <p><strong>{{ t('contracts.tableHeaders.endDate') }}:</strong> {{ formatDate(selectedContract.end_date) }}</p>
            <p><strong>{{ t('contracts.tableHeaders.monthlyRate') }}:</strong> {{ formatCurrency(selectedContract.monthly_rate) }}</p>
            <p><strong>{{ t('contracts.tableHeaders.netTotalAmount') }}:</strong> {{ formatCurrency(selectedContract.net_total_amount) }}</p>
            <p><strong>{{ t('contracts.tableHeaders.status') }}:</strong> <span :class="getStatusClass(selectedContract.status)">{{ selectedContract.status }}</span></p>
            <p><strong>{{ t('contracts.tableHeaders.paymentTerms') }}:</strong> {{ selectedContract.payment_terms }}</p>
            <p><strong>{{ t('addClient.form.serviceType') }}:</strong> {{ selectedContract.service_type }}</p>
            <p><strong>{{ t('contracts.tableHeaders.area') }}:</strong> {{ selectedContract.area }} m²</p>
            <p><strong>{{ t('contracts.tableHeaders.activity') }}:</strong> {{ selectedContract.activity }}</p>
            <div v-if="selectedContract.notes">
              <p><strong>{{ t('contracts.notes') }}:</strong></p>
              <p>{{ selectedContract.notes }}</p>
            </div>
            <div v-if="selectedContract.taxes && selectedContract.taxes.length > 0">
                <strong>{{ t('manageTaxes.title') }}:</strong>
                <ul>
                    <li v-for="tax in selectedContract.taxes" :key="tax.id">{{ tax.name }} ({{ tax.rate }}%)</li>
                </ul>
            </div>
            <!-- <p v-if="selectedContract.document_url">
              <strong>{{ t('addClient.form.attachments') }}:</strong>
              <a :href="getFullUrl(selectedContract.document_url)" target="_blank" class="btn btn-sm btn-outline-primary ms-2">{{ t('contracts.viewDocument') }}</a>
            </p> -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('manageUsers.close') }}</button>
          </div>
        </div>
      </div>
    </div>
<!-- Upload Document Modal -->
    <div class="modal fade" ref="uploadDocumentModal" tabindex="-1" aria-labelledby="uploadDocumentModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="uploadDocumentModalLabel">{{ t('contracts.uploadDocument') }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitDocumentUpload">
              <div class="mb-3">
                <label for="contractDocument" class="form-label">{{ t('addClient.form.attachments') }} <span class="text-danger">*</span></label>
                <input type="file" id="contractDocument" class="form-control" @change="handleDocumentFileChange" required>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('manageUsers.cancel') }}</button>
                <button type="submit" class="btn btn-primary" :disabled="isUploading">
                  <span v-if="isUploading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  {{ isUploading ? 'Uploading...' : t('contracts.upload') }}
                </button>
              </div>
            </form>
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