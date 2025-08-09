<script setup>
import { ref, onMounted } from 'vue';
import { formatCurrency } from '@/helpers/utils.js';
import {
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
  getInvestors,
  getInvestmentsList
} from '@/services/ApiClient.js';

const isLoading = ref(true);
const error = ref(null);
const withdrawals = ref([]);
const investors = ref([]);
const investments = ref([]);
const statusFilter = ref(''); // '', 'pending', 'approved', 'paid', 'rejected'
const investmentIdFilter = ref('');
const investorIdFilter = ref('');

async function loadWithdrawals() {
  isLoading.value = true;
  error.value = null;
  try {
    const params = {};
    if (statusFilter.value) params.status = statusFilter.value;
    if (investmentIdFilter.value) params.investment_id = investmentIdFilter.value;
    if (investorIdFilter.value) params.investor_id = investorIdFilter.value;

    const res = await getAllWithdrawals(params);
    if (res.data?.success) {
      withdrawals.value = res.data.data || [];
    } else {
      throw new Error(res.data?.message || 'Failed to fetch withdrawals');
    }
  } catch (e) {
    error.value = e.message;
    console.error('Error loading withdrawals:', e);
  } finally {
    isLoading.value = false;
  }
}

async function loadFilterData() {
  try {
    const [investorsRes, investmentsRes] = await Promise.all([
      getInvestors(),
      getInvestmentsList()
    ]);
    if (investorsRes.data?.success) {
      investors.value = investorsRes.data.data;
    }
    if (investmentsRes.data?.success) {
      investments.value = investmentsRes.data.investments;
    }
  } catch (e) {
    console.error("Failed to load filter data", e);
  }
}

async function onApprove(id) {
  if (!confirm('Approve this withdrawal?')) return;
  await approveWithdrawal(id);
  await loadWithdrawals();
}

async function onReject(id) {
  if (!confirm('Reject this withdrawal?')) return;
  await rejectWithdrawal(id);
  await loadWithdrawals();
}

async function onMarkPaid(id) {
  if (!confirm('Mark this withdrawal as PAID?')) return;
  await markWithdrawalPaid(id);
  await loadWithdrawals();
}

function statusBadgeClass(status) {
  if (status === 'paid') return 'bg-success';
  if (status === 'approved') return 'bg-primary';
  if (status === 'pending') return 'bg-warning text-dark';
  if (status === 'rejected') return 'bg-danger';
  return 'bg-secondary';
}

onMounted(() => {
  loadWithdrawals();
  loadFilterData();
});
</script>

<template>
  <div class="container-fluid p-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">Manage Withdrawals</h2>
      <button class="btn btn-outline-secondary" @click="loadWithdrawals">
        <i class="bi bi-arrow-clockwise me-1"></i> Refresh
      </button>
    </div>

    <div class="card mb-3 shadow-sm">
      <div class="card-header bg-fadaa-light-blue">Filters</div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label">Status</label>
            <select v-model="statusFilter" class="form-select">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Investment</label>
            <select v-model="investmentIdFilter" class="form-select">
              <option value="">All</option>
              <option v-for="inv in investments" :key="inv.id" :value="inv.id">
                {{ inv.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Investor</label>
            <select v-model="investorIdFilter" class="form-select">
              <option value="">All</option>
              <option v-for="inv in investors" :key="inv.id" :value="inv.id">
                {{ inv.first_name }} {{ inv.last_name }} (ID: {{ inv.id }})
              </option>
            </select>
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button class="btn btn-primary w-100" @click="loadWithdrawals">
              <i class="bi bi-filter-square me-1"></i> Apply
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else class="card shadow-sm">
      <div class="card-header bg-fadaa-light-blue d-flex justify-content-between align-items-center">
        <span>Withdrawals</span>
        <span class="badge bg-secondary">{{ withdrawals.length }}</span>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered table-hover align-middle">
            <thead>
              <tr>
                <th width="80">ID</th>
                <th>Requested At</th>
                <th>Investor</th>
                <th>Investment</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th width="240">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="withdrawals.length === 0">
                <td colspan="8" class="text-center">No withdrawals found.</td>
              </tr>
              <tr v-for="w in withdrawals" :key="w.id">
                <td>{{ w.id }}</td>
                <td>{{ new Date(w.requested_at || w.created_at).toLocaleString() }}</td>
                <td>
                  <div>{{ w.investor?.first_name }} {{ w.investor?.last_name }}</div>
                  <small class="text-muted">ID: {{ w.investor?.id }}</small>
                </td>
                <td>
                  <div>{{ w.Investment?.name || ('#' + w.investment_id) }}</div>
                  <small class="text-muted">Investment ID: {{ w.investment_id }}</small>
                </td>
                <td>{{ formatCurrency(w.amount) }}</td>
                <td>{{ w.payment_method || '—' }}</td>
                <td>
                  <span :class="['badge', statusBadgeClass(w.status)]">{{ w.status }}</span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm" role="group">
                    <button
                      v-if="w.status === 'pending'"
                      class="btn btn-outline-primary"
                      @click="onApprove(w.id)"
                    >
                      <i class="bi bi-check2-circle"></i> Approve
                    </button>
                    <button
                      v-if="w.status === 'pending'"
                      class="btn btn-outline-danger"
                      @click="onReject(w.id)"
                    >
                      <i class="bi bi-x-circle"></i> Reject
                    </button>
                    <button
                      v-if="w.status === 'approved'"
                      class="btn btn-outline-success"
                      @click="onMarkPaid(w.id)"
                    >
                      <i class="bi bi-cash-coin"></i> Mark Paid
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table td, .table th {
  vertical-align: middle;
}
</style>