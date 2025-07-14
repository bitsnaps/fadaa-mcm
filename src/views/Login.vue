<template>
  <div class="login-container d-flex justify-content-center align-items-center vh-100">
    <div class="card p-4 shadow" style="width: 100%; max-width: 400px;">
      <div class="card-body">
        <h2 class="card-title text-center mb-4">Login</h2>
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="email" class="form-label">Email address</label>
            <input type="email" class="form-control" id="email" v-model="email" required placeholder="name@example.com">
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" class="form-control" id="password" v-model="password" required placeholder="Password">
          </div>
          <button type="submit" class="btn btn-fadaa-primary w-100">Login <i class="bi bi-box-arrow-in-right"></i></button>
        </form>
        <p v-if="error" class="text-danger text-center mt-3">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import apiClient from '@/services/ApiClient';

const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
    if (!email.value || !password.value) {
        error.value = 'Please enter both email and password.';
        return;
    }

    try {
        const response = await apiClient.post('/login', {
            email: email.value,
            password: password.value,
        });

        const { user, token } = response.data;
        authStore.login(user, token);

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
    } catch (err) {
        console.error(err);
        error.value = err.response?.data?.message || 'Invalid credentials. Please try again.';
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