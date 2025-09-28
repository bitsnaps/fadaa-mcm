import { ref, computed } from 'vue';

export function usePasswordToggle() {
  const passwordFieldType = ref('password');

  const togglePasswordVisibility = () => {
    passwordFieldType.value = passwordFieldType.value === 'password' ? 'text' : 'password';
  };

  const isPasswordVisible = computed(() => passwordFieldType.value === 'text');

  return {
    passwordFieldType,
    isPasswordVisible,
    togglePasswordVisibility,
  };
}