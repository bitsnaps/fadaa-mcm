<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getDocuments, getClientsList, getInvestmentsList, addDocument } from '@/services/ApiClient';
import { useAuthStore } from '@/stores/auth';
import { Modal } from 'bootstrap';
import { format } from 'date-fns';

const { t } = useI18n();
const authStore = useAuthStore();

const documents = ref([]);
const searchTerm = ref('');
const isLoading = ref(true);
const isSubmitting = ref(false);

const addDocumentModal = ref(null);
const newDocument = ref({
  client_id: null,
  investment_id: null,
  title: '',
  type: 'Other',
  document: null,
});
const clients = ref([]);
const allInvestments = ref([]);
const filteredInvestments = ref([]);

const fetchDocuments = async () => {
  try {
    isLoading.value = true;
    const response = await getDocuments();
    if (response.data.success) {
      documents.value = response.data.documents;
    } else {
      console.error('Failed to fetch documents:', response.data.message);
    }
  } catch (error) {
    console.error('An error occurred while fetching documents:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchDocuments();
});

const filteredDocuments = computed(() => {
  if (!searchTerm.value) {
    return documents.value;
  }
  return documents.value.filter(doc =>
    (doc.title?.toLowerCase() || '').includes(searchTerm.value.toLowerCase()) ||
    (doc.type?.toLowerCase() || '').includes(searchTerm.value.toLowerCase()) ||
    (doc.Client?.company_name?.toLowerCase() || '').includes(searchTerm.value.toLowerCase()) ||
    (doc.investment?.name?.toLowerCase() || '').includes(searchTerm.value.toLowerCase())
  );
});

watch(() => newDocument.value.client_id, (newClientId) => {
  newDocument.value.investment_id = null;
  if (newClientId) {
    const client = clients.value.find(c => c.id === newClientId);
    if (client && client.Investments) {
      filteredInvestments.value = allInvestments.value.filter(inv =>
        client.Investments.some(ci => ci.id === inv.id)
      );
    } else {
      filteredInvestments.value = [];
    }
  } else {
    filteredInvestments.value = [];
  }
}, { immediate: true });

const formatDate = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'yyyy-MM-dd');
};

const viewDocument = (docUrl) => {
  if (docUrl) {
    window.open(docUrl, '_blank');
  } else {
    console.log('No document URL to view.');
  }
};

const downloadDocument = (docUrl) => {
  if (docUrl) {
    const link = document.createElement('a');
    link.href = docUrl;
    link.setAttribute('download', '');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    console.log('No document URL to download.');
  }
};

const openAddDocumentModal = async () => {
  try {
    const [clientsResponse, investmentsResponse] = await Promise.all([
      getClientsList(),
      getInvestmentsList()
    ]);
    if (clientsResponse.data.success) {
      clients.value = clientsResponse.data.data;
    }
    if (investmentsResponse.data.success) {
      allInvestments.value = investmentsResponse.data.investments;
    }
    const modalInstance = Modal.getOrCreateInstance(addDocumentModal.value);
    modalInstance.show();
  } catch (error) {
    console.error('Error fetching data for modal:', error);
  }
};

const handleFileChange = (event) => {
  newDocument.value.document = event.target.files[0];
};

const submitNewDocument = async () => {
  isSubmitting.value = true;
  const formData = new FormData();
  
  // Add user id to the form data
  formData.append('uploaded_by_user_id', authStore.user.id);

  Object.keys(newDocument.value).forEach(key => {
    if (newDocument.value[key]) {
      formData.append(key, newDocument.value[key]);
    }
  });

  try {
    const response = await addDocument(formData);
    if (response.data.success) {
      const modalInstance = Modal.getInstance(addDocumentModal.value);
      modalInstance.hide();
      fetchDocuments(); // Refresh the list
      newDocument.value = { client_id: null, investment_id: null, title: '', type: 'Other', document: null };
    } else {
      alert('Failed to add document: ' + response.data.message);
    }
  } catch (error) {
    console.error('Error submitting new document:', error);
    alert('An error occurred while adding the document.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ t('documents.title') }}</h2>
      <button class="btn btn-primary" @click="openAddDocumentModal">
        <i class="bi bi-plus-lg me-2"></i>{{ t('documents.uploadNewDocument') }}
      </button>
    </div>

    <div class="mb-3">
      <input
        type="text"
        class="form-control"
        v-model="searchTerm"
        :placeholder="t('documents.searchPlaceholder')"
      />
    </div>

    <div v-if="isLoading" class="text-center">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>

    <div v-else-if="filteredDocuments.length > 0" class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th scope="col">{{ t('documents.tableHeaders.name') }}</th>
            <th scope="col">{{ t('documents.tableHeaders.client') }}</th>
            <th scope="col">{{ t('documents.tableHeaders.investment') }}</th>
            <th scope="col">{{ t('documents.tableHeaders.type') }}</th>
            <th scope="col">{{ t('documents.tableHeaders.uploadDate') }}</th>
            <th scope="col" class="text-center">{{ t('documents.tableHeaders.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filteredDocuments" :key="doc.id">
            <td>{{ doc.title }}</td>
            <td>{{ doc.Client?.company_name || 'N/A' }}</td>
            <td>{{ doc.investment?.name || 'N/A' }}</td>
            <td>{{ doc.type }}</td>
            <td>{{ formatDate(doc.created_at) }}</td>
            <td class="text-center">
              <button @click="viewDocument(doc.file_path)" :disabled="!doc.file_path" class="btn btn-sm btn-outline-info me-1" :title="t('documents.view')">
                <i class="bi bi-eye"></i>
              </button>
              <button @click="downloadDocument(doc.file_path)" :disabled="!doc.file_path" class="btn btn-sm btn-outline-primary me-1" :title="t('documents.download')">
                <i class="bi bi-download"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="alert alert-info text-center" role="alert">
      {{ t('documents.noDocumentsFound') }}
    </div>

    <!-- Add Document Modal -->
    <div class="modal fade" ref="addDocumentModal" tabindex="-1" aria-labelledby="addDocumentModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addDocumentModalLabel">{{ t('documents.uploadNewDocument') }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitNewDocument">
              <div class="mb-3">
                <label for="doc-title" class="form-label">{{ t('documents.tableHeaders.name') }}</label>
                <input type="text" id="doc-title" class="form-control" v-model="newDocument.title" required>
              </div>
              <div class="mb-3">
                <label for="doc-client" class="form-label">{{ t('documents.tableHeaders.client') }}</label>
                <select id="doc-client" class="form-select" v-model="newDocument.client_id" required>
                  <option :value="null" disabled>-- Select Client --</option>
                  <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.company_name }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="doc-investment" class="form-label">{{ t('documents.tableHeaders.investment') }}</label>
                <select id="doc-investment" class="form-select" v-model="newDocument.investment_id" :disabled="!newDocument.client_id">
                  <option :value="null">-- {{ t('documents.selectInvestment') }} --</option>
                  <option v-for="investment in filteredInvestments" :key="investment.id" :value="investment.id">{{ investment.name }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="doc-type" class="form-label">{{ t('documents.tableHeaders.type') }}</label>
                <select id="doc-type" class="form-select" v-model="newDocument.type" required>
                  <option>Contract</option>
                  <option>Report</option>
                  <option>Identification</option>
                  <option>Other</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="document-file" class="form-label">{{ t('addClient.form.attachments') }}</label>
                <input type="file" id="document-file" class="form-control" @change="handleFileChange" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('manageUsers.cancel') }}</button>
            <button type="button" class="btn btn-primary" @click="submitNewDocument" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ isSubmitting ? 'Submitting...' : t('addClient.submitButtonAdd') }}
            </button>
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