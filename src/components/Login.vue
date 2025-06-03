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

const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const handleLogin = () => {
  // Mock login logic
  if (email.value === 'superadmin@fadaa.com' && password.value === 'password') {
    // Simulate successful login for superadmin
    localStorage.setItem('userRole', 'superadmin');
    localStorage.setItem('isAuthenticated', 'true');
    router.push('/superadmin-dashboard');
  } else if (email.value === 'investor@fadaa.com' && password.value === 'password') {
    // Simulate successful login for investor
    localStorage.setItem('userRole', 'investor');
    localStorage.setItem('isAuthenticated', 'true');
    router.push('/investor-dashboard');
  } else if (email.value === 'assistant@fadaa.com' && password.value === 'password') {
    // Simulate successful login for assistant
    localStorage.setItem('userRole', 'assistant');
    localStorage.setItem('isAuthenticated', 'true');
    router.push('/assistant-dashboard');
  } else if (email.value === 'investor@fadaa.com' && password.value === 'password') {
    // Simulate successful login for investor
    localStorage.setItem('userRole', 'investor');
    localStorage.setItem('isAuthenticated', 'true');
    router.push('/investor-dashboard');
  } else {
    error.value = 'Invalid credentials. Please try again.';
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
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