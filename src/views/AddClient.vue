<script setup>
import { ref, onMounted, computed } from 'vue';
import { apiClient } from '@/services/ApiClient';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const clientId = ref(route.params.clientId || null);

const client = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  clientType: '', // e.g., 'Individual', 'Company'
  serviceType: '', // e.g., 'Domiciliation', 'Office Rental'
  idType: '', // e.g., 'National ID', 'Passport', 'Trade Register'
  idNumber: '',
  idExpiryDate: '',
  taxId: '', // NIF
  nis: '', // NIS for companies
  rcNumber: '', // RC Number for companies
  contactPersonName: '',
  contactPersonEmail: '',
  contactPersonPhone: '',
  contractStartDate: '',
  contractEndDate: '',
  paymentTerms: '', // e.g., 'Monthly', 'Quarterly', 'Annually'
  officeId: null, // To be linked with office booking
  attachments: [], // For file uploads
  status: 'Active', // Default status
});

const pageTitle = computed(() => clientId.value ? 'Edit Client' : 'Add New Client');
const submitButtonText = computed(() => clientId.value ? 'Update Client' : 'Add Client');

// Mock data for demonstration as API for single client fetch is not defined
const mockClients = [
  {
    id: 'cli001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-1234',
    address: '123 Main St',
    city: 'Anytown',
    country: 'USA',
    clientType: 'Individual',
    serviceType: 'Domiciliation',
    idType: 'Passport',
    idNumber: 'X1234567',
    idExpiryDate: '2028-12-31',
    taxId: 'NIF12345',
    nis: '',
    rcNumber: '',
    contactPersonName: 'John Doe',
    contactPersonEmail: 'john.doe@example.com',
    contactPersonPhone: '555-1234',
    contractStartDate: '2023-01-15',
    contractEndDate: '2024-01-14',
    paymentTerms: 'Monthly',
    officeId: 101,
    status: 'Active',
  },
  {
    id: 'cli002',
    name: 'Jane Smith Inc.',
    email: 'jane.smith@example.com',
    phone: '555-5678',
    address: '456 Oak Ave',
    city: 'Otherville',
    country: 'USA',
    clientType: 'Company',
    serviceType: 'Office Rental',
    idType: 'Trade Register',
    idNumber: 'RC98765',
    idExpiryDate: '2025-06-30',
    taxId: 'NIF67890',
    nis: 'NIS54321',
    rcNumber: 'RC98765',
    contactPersonName: 'Jane Smith',
    contactPersonEmail: 'jane.smith@example.com',
    contactPersonPhone: '555-5678',
    contractStartDate: '2022-11-30',
    contractEndDate: '2023-11-29',
    paymentTerms: 'Annually',
    officeId: 205,
    status: 'Inactive',
  },
];

onMounted(async () => {
  if (clientId.value) {
    try {
      // In a real app, you would fetch this from an API: `/clients/${clientId.value}`
      // const response = await apiClient.get(`/clients/${clientId.value}`);
      // client.value = response.data;
      const existingClient = mockClients.find(c => c.id === clientId.value);
      if (existingClient) {
        // Map fullName from mock to name for the form
        const { fullName, ...formData } = existingClient;
        client.value = { ...formData, name: fullName || existingClient.name }; 
      } else {
        console.error('Client not found for editing');
        alert('Client data not found. Redirecting to client list.');
        router.push('/manage-clients');
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      alert('Failed to load client data for editing.');
      router.push('/manage-clients');
    }
  }
});

const submitForm = async () => {
  try {
    if (clientId.value) {
      // Update existing client
      // const response = await apiClient.put(`/clients/${clientId.value}`, client.value);
      console.log('Client updated:', client.value); // Mocking API call
      alert('Client updated successfully!');
    } else {
      // Add new client
      // const response = await apiClient.post('/clients', client.value);
      console.log('Client added:', client.value); // Mocking API call
      alert('Client added successfully!');
    }
    router.push('/manage-clients');
  } catch (error) {
    console.error(`Error ${clientId.value ? 'updating' : 'adding'} client:`, error);
    alert(`Failed to ${clientId.value ? 'update' : 'add'} client.`);
  }
};

const handleFileUpload = (event) => {
  client.value.attachments = Array.from(event.target.files);
  // TODO: Implement actual upload to server or temporary storage preview
  console.log('Files selected:', client.value.attachments);
};

</script>

<template>
    <div class="container mt-4">
      <h2>{{ pageTitle }}</h2>
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
        <div class="mb-3">
          <label for="clientAddress" class="form-label">Address</label>
          <input type="text" class="form-control" id="clientAddress" v-model="client.address">
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="clientCity" class="form-label">City</label>
            <input type="text" class="form-control" id="clientCity" v-model="client.city">
          </div>
          <div class="col-md-6">
            <label for="clientCountry" class="form-label">Country</label>
            <input type="text" class="form-control" id="clientCountry" v-model="client.country">
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="clientType" class="form-label">Client Type</label>
            <select class="form-select" id="clientType" v-model="client.clientType">
              <option value="">Select Type</option>
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
            </select>
          </div>
          <div class="col-md-6">
            <label for="serviceType" class="form-label">Service Type</label>
            <select class="form-select" id="serviceType" v-model="client.serviceType">
              <option value="">Select Service</option>
              <option value="Domiciliation">Domiciliation</option>
              <option value="Office Rental">Office Rental</option>
              <option value="Coworking">Coworking</option>
              <option value="Meeting Room">Meeting Room</option>
            </select>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="idType" class="form-label">ID Type</label>
            <select class="form-select" id="idType" v-model="client.idType">
              <option value="">Select ID Type</option>
              <option value="National ID">National ID</option>
              <option value="Passport">Passport</option>
              <option value="Trade Register">Trade Register (RC)</option>
            </select>
          </div>
          <div class="col-md-4">
            <label for="idNumber" class="form-label">ID Number</label>
            <input type="text" class="form-control" id="idNumber" v-model="client.idNumber">
          </div>
          <div class="col-md-4">
            <label for="idExpiryDate" class="form-label">ID Expiry Date</label>
            <input type="date" class="form-control" id="idExpiryDate" v-model="client.idExpiryDate">
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="taxId" class="form-label">Tax ID (NIF)</label>
            <input type="text" class="form-control" id="taxId" v-model="client.taxId">
          </div>
          <div class="col-md-4">
            <label for="nis" class="form-label">NIS (for Companies)</label>
            <input type="text" class="form-control" id="nis" v-model="client.nis">
          </div>
          <div class="col-md-4">
            <label for="rcNumber" class="form-label">RC Number (for Companies)</label>
            <input type="text" class="form-control" id="rcNumber" v-model="client.rcNumber">
          </div>
        </div>
        <h5 class="mt-4">Contact Person</h5>
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="contactPersonName" class="form-label">Name</label>
            <input type="text" class="form-control" id="contactPersonName" v-model="client.contactPersonName">
          </div>
          <div class="col-md-4">
            <label for="contactPersonEmail" class="form-label">Email</label>
            <input type="email" class="form-control" id="contactPersonEmail" v-model="client.contactPersonEmail">
          </div>
          <div class="col-md-4">
            <label for="contactPersonPhone" class="form-label">Phone</label>
            <input type="tel" class="form-control" id="contactPersonPhone" v-model="client.contactPersonPhone">
          </div>
        </div>
        <h5 class="mt-4">Contract Details</h5>
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="contractStartDate" class="form-label">Contract Start Date</label>
            <input type="date" class="form-control" id="contractStartDate" v-model="client.contractStartDate">
          </div>
          <div class="col-md-4">
            <label for="contractEndDate" class="form-label">Contract End Date</label>
            <input type="date" class="form-control" id="contractEndDate" v-model="client.contractEndDate">
          </div>
          <div class="col-md-4">
            <label for="paymentTerms" class="form-label">Payment Terms</label>
            <select class="form-select" id="paymentTerms" v-model="client.paymentTerms">
              <option value="">Select Terms</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annually">Annually</option>
            </select>
          </div>
        </div>
        <div class="mb-3">
          <label for="officeId" class="form-label">Assign Office (ID)</label>
          <input type="number" class="form-control" id="officeId" v-model.number="client.officeId">
          <!-- TODO: Implement office selection dropdown/modal based on availability -->
        </div>
        <div class="mb-3">
          <label for="attachments" class="form-label">Attachments</label>
          <input type="file" class="form-control" id="attachments" @change="handleFileUpload" multiple>
        </div>
        <button type="submit" class="btn btn-primary me-2">{{ submitButtonText }}</button>
        <router-link to="/manage-clients" class="btn btn-secondary">Cancel</router-link>
      </form>
    </div>
  </template>
  
<style scoped>
  /* Add component-specific styles here */
</style>