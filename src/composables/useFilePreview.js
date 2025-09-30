import { ref } from 'vue';
import * as bootstrap from 'bootstrap';

export function useFilePreview() {
  const selectedFile = ref(null);
  let modalInstance = null;

  const openPreviewModal = (file) => {
    selectedFile.value = file;
    const modalElement = document.getElementById('filePreviewModal');
    if (modalElement) {
      modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  };

  return {
    selectedFile,
    openPreviewModal,
  };
}