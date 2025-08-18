import { useToastController as useBvToast } from 'bootstrap-vue-next/composables';

export function useToast() {
  const toast = useBvToast();

  const showToast = (message, options = {}) => {
    const { variant = 'success', title = 'Notification' } = options;
    toast.show({
      props: {
        title: title,
        body: message,
        variant: variant,
        autoHide: true,
        delay: 5000,
      }
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
