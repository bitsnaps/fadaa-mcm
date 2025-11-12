<script setup>
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getInvestmentsByInvestor } from '@/services/InvestmentService';
import { useVuelidate } from '@vuelidate/core';
import { required, minValue } from '@vuelidate/validators';
import { formatDateForInput } from '@/helpers/utils';

const { t } = useI18n();

const props = defineProps({
  showModal: Boolean,
  withdrawal: Object,
  investors: Array,
  profileId: Number,
  errors: Object,
});

const emit = defineEmits(['close', 'save']);

const form = ref({});
const filteredInvestments = ref([]);

const rules = computed(() => ({
    investor_id: { required },
    investment_id: { required },
    amount: { required, minValue: minValue(0) },
}));

const v$ = useVuelidate(rules, form);

watch(() => form.value.investor_id, async (newInvestorId) => {
  if (newInvestorId) {
    try {
      const response = await getInvestmentsByInvestor(newInvestorId);
      if (response.data.success) {
        filteredInvestments.value = response.data.data;
        if (!filteredInvestments.value.some(inv => inv.id === form.value.investment_id)) {
            form.value.investment_id = null;
        }
      }
    } catch (error) {
      console.error('Error fetching investments for investor:', error);
      filteredInvestments.value = [];
    }
  } else {
    filteredInvestments.value = [];
  }
});

watch(() => props.showModal, (isShown) => {
  if (isShown) {
    if (props.withdrawal) {
      form.value = { 
          ...props.withdrawal,
          requested_at: formatDateForInput(props.withdrawal.requested_at)
      };
    } else {
      form.value = {
        status: 'pending',
        profile_id: props.profileId,
        investor_id: null,
        investment_id: null,
        amount: null,
        payment_method: 'cash',
        notes: '',
        requested_at: formatDateForInput()
      };
    }
  }
}, { immediate: true });

function closeModal() {
  v$.value.$reset();
  emit('close');
}

function save() {
    v$.value.$touch();
    if (v$.value.$invalid) return;
  emit('save', { ...form.value });
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
              <label class="form-label">{{ t('manageWithdrawals.modal.investor') }} <span class="text-danger">*</span></label>
              <select v-model="v$.investor_id.$model" class="form-select" :class="{'is-invalid': v$.investor_id.$error || (errors && errors.investor_id)}">
                <option v-for="inv in investors" :key="inv.id" :value="inv.id">
                  {{ inv.first_name }} {{ inv.last_name }}
                </option>
              </select>
              <div v-if="v$.investor_id.$error" class="invalid-feedback">
                <p v-for="error of v$.investor_id.$errors" :key="error.$uid">{{ error.$message }}</p>
              </div>
              <div v-if="errors && errors.investor_id" class="invalid-feedback">{{ errors.investor_id }}</div>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t('manageWithdrawals.modal.investment') }} <span class="text-danger">*</span></label>
              <select v-model="v$.investment_id.$model" class="form-select" :class="{'is-invalid': v$.investment_id.$error || (errors && errors.investment_id)}">
                <option v-for="inv in filteredInvestments" :key="inv.id" :value="inv.id">
                  {{ inv.name }}
                </option>
              </select>
              <div v-if="v$.investment_id.$error" class="invalid-feedback">
                <p v-for="error of v$.investment_id.$errors" :key="error.$uid">{{ error.$message }}</p>
              </div>
              <div v-if="errors && errors.investment_id" class="invalid-feedback">{{ errors.investment_id }}</div>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t('manageWithdrawals.modal.amount') }} <span class="text-danger">*</span></label>
              <input type="number" v-model="v$.amount.$model" class="form-control" :class="{'is-invalid': v$.amount.$error || (errors && errors.amount)}" />
              <div v-if="v$.amount.$error" class="invalid-feedback">
                <p v-for="error of v$.amount.$errors" :key="error.$uid">{{ error.$message }}</p>
              </div>
              <div v-if="errors && errors.amount" class="invalid-feedback">{{ errors.amount }}</div>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t('manageWithdrawals.modal.requestedAt') }}</label>
              <input type="date" v-model="form.requested_at" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t('manageWithdrawals.modal.paymentMethod') }}</label>
              <select v-model="form.payment_method" class="form-select">
                <option value="">{{ t('manageWithdrawals.modal.selectPaymentMethod') }}</option>
                <option value="cash" selected>{{ t('paymentMethods.cash') }}</option>
                <option value="bank transfer">{{ t('paymentMethods.bank_transfer') }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ t('manageWithdrawals.modal.status') }}</label>
              <select v-model="form.status" class="form-select">
                <option value="pending">{{ t('withdrawalStatuses.pending') }}</option>
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