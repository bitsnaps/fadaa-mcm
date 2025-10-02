<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BTable, BPagination } from 'bootstrap-vue-next';
import { getIncomes, addIncome, updateIncome, deleteIncome } from '@/services/IncomeService';
import { getBranches } from '@/services/BranchService';
import { useAuthStore } from '@/stores/auth'; // To get registered_by user ID
import { Modal } from 'bootstrap';
import ProfileTabs from '@/components/ProfileTabs.vue';
import { useVuelidate } from '@vuelidate/core';
import { required, minValue } from '@vuelidate/validators';

const { t } = useI18n();
const authStore = useAuthStore();

const incomes = ref([]);
const branches = ref([]);
const isLoading = ref(true);
const searchTerm = ref('');
const isSubmitting = ref(false);
const activeProfileId = ref(null);
const errors = ref({});

// Table state
const currentPage = ref(1);
const perPage = ref(10);
const sortBy = ref(['transaction_date']);
const sortDesc = ref(true);

const modalInstance = ref(null);
const addIncomeModal = ref(null);
const currentIncome = ref({});
const isEditMode = ref(false);

const fetchIncomes = async (profileId) => {
    if (!profileId) return;
    try {
        isLoading.value = true;
        const response = await getIncomes(profileId);
        if (response.data.success) {
            incomes.value = response.data.data;
        } else {
            console.error('Failed to fetch incomes:', response.data.message);
            incomes.value = [];
        }
    } catch (error) {
        console.error('An error occurred while fetching incomes:', error);
        incomes.value = [];
    } finally {
        isLoading.value = false;
    }
};

const onProfileChange = (profileId) => {
    activeProfileId.value = profileId;
    fetchIncomes(profileId);
};

const fetchBranches = async () => {
    try {
        const branchesRes = await getBranches();
        if (branchesRes.data.success) {
            branches.value = branchesRes.data.data;
        }
    } catch (error) {
        console.error('Failed to fetch branches:', error);
    }
};

onMounted(() => {
    fetchBranches();
    modalInstance.value = new Modal(addIncomeModal.value);
});

const filteredIncomes = computed(() => {
    let filtered = incomes.value;

    if (!isAdmin.value) {
        filtered = filtered.filter(inc => inc.branch_id === authStore?.user?.branch_id);
    }

    if (!searchTerm.value) {
        return filtered;
    }

    return filtered.filter(inc =>
        (inc.description && inc.description.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
        (inc.Branch && inc.Branch.name.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
        (inc.registered_by_user && `${inc.registered_by_user.first_name} ${inc.registered_by_user.last_name}`.toLowerCase().includes(searchTerm.value.toLowerCase()))
    );
});

const tableFields = computed(() => {
    const fields = [
        { key: 'amount', label: t('incomes.tableHeaders.amount'), sortable: true },
        { key: 'description', label: t('incomes.tableHeaders.description'), sortable: true },
        { key: 'transaction_date', label: t('incomes.tableHeaders.transaction_date'), sortable: true },
    ];

    if (isAdmin.value) {
        fields.push({ key: 'branch_name', label: t('incomes.tableHeaders.branch'), sortable: true });
    }

    fields.push({ key: 'registered_by_name', label: t('incomes.tableHeaders.registered_by'), sortable: true });
    fields.push({ key: 'actions', label: t('incomes.tableHeaders.actions') });

    return fields;
});

const tableItems = computed(() =>
    filteredIncomes.value.map(inc => ({
        ...inc,
        branch_name: inc.Branch ? inc.Branch.name : 'N/A',
        registered_by_name: inc.registered_by_user ? `${inc.registered_by_user.first_name} ${inc.registered_by_user.last_name}` : 'N/A',
        transaction_date: inc.transaction_date ? (typeof inc.transaction_date === 'string' ? inc.transaction_date.slice(0, 10) : '') : ''
    }))
);

const totalRows = computed(() => tableItems.value.length);


const openAddModal = () => {
    isEditMode.value = false;
    currentIncome.value = {
        amount: 0,
        description: null,
        transaction_date: new Date().toISOString().slice(0, 10), // Default to today's date
        branch_id: isAdmin.value ? null : authStore.user.branch_id,
        registered_by: authStore.user.id, // Set current user as registered_by
        profile_id: activeProfileId.value,
    };
    errors.value = {};
    v$.value.$reset();
    modalInstance.value.show();
};

const openEditModal = (income) => {
    isEditMode.value = true;
    currentIncome.value = { ...income, transaction_date: income.transaction_date.slice(0, 10) }; // Format date for input
    errors.value = {};
    v$.value.$reset();
    modalInstance.value.show();
};

const hideModal = () => {
    modalInstance.value.hide();
};

const rules = computed(() => ({
    amount: { required, minValue: minValue(0) },
    description: { required },
    transaction_date: { required },
    branch_id: { required },
}));

const v$ = useVuelidate(rules, currentIncome);

const isAdmin = computed(() => authStore.userRole === 'admin');

const handleSubmit = async () => {
    v$.value.$touch();
    if (v$.value.$invalid) return;

    isSubmitting.value = true;
    try {
        let response;
        if (isEditMode.value) {
            response = await updateIncome(currentIncome.value.id, currentIncome.value);
        } else {
            response = await addIncome(currentIncome.value);
        }
        if (response.data.success) {
            fetchIncomes(activeProfileId.value);
            hideModal();
        }
    } catch (error) {
        if (error.response && error.response.status === 422) {
            errors.value = error.response.data.errors;
        } else {
            console.error('An error occurred while submitting income:', error);
        }
    } finally {
        isSubmitting.value = false;
    }
};

const handleDelete = async (id) => {
    if (confirm(t('incomes.confirmDelete'))) {
        try {
            const response = await deleteIncome(id);
            if (response.data.success) {
                fetchIncomes(activeProfileId.value); // Re-fetch all incomes to update the list
            } else {
                console.error('Failed to delete income:', response.data.message);
            }
        } catch (error) {
            console.error('Failed to delete income:', error);
        }
    }
};
</script>

<template>
    <div class="container mt-4">
        <h2>{{ t('incomes.title') }}</h2>

        <ProfileTabs @update:activeProfile="onProfileChange">
            <template #default="{ profileId }">
                <div class="d-flex justify-content-between align-items-center my-4">
                    <div>
                        <input
                            type="text"
                            class="form-control"
                            v-model="searchTerm"
                            :placeholder="t('incomes.searchPlaceholder')"
                        />
                    </div>
                    <button class="btn btn-primary" @click="openAddModal">
                        <i class="bi bi-plus-lg me-2"></i>{{ t('incomes.addIncome') }}
                    </button>
                </div>

                <div v-if="isLoading" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>

                <div v-else-if="tableItems.length > 0">
                    <BTable
                        :items="tableItems"
                        :fields="tableFields"
                        :current-page="currentPage"
                        :per-page="perPage"
                        :sort-by.sync="sortBy"
                        :sort-desc.sync="sortDesc"
                        responsive
                        striped
                        hover
                        show-empty
                        :empty-text="t('incomes.noIncomesFound')"
                    >
                        <template #cell(transaction_date)="data">
                            {{ data.value ? new Date(data.value).toLocaleDateString() : 'N/A' }}
                        </template>
                        <template #cell(actions)="data">
                            <div class="text-center">
                                <button @click="openEditModal(data.item)" class="btn btn-sm btn-outline-info me-1" :title="t('incomes.edit')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button @click="handleDelete(data.item.id)" class="btn btn-sm btn-outline-danger" :title="t('incomes.delete')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </template>
                    </BTable>

                    <div class="d-flex justify-content-center mt-3">
                        <BPagination
                            v-model="currentPage"
                            :total-rows="totalRows"
                            :per-page="perPage"
                        />
                    </div>
                </div>
                <div v-else class="alert alert-info text-center" role="alert">
                    {{ t('incomes.noIncomesFound') }}
                </div>
            </template>
        </ProfileTabs>

        <!-- Add/Edit Income Modal -->
        <div class="modal fade" ref="addIncomeModal" tabindex="-1" aria-labelledby="incomeModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="incomeModalLabel">{{ isEditMode ? t('incomes.editIncome') : t('incomes.addIncome') }}</h5>
                        <button type="button" class="btn-close" @click="hideModal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="handleSubmit">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="inc-amount" class="form-label">{{ t('incomes.tableHeaders.amount') }} <span class="text-danger">*</span></label>
                                    <input type="number" id="inc-amount" class="form-control" v-model.number="v$.amount.$model" :class="{'is-invalid': v$.amount.$error || errors.amount}">
                                    <div v-if="v$.amount.$error" class="invalid-feedback">
                                       <p v-for="error of v$.amount.$errors" :key="error.$uid">{{ error.$message }}</p>
                                    </div>
                                    <div v-if="errors.amount" class="invalid-feedback">{{ errors.amount }}</div>
                                </div>
                                <div class="col-md-6 mb-3" v-if="isAdmin">
                                    <label for="inc-branch" class="form-label">{{ t('incomes.tableHeaders.branch') }} <span class="text-danger">*</span></label>
                                    <select id="inc-branch" class="form-select" v-model="v$.branch_id.$model" :class="{'is-invalid': v$.branch_id.$error || errors.branch_id}">
                                        <option :value="null">Select a branch</option>
                                        <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                                    </select>
                                    <div v-if="v$.branch_id.$error" class="invalid-feedback">
                                       <p v-for="error of v$.branch_id.$errors" :key="error.$uid">{{ error.$message }}</p>
                                    </div>
                                    <div v-if="errors.branch_id" class="invalid-feedback">{{ errors.branch_id }}</div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="inc-description" class="form-label">{{ t('incomes.tableHeaders.description') }} <span class="text-danger">*</span></label>
                                <textarea id="inc-description" class="form-control" :placeholder="t('incomes.description.placeholder','Please enter the name of the entity')" v-model="v$.description.$model" :class="{'is-invalid': v$.description.$error || errors.description}"></textarea>
                                <div v-if="v$.description.$error" class="invalid-feedback">
                                    <p v-for="error of v$.description.$errors" :key="error.$uid">{{ error.$message }}</p>
                                </div>
                                <div v-if="errors.description" class="invalid-feedback">{{ errors.description }}</div>
                            </div>
                            <div class="mb-3">
                                <label for="inc-transaction-date" class="form-label">{{ t('incomes.tableHeaders.transaction_date') }} <span class="text-danger">*</span></label>
                                <input type="date" id="inc-transaction-date" class="form-control" v-model="v$.transaction_date.$model" :class="{'is-invalid': v$.transaction_date.$error || errors.transaction_date}">
                                <div v-if="v$.transaction_date.$error" class="invalid-feedback">
                                    <p v-for="error of v$.transaction_date.$errors" :key="error.$uid">{{ error.$message }}</p>
                                </div>
                                <div v-if="errors.transaction_date" class="invalid-feedback">{{ errors.transaction_date }}</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="hideModal">{{ t('manageUsers.cancel') }}</button>
                        <button type="button" class="btn btn-primary" @click="handleSubmit" :disabled="isSubmitting">
                            <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            {{ isSubmitting ? 'Submitting...' : (isEditMode ? t('manageUsers.save') : t('manageUsers.add')) }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.table-hover tbody tr:hover {
    background-color: #f8f9fa;
}
</style>