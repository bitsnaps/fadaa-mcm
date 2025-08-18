<template>
  <div class="login-container d-flex justify-content-center align-items-center vh-100">
    <div class="card p-4 shadow" style="width: 100%; max-width: 400px;">
      <div class="card-body">
        <h2 class="card-title text-center mb-4">{{ t('login.title') }}</h2>
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="email" class="form-label">{{ t('login.emailLabel') }}</label>
            <input type="email" class="form-control" id="email" v-model="email" required :placeholder="t('login.emailPlaceholder')">
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">{{ t('login.passwordLabel') }}</label>
            <input type="password" class="form-control" id="password" v-model="password" required :placeholder="t('login.passwordPlaceholder')">
          </div>
          <button type="submit" class="btn btn-fadaa-primary w-100">{{ t('login.loginButton') }} <i class="bi bi-box-arrow-in-right"></i></button>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/helpers/toast';

const { t } = useI18n();
const email = ref(import.meta.env.DEV?import.meta.env.VITE_DEFAULT_USER:'');
const password = ref(import.meta.env.DEV?import.meta.env.VITE_DEFAULT_PASSWORD:'');

const router = useRouter();
const authStore = useAuthStore();
const { showErrorToast, showSuccessToast } = useToast();

const handleLogin = async () => {
    if (!email.value || !password.value) {
        showErrorToast(t('login.error.missingCredentials'));
        return;
    }

    try {
        const success = await authStore.login({
            email: email.value,
            password: password.value,
        });
        if (success) {
          showSuccessToast(t('login.success'));
          switch (authStore.userRole) {
              case 'admin':
                  router.push('/admin-dashboard');
                  break;
              case 'assistant':
                  router.push('/assistant-dashboard');
                  break;
              case 'investor':
                  router.push('/investor-dashboard');
                  break;
              case 'client':
                  router.push('/client-portal');
                  break;
              default:
                  router.push('/login');
          }
      } else {
        showErrorToast(t('login.error.invalidCredentials'));
      }
    } catch (err) {
        console.error(err.message);
        if (err.response?.status === 401) {
          showErrorToast(t('login.error.invalidCredentials'));
        } else if (err.response?.data?.message) {
          showErrorToast(t('login.error.backendError', { message: err.response.data.message }));
        } else {
          showErrorToast(t('login.error.unknown'));
        }
    }
};
</script>

<style scoped>
/* Centering the login form on the page */
.login-container {
  min-height: calc(100vh - 110px); /* Adjust based on navbar and footer height */
}

/* .btn-fadaa-primary is defined in style.css */

/* Optional: Style for the card if needed, though Bootstrap's default is usually fine */
.card {
  border-radius: 0.5rem;
}
</style>