<script setup>
import { ref, watch, computed, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import apiClient from '@/services/ApiClient';

const props = defineProps({
  file: {
    type: [File, Object],
    required: true,
  },
});

const { t } = useI18n();
const fileUrl = ref(null);
const fileType = ref('');

const getMimeType = (fileName) => {
  if (!fileName) return '';
  const extension = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    pdf: 'application/pdf',
    txt: 'text/plain',
  };
  return mimeTypes[extension] || ''; // Unsupported
};

const isImage = computed(() => fileType.value.startsWith('image/'));
const isPdf = computed(() => fileType.value === 'application/pdf');
const isText = computed(() => fileType.value.startsWith('text/'));

const fetchAndSetFile = async (file) => {
  try {
    const response = await apiClient.get(`/files/download/${encodeURIComponent(file.file_path)}`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    fileUrl.value = URL.createObjectURL(blob);
    fileType.value = response.headers['content-type'];
  } catch (error) {
    console.error('Error fetching file for preview:', error);
  }
};

watch(() => props.file, (newFile) => {
  if (newFile) {
    if (newFile instanceof File) {
      fileUrl.value = URL.createObjectURL(newFile);
      fileType.value = newFile.type;
    } else {
      fetchAndSetFile(newFile);
    }
  }
}, { immediate: true, deep: true });

onUnmounted(() => {
  if (fileUrl.value && fileUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(fileUrl.value);
  }
});

</script>

<template>
  <div class="file-preview">
    <div v-if="isImage">
      <img :src="fileUrl" class="img-fluid" :alt="t('filePreview.imageAlt')" />
    </div>
    <div v-else-if="isPdf">
      <object :data="fileUrl" type="application/pdf" width="100%" height="500px">
        <p>{{ t('filePreview.pdfNotSupported') }}</p>
      </object>
    </div>
    <div v-else-if="isText">
      <iframe :src="fileUrl" width="100%" height="500px"></iframe>
    </div>
    <div v-else>
      <p>{{ t('filePreview.unsupported') }} - {{ fileUrl }}</p>
    </div>
  </div>
</template>

<style scoped>
.file-preview {
  margin-top: 1rem;
}
</style>