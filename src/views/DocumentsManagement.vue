<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const documents = ref([]);
const searchTerm = ref('');

// Mock document data - replace with API call
const mockDocuments = [
  {
    id: 'doc001',
    name: 'Client Agreement - Tech Corp',
    type: t('documents.status.contract'),
    status: t('documents.status.active'),
    uploadDate: '2023-01-20',
    expiryDate: '2024-01-20',
  },
  {
    id: 'doc002',
    name: 'NDA - Innovate LLC',
    type: t('documents.status.document'),
    status: t('documents.status.archived'),
    uploadDate: '2022-11-15',
    expiryDate: null,
  },
  {
    id: 'doc003',
    name: 'Lease Agreement - Downtown Office',
    type: t('documents.status.contract'),
    status: t('documents.status.expired'),
    uploadDate: '2021-03-01',
    expiryDate: '2023-03-01',
  },
];

const fetchDocuments = () => {
  setTimeout(() => {
    documents.value = mockDocuments;
  }, 500);
};

onMounted(() => {
  fetchDocuments();
});

const filteredDocuments = computed(() => {
  if (!searchTerm.value) {
    return documents.value;
  }
  return documents.value.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    doc.status.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const viewDocument = (docId) => {
  console.log('View document:', docId);
};

const downloadDocument = (docId) => {
  console.log('Download document:', docId);
};

const archiveDocument = (docId) => {
  const doc = documents.value.find(d => d.id === docId);
  if (doc) {
    doc.status = 'Archived';
  }
};
</script>

<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ t('documents.title') }}</h2>
      <button class="btn btn-primary">
        <i class="bi bi-upload me-2"></i>{{ t('documents.uploadNewDocument') }}
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

    <div v-if="filteredDocuments.length > 0" class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th scope="col">{{ t('documents.tableHeaders.name') }}</th>
            <th scope="col">{{ t('documents.tableHeaders.type') }}</th>
            <th scope="col">{{ t('documents.tableHeaders.status') }}</th>
            <th scope="col">{{ t('documents.tableHeaders.uploadDate') }}</th>
            <th scope="col">{{ t('documents.tableHeaders.expiryDate') }}</th>
            <th scope="col">{{ t('documents.tableHeaders.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filteredDocuments" :key="doc.id">
            <td>{{ doc.name }}</td>
            <td>{{ doc.type }}</td>
            <td>
              <span 
                :class="['badge',
                         doc.status === t('documents.status.active') ? 'bg-success' :
                         doc.status === t('documents.status.archived') ? 'bg-secondary' :
                         'bg-danger']">
                {{ doc.status }}
              </span>
            </td>
            <td>{{ doc.uploadDate }}</td>
            <td>{{ doc.expiryDate || t('documents.notApplicable') }}</td>
            <td>
              <button @click="viewDocument(doc.id)" class="btn btn-sm btn-outline-info me-1" :title="t('documents.view')">
                <i class="bi bi-eye"></i>
              </button>
              <button @click="downloadDocument(doc.id)" class="btn btn-sm btn-outline-primary me-1" :title="t('documents.download')">
                <i class="bi bi-download"></i>
              </button>
              <button v-if="doc.status === t('documents.status.active')" @click="archiveDocument(doc.id)" class="btn btn-sm btn-outline-warning" :title="t('documents.archive')">
                <i class="bi bi-archive"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="alert alert-info text-center" role="alert">
      {{ t('documents.noDocumentsFound') }}
    </div>
  </div>
</template>

<style scoped>
.table-hover tbody tr:hover {
  background-color: #f8f9fa;
}
</style>