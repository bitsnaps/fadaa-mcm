import { useToastController } from 'bootstrap-vue-next/composables';

export function useToast() {
  const toast = useToastController();

  const showToast = (message, options = {}) => {
    const { variant = 'info', title = 'Notification' } = options;
    toast.show({
      title: title,
      body: message,
      variant: variant,
      pos: 'top-center',
      autoHide: true,
      value: 3000
    });
  };

  const showErrorToast = (message, title = 'Error') => {
    showToast(message, { variant: 'danger', title });
  };

  const showSuccessToast = (message, title = 'Success') => {
    showToast(message, { variant: 'success', title });
  };

  return {
    showToast,
    showErrorToast,
    showSuccessToast,
  };
}
