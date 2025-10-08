<template>
  <div class="container-fluid mt-4">
    <h1 class="h3 mb-4 text-gray-800">{{ t('fileManager.title') }}</h1>

    <BTabs v-model:index="activeTab" @activate-tab="handleTabActivation">
      <BTab :title="t('fileManager.title')" :active="activeTab === 0">
        <div class="d-flex justify-content-between align-items-center my-4">
          <input
            type="text"
            class="form-control"
            v-model="searchTerm"
            :placeholder="t('fileManager.searchPlaceholder')"
            @input="fetchFiles"
          />
        </div>

        <div v-if="isLoading" class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">{{ t('loading') }}</span>
          </div>
        </div>

        <div v-else-if="files.length > 0">
          <BTable
            :items="files"
            :fields="tableFields"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
            responsive
            striped
            hover
            show-empty
            :empty-text="t('fileManager.noFilesFound')"
          >
            <template #cell(size)="data">
              {{ formatBytes(data.value) }}
            </template>
            <template #cell(createdAt)="data">
              {{ new Date(data.value).toLocaleDateString() }}
            </template>
            <template #cell(actions)="data">
              <div class="text-center">
                <BButton variant="info" size="sm" class="me-2" @click="previewFile(data.item)"><i class="bi bi-eye"></i></BButton>
                <BButton variant="primary" size="sm" class="me-2" @click="downloadFile(data.item)"><i class="bi bi-download"></i></BButton>
                <BButton variant="danger" size="sm" @click="deleteFile(data.item)"><i class="bi bi-trash"></i></BButton>
              </div>
            </template>
          </BTable>

          <div class="d-flex justify-content-center mt-3">
            <BPagination
              v-model="currentPage"
              :total-rows="pagination.total"
              :per-page="perPage"
            />
          </div>
        </div>
        <div v-else class="alert alert-info text-center" role="alert">
          {{ t('fileManager.noFilesFound') }}
        </div>
      </BTab>
      <BTab :title="t('trash.title')" :active="activeTab === 1">
        <Trash ref="trash" />
      </BTab>
    </BTabs>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BTable, BPagination, BButton, BTabs, BTab } from 'bootstrap-vue-next';
import FileManagerService from '@/services/FileManagerService';
import Trash from '@/components/Trash.vue';
import { formatBytes } from '@/helpers/files';

const { t } = useI18n();
const files = ref([]);
const isLoading = ref(true);
const searchTerm = ref('');
const activeTab = ref(0);
const trash = ref(null);

// Table state
const currentPage = ref(1);
const perPage = ref(5);
const sortBy = ref(['createdAt']);
const sortDesc = ref(true);
const pagination = ref({
  total: 0,
});

const fetchFiles = async () => {
  try {
    isLoading.value = true;
    const response = await FileManagerService.listFiles(currentPage.value, perPage.value, searchTerm.value);
    if (response.data.success) {
      files.value = response.data.data;
      pagination.value.total = response.data.pagination.total;
    } else {
      files.value = [];
    }
  } catch (error) {
    console.error('An error occurred while fetching files:', error);
    files.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleTabActivation = (newTabIndex) => {
  if (newTabIndex === 0) {
    fetchFiles();
  } else if (newTabIndex === 1) {
    trash.value.fetchTrashedFiles();
  }
};

const tableFields = computed(() => [
  { key: 'name', label: t('fileManager.tableHeaders.name'), sortable: true },
  { key: 'source', label: t('fileManager.tableHeaders.source'), sortable: true },
  { key: 'size', label: t('fileManager.tableHeaders.size'), sortable: true },
  { key: 'createdAt', label: t('fileManager.tableHeaders.dateUploaded'), sortable: true },
  { key: 'actions', label: t('fileManager.tableHeaders.actions') }
]);

const previewFile = async (file) => {
  try {
    const response = await FileManagerService.previewFile(file.path);
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    window.open(url);
  } catch (error) {
    console.error('Error previewing file:', error);
  }
};

const downloadFile = async (file) => {
  try {
    const response = await FileManagerService.downloadFile(file.path);
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};

const deleteFile = async (file) => {
  if (confirm(t('fileManager.deleteConfirm', { fileName: file.name }))) {
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

watch(currentPage, fetchFiles);
</script>