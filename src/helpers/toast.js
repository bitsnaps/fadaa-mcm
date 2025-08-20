import { useToastController } from 'bootstrap-vue-next/composables';

export function useToast() {
  const toast = useToastController();

  const showToast = (message, options = {}) => {
    const { variant = 'info', title = 'Notification' } = options;
    toast.show({
        title,
        body: message,
        variant,
        pos: 'top-center',
        autoHide: true,
        noCloseButton: true,
        noHoverPause: false,
        value: 1000
    });
  };

  const showErrorToast = (message, title = 'Error') => {
    showToast(message, { variant: 'danger', title });
  };

  const showSuccessToast = (message, title = 'Success') => {
    showToast(message, { variant: 'success', title });
  };

  const showInfoToast = (message, title = 'Info') => {
    showToast(message, { variant: 'info', title });
  };

  return {
    showToast,
    showErrorToast,
    showSuccessToast,
    showInfoToast,
  };
}
