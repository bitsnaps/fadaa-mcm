<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const investment = ref(null);

import ApiClient from '@/services/ApiClient.js';

const fetchInvestmentDetails = async (investmentId) => {
  try {
    const { data: response } = await ApiClient.get(`/investments/${investmentId}`);
    if (response.success) {
      investment.value = response.data;
    } else {
      console.error(response.message);
    }
  } catch (error) {
    console.error('Error fetching investment details:', error);
  }
};

onMounted(() => {
  const investmentId = route.params.id;
  fetchInvestmentDetails(investmentId);
});
</script>

<template>
  <div class="container mt-4" v-if="investment">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2>{{ investment.name }}</h2>
        <span 
          :class="['badge', investment.status === 'Active' ? 'bg-success' : 'bg-secondary']">
          {{ investment.status }}
        </span>
      </div>
      <div class="card-body">
        <p class="card-text">{{ investment.description }}</p>
        
        <div class="row">
          <div class="col-md-6">
            <h4>Investment Details</h4>
            <ul class="list-group">
              <li class="list-group-item"><strong>Type:</strong> {{ investment.type }}</li>
              <li class="list-group-item"><strong>Initial Investment:</strong> ${{ investment.investment_amount.toLocaleString() }}</li>
              <li class="list-group-item"><strong>Percentage:</strong> {{ investment.percentage }}%</li>
            </ul>
          </div>
          <div class="col-md-6">
            <h4>Global Financials</h4>
            <ul class="list-group">
              <li class="list-group-item"><strong>Branch Net Profit:</strong> ${{ investment.branchNetProfitSelectedPeriod.toLocaleString() }}</li>
              <li class="list-group-item"><strong>Your Profit Share:</strong> ${{ investment.yourProfitShareSelectedPeriod.toLocaleString() }}</li>
            </ul>
          </div>
        </div>

        <div class="mt-4">
          <h4>Investors</h4>
          <ul class="list-group">
            <li class="list-group-item">
              {{ investment.investor.name }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="alert alert-info text-center" role="alert">
    Loading investment details...
  </div>
</template>

<style scoped>
.card-header h2 {
  margin-bottom: 0;
}
</style>