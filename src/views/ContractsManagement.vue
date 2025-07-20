<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import apiClient, { getContracts, getClients, getAvailableOffices, addContract } from '@/services/ApiClient';
import { Modal } from 'bootstrap';
import { format } from 'date-fns';

const { t } = useI18n();

const contracts = ref([]);
const searchTerm = ref('');
const isLoading = ref(true);
const isSubmitting = ref(false);

// Modal state
const addContractModal = ref(null);
const newContract = ref({
  client_id: null,
  office_id: null,
  start_date: '',
  end_date: '',
  monthly_rate: '',
  document: null,
  tax_ids: []
});

const clients = ref([]);
const offices = ref([]);
const availableTaxes = ref([]);

const uploadDocumentModal = ref(null);
const selectedContractId = ref(null);
const documentToUpload = ref(null);
const isUploading = ref(false);


const fetchContracts = async () => {
  try {
    isLoading.value = true;
    const response = await getContracts();
    if (response.data.success) {
      contracts.value = response.data.contracts;
    } else {
      console.error('Failed to fetch contracts:', response.data.message);
    }
  } catch (error) {
    console.error('An error occurred while fetching contracts:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchContracts();
});

const filteredContracts = computed(() => {
  if (!searchTerm.value) {
    return contracts.value;
  }
  return contracts.value.filter(contract =>
    (contract.Client?.company_name.toLowerCase() || '').includes(searchTerm.value.toLowerCase()) ||
    (contract.Office?.name.toLowerCase() || '').includes(searchTerm.value.toLowerCase()) ||
    contract.status.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const formatDate = (date) => {
  if (!date) return t('documents.notApplicable');
  return format(new Date(date), 'yyyy-MM-dd');
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
        fetchContracts();
    } catch (error) {
        console.error(`Failed to archive contract ${contractId}:`, error);
    }
};

const deleteContract = async (contractId) => {
    if(confirm(t('contracts.confirmDelete'))) {
        try {
            await apiClient.delete(`/contracts/${contractId}`);
            fetchContracts();
        } catch (error) {
            console.error(`Failed to delete contract ${contractId}:`, error);
        }
    }
};

const openAddContractModal = async () => {
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

const submitNewContract = async () => {
  isSubmitting.value = true;
  const formData = new FormData();
  Object.keys(newContract.value).forEach(key => {
    if (key === 'tax_ids') {
        newContract.value[key].forEach(taxId => {
            formData.append('tax_ids[]', taxId);
        });
    } else if (newContract.value[key]) {
        formData.append(key, newContract.value[key]);
    }
  });

  try {
    const response = await addContract(formData);
    if (response.data.success) {
      const modalInstance = Modal.getInstance(addContractModal.value);
      modalInstance.hide();
      fetchContracts(); // Refresh the list
       // Reset form
       newContract.value = { client_id: null, office_id: null, start_date: '', end_date: '', monthly_rate: '', document: null, tax_ids: [] };
    } else {
      alert('Failed to add contract: ' + response.data.message);
    }
  } catch (error) {
    console.error('Error submitting new contract:', error);
    alert('An error occurred while adding the contract.');
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
    alert('Please select a document to upload.');
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
      fetchContracts(); // Refresh the list
      alert('Document uploaded successfully.');
    } else {
      alert('Failed to upload document: ' + response.data.message);
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    alert('An error occurred while uploading the document.');
  } finally {
    isUploading.value = false;
    documentToUpload.value = null;
    selectedContractId.value = null;
  }
};
</script>

<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <!-- Changed title to reflect contract management -->
      <h2>{{ t('contracts.title') }}</h2>
      <button class="btn btn-primary" @click="openAddContractModal">
        <i class="bi bi-plus-lg me-2"></i>{{ t('contracts.addNewContract') }}
      </button>
    </div>

    <div class="mb-3">
      <input
        type="text"
        class="form-control"
        v-model="searchTerm"
        :placeholder="t('contracts.searchPlaceholder')"
      />
    </div>

    <div v-if="isLoading" class="text-center">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>

    <div v-else-if="filteredContracts.length > 0" class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th scope="col">{{ t('contracts.tableHeaders.client') }}</th>
            <th scope="col">{{ t('contracts.tableHeaders.office') }}</th>
            <th scope="col">{{ t('contracts.tableHeaders.status') }}</th>
            <th scope="col">{{ t('contracts.tableHeaders.startDate') }}</th>
            <th scope="col">{{ t('contracts.tableHeaders.endDate') }}</th>
            <th scope="col" class="text-center">{{ t('contracts.tableHeaders.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contract in filteredContracts" :key="contract.id">
            <td>{{ contract.Client?.company_name || 'N/A' }}</td>
            <td>{{ contract.Office?.name || 'N/A' }}</td>
            <td>
              <span
                :class="['badge', {
                  'bg-success': contract.status === 'Active',
                  'bg-warning text-dark': contract.status === 'Pending',
                  'bg-danger': contract.status === 'Expired',
                  'bg-secondary': contract.status === 'Terminated'
                }]">
                {{ t(`contracts.status.${contract.status.toLowerCase()}`) }}
              </span>
            </td>
            <td>{{ formatDate(contract.start_date) }}</td>
            <td>{{ formatDate(contract.end_date) }}</td>
            <td class="text-center">
              <button @click="viewDocument(contract.document_url)" :disabled="!contract.document_url" class="btn btn-sm btn-outline-info me-1" :title="t('contracts.viewContract')">
                <i class="bi bi-eye"></i>
              </button>
              <button @click="downloadDocument(contract.document_url)" :disabled="!contract.document_url" class="btn btn-sm btn-outline-primary me-1" :title="t('contracts.downloadContract')">
                <i class="bi bi-download"></i>
              </button>
              <button v-if="!contract.document_url" @click="openUploadDocumentModal(contract.id)" class="btn btn-sm btn-outline-success me-1" :title="t('contracts.uploadDocument')">
                <i class="bi bi-upload"></i>
              </button>
              <button v-if="contract.status === 'Active'" @click="archiveContract(contract.id)" class="btn btn-sm btn-outline-warning" :title="t('contracts.archiveContract')">
                <i class="bi bi-archive"></i>
              </button>
              <button @click="deleteContract(contract.id)" class="btn btn-sm btn-outline-danger ms-1" :title="t('contracts.deleteContract')">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="alert alert-info text-center" role="alert">
      {{ t('contracts.noContractsFound') }}
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" ref="addContractModal" tabindex="-1" aria-labelledby="addContractModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="addContractModalLabel">{{ t('contracts.addNewContract') }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="submitNewContract">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="client" class="form-label">{{ t('contracts.tableHeaders.client') }}</label>
                                <select id="client" class="form-select" v-model="newContract.client_id" required>
                                    <option :value="null" disabled>-- Select Client --</option>
                                    <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.company_name }}</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="office" class="form-label">{{ t('contracts.tableHeaders.office') }}</label>
                                <select id="office" class="form-select" v-model="newContract.office_id" required>
                                    <option :value="null" disabled>-- Select Office --</option>
                                    <option v-for="office in offices" :key="office.id" :value="office.id">{{ office.name }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="start_date" class="form-label">{{ t('contracts.tableHeaders.startDate') }}</label>
                                <input type="date" id="start_date" class="form-control" v-model="newContract.start_date" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="end_date" class="form-label">{{ t('contracts.tableHeaders.endDate') }}</label>
                                <input type="date" id="end_date" class="form-control" v-model="newContract.end_date" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="monthly_rate" class="form-label">{{ t('addClient.form.paymentTerms') }}</label>
                            <input type="number" id="monthly_rate" class="form-control" v-model="newContract.monthly_rate" placeholder="e.g., 50000" required>
                        </div>
                        <div class="mb-3">
                           <label for="contractTaxes" class="form-label">{{ t('manageTaxes.title') }}</label>
                           <select multiple class="form-select" id="contractTaxes" v-model="newContract.tax_ids">
                               <option v-for="tax in availableTaxes" :key="tax.id" :value="tax.id">
                                   {{ tax.name }} ({{ tax.rate }}%)
                               </option>
                           </select>
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
                        {{ isSubmitting ? 'Submitting...' : t('addClient.submitButtonAdd') }}
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
                <label for="contractDocument" class="form-label">{{ t('addClient.form.attachments') }}</label>
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