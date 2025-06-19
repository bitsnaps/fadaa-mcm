<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const investment = ref(null);

// Mock investment data - replace with API call
const mockInvestment = {
  id: 'inv001',
  name: 'Tech Startup Fund',
  description: 'Early-stage investment in emerging technology companies.',
  initialInvestment: 50000,
  currentValue: 75000,
  returnPercentage: 50,
  status: 'Active',
  investors: [
    { id: 'usr001', name: 'Alice Johnson' },
    { id: 'usr002', name: 'Bob Williams' },
  ],
  financials: {
    revenue: 120000,
    expenses: 45000,
    profit: 75000,
  },
};

const fetchInvestmentDetails = (investmentId) => {
  // Simulate API call
  setTimeout(() => {
    investment.value = mockInvestment;
  }, 500);
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
              <li class="list-group-item"><strong>Initial Investment:</strong> ${{ investment.initialInvestment.toLocaleString() }}</li>
              <li class="list-group-item"><strong>Current Value:</strong> ${{ investment.currentValue.toLocaleString() }}</li>
              <li class="list-group-item"><strong>Return:</strong> {{ investment.returnPercentage }}%</li>
            </ul>
          </div>
          <div class="col-md-6">
            <h4>Global Financials</h4>
            <ul class="list-group">
              <li class="list-group-item"><strong>Total Revenue:</strong> ${{ investment.financials.revenue.toLocaleString() }}</li>
              <li class="list-group-item"><strong>Total Expenses:</strong> ${{ investment.financials.expenses.toLocaleString() }}</li>
              <li class="list-group-item"><strong>Net Profit:</strong> ${{ investment.financials.profit.toLocaleString() }}</li>
            </ul>
          </div>
        </div>

        <div class="mt-4">
          <h4>Investors</h4>
          <ul class="list-group">
            <li v-for="investor in investment.investors" :key="investor.id" class="list-group-item">
              {{ investor.name }}
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