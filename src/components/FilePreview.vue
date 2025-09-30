<script setup>
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  file: {
    type: [File, Object],
    required: true,
  },
});

const { t } = useI18n();
const fileUrl = ref(null);
const fileType = ref('');

const isImage = computed(() => fileType.value.startsWith('image/'));
const isPdf = computed(() => fileType.value === 'application/pdf');
const isText = computed(() => fileType.value.startsWith('text/'));

watch(() => props.file, (newFile) => {
  if (newFile) {
    if (newFile instanceof File) {
      fileUrl.value = URL.createObjectURL(newFile);
      fileType.value = newFile.type;
    } else {
      fileUrl.value = newFile.file_path;
      fileType.value = newFile.file_name.split('.').pop();
    }
  }
}, { immediate: true });

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
      <p>{{ t('filePreview.unsupported') }}</p>
    </div>
  </div>
</template>

<style scoped>
.file-preview {
  margin-top: 1rem;
}
</style>