<template>
  <div class="container-fluid mt-4">
    <h1 class="h3 mb-4 text-gray-800">File Manager</h1>

    <BTabs v-model:index="activeTab" @activate-tab="handleTabActivation">
      <BTab title="Files" :active="activeTab === 0">
        <div class="mb-3 mt-3">
          <input type="text" class="form-control" placeholder="Search by name..." v-model="searchQuery">
        </div>

        <table class="table table-bordered">
          <thead>
            <tr>
              <th @click="sortBy('name')">Name</th>
              <th @click="sortBy('source')">Source</th>
              <th @click="sortBy('size')">Size</th>
              <th @click="sortBy('createdAt')">Date Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in filteredAndSortedFiles" :key="file.path">
              <td>{{ file.name }}</td>
              <td>{{ file.source }}</td>
              <td>{{ formatBytes(file.size) }}</td>
              <td>{{ new Date(file.createdAt).toLocaleDateString() }}</td>
              <td>
                <BButton variant="danger" size="sm" @click="deleteFile(file)"><i class="bi bi-trash"></i></BButton>
              </td>
            </tr>
          </tbody>
        </table>
      </BTab>
      <BTab title="Trash" :active="activeTab === 1">
        <Trash ref="trash" @file-restored="fetchFiles" />
      </BTab>
    </BTabs>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import FileManagerService from '@/services/FileManagerService';
import Trash from '@/components/Trash.vue';
import { formatBytes } from '@/helpers/files';

const files = ref([]);
const searchQuery = ref('');
const sortKey = ref('name');
const sortOrder = ref('asc');
const activeTab = ref(0);
const trash = ref(null);

const fetchFiles = async () => {
  try {
    const response = await FileManagerService.listFiles();
    if (response.data.success) {
      files.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching files:', error);
  }
};

const handleTabActivation = (newTabIndex) => {
  if (newTabIndex === 0) {
    fetchFiles();
  } else if (newTabIndex === 1) {
    trash.value.fetchTrashedFiles();
  }
};

const filteredAndSortedFiles = computed(() => {
  let filtered = files.value;
  if (searchQuery.value) {
    filtered = filtered.filter(file =>
      file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  return filtered.sort((a, b) => {
    const keyA = a[sortKey.value];
    const keyB = b[sortKey.value];
    if (keyA < keyB) return sortOrder.value === 'asc' ? -1 : 1;
    if (keyA > keyB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const deleteFile = async (file) => {
  if (confirm(`Are you sure you want to delete ${file.name}?`)) {
    try {
      const relativePath = file.path.startsWith('/uploads') ? file.path.substring('/uploads'.length) : file.path;
      const response = await FileManagerService.deleteFile(relativePath);
      if (response.data.success) {
        fetchFiles();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
};

onMounted(fetchFiles);
</script>