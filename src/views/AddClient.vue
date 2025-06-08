<script setup>
  import { ref } from 'vue';
  import { apiClient } from '@/services/ApiClient'; // Assuming mock is set up for /clients
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  const client = ref({
    name: '',
    email: '',
    phone: '',
    // Initialize other fields from PRD 4.4.1
  });

  const submitForm = async () => {
    try {
        const response = await apiClient.post('/clients', client.value);
        console.log('Client added:', response.data);
        alert('Client added successfully!');
        router.push('/manage-clients');
    } catch (error) {
        console.error('Error adding client:', error);
        alert('Failed to add client.');
    }
}

  </script>

<template>
    <div class="container mt-4">
      <h2>Add New Client</h2>
      <form @submit.prevent="submitForm">
        <div class="mb-3">
          <label for="clientName" class="form-label">Client Name</label>
          <input type="text" class="form-control" id="clientName" v-model="client.name" required>
        </div>
        <div class="mb-3">
          <label for="clientEmail" class="form-label">Email</label>
          <input type="email" class="form-control" id="clientEmail" v-model="client.email" required>
        </div>
        <div class="mb-3">
          <label for="clientPhone" class="form-label">Phone</label>
          <input type="tel" class="form-control" id="clientPhone" v-model="client.phone">
        </div>
        <!-- Add more fields as per PRD 4.4.1 -->
        <button type="submit" class="btn btn-primary me-2">Save Client</button>
        <router-link to="/manage-clients" class="btn btn-secondary">Cancel</router-link>
      </form>
    </div>
  </template>
  
<style scoped>
  /* Add component-specific styles here */
</style>