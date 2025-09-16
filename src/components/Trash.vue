<template>
  <div>
    <div class="d-flex justify-content-between align-items-center my-4">
      <input
        type="text"
        class="form-control"
        v-model="searchTerm"
        :placeholder="t('fileManager.searchPlaceholder')"
        @input="fetchTrashedFiles"
      />
      <button class="btn btn-danger ms-3" @click="emptyTrash" :disabled="!files.length">{{ t('trash.emptyTrash') }}</button>
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
        :empty-text="t('trash.noFilesFound')"
      >
        <template #cell(size)="data">
          {{ formatBytes(data.value) }}
        </template>
        <template #cell(createdAt)="data">
          {{ new Date(data.value).toLocaleDateString() }}
        </template>
        <template #cell(actions)="data">
          <div class="text-center">
            <button class="btn btn-sm btn-danger" @click="permanentDeleteFile(data.item)">{{ t('common.delete') }}</button>
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
      {{ t('trash.noFilesFound') }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineExpose, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BTable, BPagination, BButton } from 'bootstrap-vue-next';
import TrashManagerService from '@/services/TrashManagerService';
import { formatBytes } from '@/helpers/files';

const { t } = useI18n();
const files = ref([]);
const isLoading = ref(true);
const searchTerm = ref('');

// Table state
const currentPage = ref(1);
const perPage = ref(5);
const sortBy = ref(['createdAt']);
const sortDesc = ref(true);
const pagination = ref({
  total: 0,
});

const fetchTrashedFiles = async () => {
  try {
    isLoading.value = true;
    const response = await TrashManagerService.listTrash(currentPage.value, perPage.value, searchTerm.value);
    if (response.data.success) {
      files.value = response.data.data;
      pagination.value.total = response.data.pagination.total;
    } else {
      files.value = [];
    }
  } catch (error) {
    console.error('An error occurred while fetching trashed files:', error);
    files.value = [];
  } finally {
    isLoading.value = false;
  }
};

const tableFields = computed(() => [
  { key: 'name', label: t('trash.tableHeaders.name'), sortable: true },
  { key: 'size', label: t('trash.tableHeaders.size'), sortable: true },
  { key: 'createdAt', label: t('trash.tableHeaders.dateTrashed'), sortable: true },
  { key: 'actions', label: t('trash.tableHeaders.actions') }
]);

const permanentDeleteFile = async (file) => {
  if (confirm(t('trash.deleteConfirm', { fileName: file.name }))) {
    try {
      const relativePath = file.path.startsWith('/uploads/trash') ? file.path.substring('/uploads/trash'.length) : file.path;
      const response = await TrashManagerService.permanentDeleteFile(relativePath);
      if (response.data.success) {
        fetchTrashedFiles();
      }
    } catch (error) {
      console.error('Error permanently deleting file:', error);
    }
  }
};

const emptyTrash = async () => {
  if (confirm(t('trash.emptyConfirm'))) {
    try {
      const response = await TrashManagerService.emptyTrash();
      if (response.data.success) {
        fetchTrashedFiles();
      }
    } catch (error) {
      console.error('Error emptying trash:', error);
    }
  }
};

onMounted(fetchTrashedFiles);

watch(currentPage, fetchTrashedFiles);

defineExpose({
  fetchTrashedFiles,
});
</script>