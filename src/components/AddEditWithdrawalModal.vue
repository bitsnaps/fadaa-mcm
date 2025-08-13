<script setup>
import { ref, watch, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  showModal: Boolean,
  withdrawal: Object,
  investors: Array,
  investments: Array,
  profileId: Number,
});

const emit = defineEmits(['close', 'save']);

const form = ref({});

watch(() => props.showModal, (isShown) => {
  if (isShown) {
    if (props.withdrawal) {
      form.value = { ...props.withdrawal };
    } else {
      form.value = {
        status: 'pending',
        profile_id: props.profileId,
        investor_id: null,
        investment_id: null,
        amount: null,
        payment_method: '',
        notes: ''
      };
    }
  }
}, { immediate: true });

function closeModal() {
  emit('close');
}

function save() {
  emit('save', { ...form.value });
  closeModal();
}
</script>

<template>
  <div v-if="showModal" class="modal fade show d-block" tabindex="-1" @click.self="closeModal">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ withdrawal && withdrawal.id ? t('manageWithdrawals.modal.editTitle') : t('manageWithdrawals.modal.addTitle') }}</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="save">
            <div class="mb-3">
              <label class="form-label">{{ t('manageWithdrawals.modal.investor') }}</label>
              <select v-model="form.investor_id" class="form-select" required>
                <option v-for="inv in investors" :key="inv.id" :value="inv.id">
                  {{ inv.first_name }} {{ inv.last_name }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t('manageWithdrawals.modal.investment') }}</label>
              <select v-model="form.investment_id" class="form-select" required>
                <option v-for="inv in investments" :key="inv.id" :value="inv.id">
                  {{ inv.name }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t('manageWithdrawals.modal.amount') }}</label>
              <input type="number" v-model="form.amount" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t('manageWithdrawals.modal.paymentMethod') }}</label>
              <select v-model="form.payment_method" class="form-select">
                <option value="">{{ t('manageWithdrawals.modal.selectPaymentMethod') }}</option>
                <option value="bank transfer">{{ t('paymentMethods.bank_transfer') }}</option>
                <option value="cash">{{ t('paymentMethods.cash') }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t('manageWithdrawals.modal.status') }}</label>
              <select v-model="form.status" class="form-select">
                <option value="pending">{{ t('withdrawalStatuses.pending') }}</option>
                <option value="approved">{{ t('withdrawalStatuses.approved') }}</option>
                <option value="rejected">{{ t('withdrawalStatuses.rejected') }}</option>
                <option value="paid">{{ t('withdrawalStatuses.paid') }}</option>
                <option value="cancelled">{{ t('withdrawalStatuses.cancelled') }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t('manageWithdrawals.modal.notes') }}</label>
              <textarea v-model="form.notes" class="form-control"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">{{ t('manageWithdrawals.modal.close') }}</button>
          <button type="button" class="btn btn-primary" @click="save">{{ t('manageWithdrawals.modal.save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  background-color: rgba(0,0,0,0.5);
}
</style>