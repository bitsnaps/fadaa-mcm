<template>
  <div>
    <h2 class="h4 mb-3">Trash</h2>

    <button class="btn btn-danger mb-3" @click="emptyTrash" :disabled="trashedFiles.length === 0">Empty Trash</button>

    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Name</th>
          <th>Size</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in trashedFiles" :key="file.path">
          <td>{{ file.name }}</td>
          <td>{{ formatBytes(file.size) }}</td>
          <td>{{ new Date(file.createdAt).toLocaleDateString() }}</td>
          <td>
            <!-- <button class="btn btn-sm btn-success me-2" @click="restoreFile(file)">Restore</button> -->
            <button class="btn btn-sm btn-danger" @click="permanentDeleteFile(file)">Delete Permanently</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TrashManagerService from '@/services/TrashManagerService';
// import { useToast } from '@/helpers/toast';
import { formatBytes } from '@/helpers/files';

// const { showErrorToast, showSuccessToast, showInfoToast } = useToast();

const trashedFiles = ref([]);
const emit = defineEmits(['file-restored']);

const fetchTrashedFiles = async () => {
  try {
    const response = await TrashManagerService.listTrash();
    if (response.data.success) {
      trashedFiles.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching trashed files:', error);
  }
};

// const restoreFile = async (file) => {
//   if (confirm(`Are you sure you want to restore ${file.name}?`)) {
//     try {
//       const response = await TrashManagerService.restoreFile(file.name);
//       if (response.data.success) {
//         showSuccessToast(response.data.message);
//         fetchTrashedFiles();
//         emit('file-restored');
//       }
//     } catch (error) {
//       console.error('Error restoring file:', error);
//       showErrorToast(error.response?.data?.message || 'Failed to restore file');
//     }
//   }
// };

const permanentDeleteFile = async (file) => {
  if (confirm(`Are you sure you want to permanently delete ${file.name}?`)) {
    try {
      const relativePath = file.path.startsWith('/uploads/trash') ? file.path.substring('/uploads/trash'.length) : file.path;
      const response = await TrashManagerService.permanentDeleteFile(relativePath);
      if (response.data.success) {
        // showSuccessToast(response.data.message);
        fetchTrashedFiles();
      }
    } catch (error) {
      console.error('Error permanently deleting file:', error);
      // showErrorToast(error.response?.data?.message || 'Failed to permanently delete file');
    }
  }
};

const emptyTrash = async () => {
  if (confirm('Are you sure you want to empty the trash? This action cannot be undone.')) {
    try {
      const response = await TrashManagerService.emptyTrash();
      if (response.data.success) {
        // showSuccessToast(response.data.message);
        fetchTrashedFiles();
      }
    } catch (error) {
      console.error('Error emptying trash:', error);
      // showErrorToast(error.response?.data?.message || 'Failed to empty trash');
    }
  }
};

onMounted(fetchTrashedFiles);
</script>