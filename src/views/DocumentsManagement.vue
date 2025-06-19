<script setup>
import { ref, computed, onMounted } from 'vue';

const documents = ref([]);
const searchTerm = ref('');

// Mock document data - replace with API call
const mockDocuments = [
  {
    id: 'doc001',
    name: 'Client Agreement - Tech Corp',
    type: 'Contract',
    status: 'Active',
    uploadDate: '2023-01-20',
    expiryDate: '2024-01-20',
  },
  {
    id: 'doc002',
    name: 'NDA - Innovate LLC',
    type: 'Document',
    status: 'Archived',
    uploadDate: '2022-11-15',
    expiryDate: null,
  },
  {
    id: 'doc003',
    name: 'Lease Agreement - Downtown Office',
    type: 'Contract',
    status: 'Expired',
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
      <h2>Documents and Contracts</h2>
      <button class="btn btn-primary">
        <i class="bi bi-upload me-2"></i>Upload New Document
      </button>
    </div>

    <div class="mb-3">
      <input 
        type="text" 
        class="form-control" 
        v-model="searchTerm" 
        placeholder="Search by name, type, or status..."
      />
    </div>

    <div v-if="filteredDocuments.length > 0" class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col">Upload Date</th>
            <th scope="col">Expiry Date</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filteredDocuments" :key="doc.id">
            <td>{{ doc.name }}</td>
            <td>{{ doc.type }}</td>
            <td>
              <span 
                :class="['badge', 
                         doc.status === 'Active' ? 'bg-success' : 
                         doc.status === 'Archived' ? 'bg-secondary' : 
                         'bg-danger']">
                {{ doc.status }}
              </span>
            </td>
            <td>{{ doc.uploadDate }}</td>
            <td>{{ doc.expiryDate || 'N/A' }}</td>
            <td>
              <button @click="viewDocument(doc.id)" class="btn btn-sm btn-outline-info me-1" title="View">
                <i class="bi bi-eye"></i>
              </button>
              <button @click="downloadDocument(doc.id)" class="btn btn-sm btn-outline-primary me-1" title="Download">
                <i class="bi bi-download"></i>
              </button>
              <button v-if="doc.status === 'Active'" @click="archiveDocument(doc.id)" class="btn btn-sm btn-outline-warning" title="Archive">
                <i class="bi bi-archive"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="alert alert-info text-center" role="alert">
      No documents found.
    </div>
  </div>
</template>

<style scoped>
.table-hover tbody tr:hover {
  background-color: #f8f9fa;
}
</style>