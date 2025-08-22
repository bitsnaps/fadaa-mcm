<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { BTable, BPagination } from 'bootstrap-vue-next';
import apiClient from '@/services/ApiClient';
import { getContracts, addContract, updateContract } from '@/services/ContractService';
import { getClients } from '@/services/ClientService';
import { getAvailableOffices } from '@/services/OfficeService';
import { Modal } from 'bootstrap';

import ProfileTabs from '@/components/ProfileTabs.vue';
import { formatCurrency, formatDate } from '@/helpers/utils.js';
import { useToast } from '@/helpers/toast';
const { t } = useI18n();
const { showErrorToast } = useToast();

const contracts = ref([]);
const searchTerm = ref('');
const isLoading = ref(true);
const isSubmitting = ref(false);
const activeProfileId = ref(null);

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Table configuration
const tableFields = computed(() => [
  { key: 'client_name', label: t('contracts.tableHeaders.client'), sortable: true },
  { key: 'office_name', label: t('contracts.tableHeaders.office'), sortable: true },
  { key: 'status', label: t('contracts.tableHeaders.status'), sortable: true },
  { key: 'start_date', label: t('contracts.tableHeaders.startDate'), sortable: true, formatter: formatDateContract },
  { key: 'end_date', label: t('contracts.tableHeaders.endDate'), sortable: true, formatter: formatDateContract },
  { key: 'monthly_rate', label: t('contracts.tableHeaders.monthlyRate', 'Monthly Rate'), sortable: true, formatter: (value) => { const n = typeof value === 'number' ? value : parseFloat(value); return Number.isFinite(n) ? formatCurrency(n) : 'N/A'; } },
  { key: 'total_amount', label: t('contracts.tableHeaders.totalAmount', 'Total Amount'), sortable: false },
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
  status: 'Active'
});

const clients = ref([]);
const offices = ref([]);
const availableTaxes = ref([]);

const uploadDocumentModal = ref(null);
const selectedContractId = ref(null);
const documentToUpload = ref(null);
const isUploading = ref(false);


const fetchContracts = async (profileId) => {
  if (!profileId) return;
  try {
    isLoading.value = true;
    const response = await getContracts(profileId);
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

  // Transform data for BTable
  return filtered.map(contract => ({
    ...contract,
    client_name: contract.Client?.company_name || 'N/A',
    office_name: contract.Office?.name || 'N/A',
    total_amount: calculateTotalAmount(contract)
  }));
});

// For BTable, we don't need paginatedContracts as BTable handles pagination internally
const totalRows = computed(() => filteredContracts.value.length);

const formatDateContract = (date) => {
  if (!date) return t('documents.notApplicable');
  return formatDate(date);
};

const calculateTotalAmount = (contract) => {
  const monthlyRate = parseFloat(contract.monthly_rate);
  
  if (isNaN(monthlyRate)) return 0;

  // Support both API include alias 'taxes' and potential 'Taxes'
  const taxes = contract.taxes || [];

  if (taxes.length === 0) {
    return monthlyRate;
  }

  const totalTaxRate = taxes.reduce((sum, tax) => {
    const rate = parseFloat(tax.rate);
    return sum + (isNaN(rate) ? 0 : rate);
  }, 0);

  const totalAmount = monthlyRate * (1 + totalTaxRate / 100);
  return totalAmount;
};

const viewDocument = (docUrl) => {
  if(docUrl) {
    window.open(docUrl, '_blank');
  } else {
    console.log('No document URL to view.');
  }

};

const downloadDocument = (docUrl) => {
    if(docUrl) {
        const link = document.createElement('a');
        link.href = docUrl;
        link.setAttribute('download', '');
        link.setAttribute('target', '_blank'); // Open in a new tab
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        console.log('No document URL to download.');
    }
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
    status: 'Active'
  };
  try {
    const [clientsResponse, officesResponse, taxesResponse] = await Promise.all([
      getClients(),
      getAvailableOffices(),
      apiClient.get('/taxes')
    ]);
    if (clientsResponse.data.success) {
      clients.value = clientsResponse.data.data;
    }
    if (officesResponse.data.success) {
        offices.value = officesResponse.data.data;
    }
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
    original_office_id: contractData.office_id // Keep track of the original office
  };

  try {
    const [clientsResponse, officesResponse, taxesResponse] = await Promise.all([
      getClients(),
      getAvailableOffices(),
      apiClient.get('/taxes')
    ]);
    
    if (clientsResponse.data.success) clients.value = clientsResponse.data.data;
    if (officesResponse.data.success) offices.value = officesResponse.data.data;
    if (taxesResponse.data.success) availableTaxes.value = taxesResponse.data.taxes;

    const modalInstance = Modal.getOrCreateInstance(addContractModal.value);
    modalInstance.show();
  } catch (error) {
    console.error('Error fetching data for modal:', error);
  }
};

const submitNewContract = async () => {
  isSubmitting.value = true;
  const formData = new FormData();

  // Clean up the object before sending
  const contractData = { ...newContract.value };
  if (!isEditMode.value) {
    delete contractData.id;
  }

  Object.keys(contractData).forEach(key => {
    if (key === 'tax_ids') {
      contractData[key].forEach(taxId => {
        formData.append('tax_ids[]', taxId);
      });
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
    } else {

    }
  } catch (error) {
    console.error(`Error submitting ${isEditMode.value ? 'updated' : 'new'} contract:`, error);

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
          <button class="btn btn-primary" @click="openAddContractModal(profileId)">
            <i class="bi bi-plus-lg me-2"></i>{{ t('contracts.addNewContract') }}
          </button>
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
              {{ formatCurrency(data.value) }}
            </template>

            <template #cell(total_amount)="data">
              {{ formatCurrency(data.value, '') }}
            </template>

            <template #cell(actions)="data">
              <div class="text-center">
                <button @click="viewDocument(data.item.document_url)" :disabled="!data.item.document_url" class="btn btn-sm btn-outline-info me-1" :title="t('contracts.viewContract')">
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
                                <select id="client" class="form-select" v-model="newContract.client_id" required>
                                    <option :value="null" disabled>-- Select Client --</option>
                                    <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.company_name }}</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="office" class="form-label">{{ t('contracts.tableHeaders.office') }} <span class="text-danger">*</span></label>
                                <select id="office" class="form-select" v-model="newContract.office_id" required>
                                    <option :value="null" disabled>-- Select Office --</option>
                                    <option v-for="office in offices" :key="office.id" :value="office.id">{{ office.name }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="start_date" class="form-label">{{ t('contracts.tableHeaders.startDate') }} <span class="text-danger">*</span></label>
                                <input type="date" id="start_date" class="form-control" v-model="newContract.start_date" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="end_date" class="form-label">{{ t('contracts.tableHeaders.endDate') }} <span class="text-danger">*</span></label>
                                <input type="date" id="end_date" class="form-control" v-model="newContract.end_date" required>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="monthly_rate" class="form-label">{{ t('contracts.tableHeaders.monthlyRate', 'Monthly Rate') }}</label>
                                <input type="number" id="monthly_rate" class="form-control" v-model.number="newContract.monthly_rate" step="0.01" min="0" placeholder="e.g., 50000.00">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="status" class="form-label">{{ t('contracts.tableHeaders.status') }} <span class="text-danger">*</span></label>
                                <select id="status" class="form-select" v-model="newContract.status" required>
                                    <option value="Active">{{ t('contracts.status.active', 'Active') }}</option>
                                    <option value="Pending">{{ t('contracts.status.pending', 'Pending') }}</option>
                                    <option value="Expired">{{ t('contracts.status.expired', 'Expired') }}</option>
                                    <option value="Terminated">{{ t('contracts.status.terminated', 'Terminated') }}</option>
                                </select>
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
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('manageUsers.cancel') }}</button>
                    <button type="button" class="btn btn-primary" @click="submitNewContract" :disabled="isSubmitting">
                        <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        {{ isSubmitting ? t('contracts.submitting', 'Submitting...') : (isEditMode ? t('contracts.updateButton', 'Update') : t('contracts.addButton', 'Add Contract')) }}
                    </button>
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