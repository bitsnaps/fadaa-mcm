<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatCurrency } from '@/helpers/utils.js';
import {
  getAllWithdrawals,
  createWithdrawalAsAdmin,
  updateWithdrawal,
  deleteWithdrawal,
} from '@/services/WithdrawalService.js';
import { getInvestors } from '@/services/UserService.js';
import ProfileTabs from '@/components/ProfileTabs.vue';
import AddEditWithdrawalModal from '@/components/AddEditWithdrawalModal.vue';

const { t } = useI18n();
const isLoading = ref(true);
const error = ref(null);
const withdrawals = ref([]);
const investors = ref([]);
const statusFilter = ref(''); // '', 'pending', 'paid', 'cancelled'
const investmentIdFilter = ref('');
const investorIdFilter = ref('');
const activeProfileId = ref(null);
const showModal = ref(false);
const editingWithdrawal = ref(null);

function openAddModal() {
  editingWithdrawal.value = null;
  showModal.value = true;
}

function openEditModal(withdrawal) {
  editingWithdrawal.value = { ...withdrawal };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingWithdrawal.value = null;
}

async function handleSave(withdrawalData) {
  try {
    if (withdrawalData.id) {
      await updateWithdrawal(withdrawalData.id, withdrawalData);
    } else {
      await createWithdrawalAsAdmin(withdrawalData);
    }
    await loadWithdrawals();
  } catch (e) {
    error.value = `Failed to save withdrawal: ${e.message}`;
    console.error('Error saving withdrawal:', e);
  } finally {
    closeModal();
  }
}

async function onDelete(id) {
  if (!confirm(t('manageWithdrawals.deleteConfirm'))) return;
  try {
    await deleteWithdrawal(id);
    await loadWithdrawals();
  } catch (e) {
    error.value = `Failed to delete withdrawal: ${e.message}`;
    console.error('Error deleting withdrawal:', e);
  }
}

async function loadWithdrawals() {
  if (!activeProfileId.value) return;
  isLoading.value = true;
  error.value = null;
  try {
    const params = {
      profile_id: activeProfileId.value
    };
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
    if (!activeProfileId.value) return;
  try {
    const investorsRes = await getInvestors({ profile_id: activeProfileId.value });
    if (investorsRes.data?.success) {
      investors.value = investorsRes.data.data;
    }
  } catch (e) {
    console.error("Failed to load filter data", e);
  }
}

async function onMarkPaid(id) {
  if (!confirm(t('manageWithdrawals.markPaidConfirm'))) return;
  await updateWithdrawal(id, { status: 'paid' });
  await loadWithdrawals();
}

async function onCancel(id) {
  if (!confirm(t('manageWithdrawals.cancelConfirm'))) return;
  await updateWithdrawal(id, { status: 'cancelled' });
  await loadWithdrawals();
}

function statusBadgeClass(status) {
  if (status === 'paid') return 'bg-success';
  if (status === 'pending') return 'bg-warning text-dark';
  if (status === 'cancelled') return 'bg-danger';
  return 'bg-secondary';
}

function onProfileChange(profileId) {
  activeProfileId.value = profileId;
  loadWithdrawals();
  loadFilterData();
}

onMounted(() => {
  // loadWithdrawals and loadFilterData will be called by onProfileChange
});
</script>

<template>
  <div class="container-fluid p-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">{{ t('manageWithdrawals.title') }}</h2>
      <div>
        <button class="btn btn-primary me-2" @click="openAddModal">
          <i class="bi bi-plus-circle me-1"></i> {{ t('manageWithdrawals.add') }}
        </button>
        <button class="btn btn-outline-secondary" @click="loadWithdrawals">
          <i class="bi bi-arrow-clockwise me-1"></i> {{ t('manageWithdrawals.refresh') }}
        </button>
      </div>
    </div>

    <ProfileTabs @update:activeProfile="onProfileChange">
      <template #default="{ profileId }">
        <div class="card mb-3 shadow-sm">
          <div class="card-header bg-fadaa-light-blue">{{ t('manageWithdrawals.filters.title') }}</div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label">{{ t('manageWithdrawals.filters.status') }}</label>
                <select v-model="statusFilter" class="form-select">
                  <option value="">{{ t('manageWithdrawals.filters.all') }}</option>
                  <option value="pending">{{ t('withdrawalStatuses.pending') }}</option>
                  <option value="paid">{{ t('withdrawalStatuses.paid') }}</option>
                  <option value="cancelled">{{ t('withdrawalStatuses.cancelled') }}</option>
                </select>
              </div>
              <!-- <div class="col-md-3">
                <label class="form-label">{{ t('manageWithdrawals.filters.investment') }}</label>
                <select v-model="investmentIdFilter" class="form-select">
                  <option value="">{{ t('manageWithdrawals.filters.all') }}</option>
                  <option v-for="inv in investments" :key="inv.id" :value="inv.id">
                    {{ inv.name }}
                  </option>
                </select>
              </div> -->
              <div class="col-md-3">
                <label class="form-label">{{ t('manageWithdrawals.filters.investor') }}</label>
                <select v-model="investorIdFilter" class="form-select">
                  <option value="">{{ t('manageWithdrawals.filters.all') }}</option>
                  <option v-for="inv in investors" :key="inv.id" :value="inv.id">
                    {{ inv.first_name }} {{ inv.last_name }} (ID: {{ inv.id }})
                  </option>
                </select>
              </div>
              <div class="col-md-3 d-flex align-items-end">
                <button class="btn btn-primary w-100" @click="loadWithdrawals">
                  <i class="bi bi-filter-square me-1"></i> {{ t('manageWithdrawals.filters.apply') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="text-center my-5">
          <div class="spinner-border" role="status"><span class="visually-hidden">{{ t('loading') }}</span></div>
        </div>
        <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

        <div v-else class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue d-flex justify-content-between align-items-center">
            <span>{{ t('manageWithdrawals.table.title') }}</span>
            <span class="badge bg-secondary">{{ withdrawals.length }}</span>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-bordered table-hover align-middle">
                <thead>
                  <tr>
                    <th width="80">{{ t('manageWithdrawals.table.id') }}</th>
                    <th>{{ t('manageWithdrawals.table.requestedAt') }}</th>
                    <th>{{ t('manageWithdrawals.table.investor') }}</th>
                    <th>{{ t('manageWithdrawals.table.investment') }}</th>
                    <th>{{ t('manageWithdrawals.table.amount') }}</th>
                    <th>{{ t('manageWithdrawals.table.paymentMethod') }}</th>
                    <th>{{ t('manageWithdrawals.table.status') }}</th>
                    <th width="240">{{ t('manageWithdrawals.table.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="withdrawals.length === 0">
                    <td colspan="8" class="text-center">{{ t('manageWithdrawals.table.noWithdrawals') }}</td>
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
                    <td>{{ w.payment_method ? t(`paymentMethods.${w.payment_method.replace(' ', '_')}`).replace('paymentMethods.', '') : '—' }}</td>
                    <td>
                      <span :class="['badge', statusBadgeClass(w.status)]">{{ t(`withdrawalStatuses.${w.status}`) }}</span>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm" role="group">
                        <button
                          v-if="w.status === 'pending'"
                          class="btn btn-outline-success"
                          @click="onMarkPaid(w.id)"
                        >
                          <i class="bi bi-cash-coin"></i> {{ t('manageWithdrawals.actions.markPaid') }}
                        </button>
                        <button
                          v-if="w.status === 'pending'"
                          class="btn btn-outline-warning"
                          @click="onCancel(w.id)"
                        >
                          <i class="bi bi-x-circle"></i> {{ t('manageWithdrawals.actions.cancel') }}
                        </button>
                        <button
                          class="btn btn-outline-secondary"
                          @click="openEditModal(w)"
                        >
                          <i class="bi bi-pencil-square"></i> {{ t('manageWithdrawals.actions.edit') }}
                        </button>
                        <button
                          v-if="w.status !== 'paid'"
                          class="btn btn-outline-danger"
                          @click="onDelete(w.id)"
                        >
                          <i class="bi bi-trash"></i> {{ t('manageWithdrawals.actions.delete') }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </ProfileTabs>
  </div>

  <AddEditWithdrawalModal
    :show-modal="showModal"
    :withdrawal="editingWithdrawal"
    :investors="investors"
    :profile-id="activeProfileId"
    @close="closeModal"
    @save="handleSave"
  />
</template>

<style scoped>
.table td, .table th {
  vertical-align: middle;
}
</style>