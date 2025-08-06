<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '@/services/ExpenseService';
import { getBranches } from '@/services/ApiClient'; // Assuming getBranches is in ApiClient
import { useAuthStore } from '@/stores/auth'; // To get registered_by user ID
import { Modal } from 'bootstrap';
import ProfileTabs from '@/components/ProfileTabs.vue';

const { t } = useI18n();
const authStore = useAuthStore();

const expenses = ref([]);
const branches = ref([]);
const isLoading = ref(true);
const searchTerm = ref('');
const isSubmitting = ref(false);
const activeProfileId = ref(null);

const modalInstance = ref(null);
const addExpenseModal = ref(null);
const currentExpense = ref({});
const isEditMode = ref(false);

const fetchExpenses = async (profileId) => {
    if (!profileId) return;
    try {
        isLoading.value = true;
        const response = await getExpenses(profileId);
        if (response.data.success) {
            expenses.value = response.data.data;
        } else {
            console.error('Failed to fetch expenses:', response.data.message);
            expenses.value = [];
        }
    } catch (error) {
        console.error('An error occurred while fetching expenses:', error);
        expenses.value = [];
    } finally {
        isLoading.value = false;
    }
};

const onProfileChange = (profileId) => {
    activeProfileId.value = profileId;
    fetchExpenses(profileId);
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
    modalInstance.value = new Modal(addExpenseModal.value);
});

const filteredExpenses = computed(() => {
    if (!searchTerm.value) {
        return expenses.value;
    }
    return expenses.value.filter(exp =>
        (exp.description && exp.description.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
        (exp.Branch && exp.Branch.name.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
        (exp.registered_by_user && `${exp.registered_by_user.first_name} ${exp.registered_by_user.last_name}`.toLowerCase().includes(searchTerm.value.toLowerCase()))
    );
});

const openAddModal = () => {
    isEditMode.value = false;
    currentExpense.value = {
        amount: 0,
        description: '',
        transaction_date: new Date().toISOString().slice(0, 10), // Default to today's date
        branch_id: null,
        registered_by: authStore.user.id, // Set current user as registered_by
        profile_id: activeProfileId.value,
    };
    modalInstance.value.show();
};

const openEditModal = (expense) => {
    isEditMode.value = true;
    currentExpense.value = { ...expense, transaction_date: expense.transaction_date.slice(0, 10) }; // Format date for input
    modalInstance.value.show();
};

const hideModal = () => {
    modalInstance.value.hide();
};

const handleSubmit = async () => {
    isSubmitting.value = true;
    try {
        let response;
        if (isEditMode.value) {
            response = await updateExpense(currentExpense.value.id, currentExpense.value);
        } else {
            response = await addExpense(currentExpense.value);
        }
        if (response.data.success) {
            fetchExpenses(activeProfileId.value); // Re-fetch all expenses to update the list
            hideModal();
        } else {
            console.error('Failed to submit expense:', response.data.message);
        }
    } catch (error) {
        console.error('An error occurred while submitting expense:', error);
    } finally {
        isSubmitting.value = false;
    }
};

const handleDelete = async (id) => {
    if (confirm(t('expenses.confirmDelete'))) {
        try {
            const response = await deleteExpense(id);
            if (response.data.success) {
                fetchExpenses(activeProfileId.value);
            } else {
                console.error('Failed to delete expense:', response.data.message);
            }
        } catch (error) {
            console.error('Failed to delete expense:', error);
        }
    }
};
</script>

<template>
    <div class="container mt-4">
        <h2>{{ t('expenses.title') }}</h2>

        <ProfileTabs @update:activeProfile="onProfileChange">
            <template #default="{ profileId }">
                <div class="d-flex justify-content-between align-items-center my-4">
                    <div>
                        <input
                            type="text"
                            class="form-control"
                            v-model="searchTerm"
                            :placeholder="t('expenses.searchPlaceholder')"
                        />
                    </div>
                    <button class="btn btn-primary" @click="openAddModal">
                        <i class="bi bi-plus-lg me-2"></i>{{ t('expenses.addExpense') }}
                    </button>
                </div>

                <div v-if="isLoading" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>

                <div v-else-if="filteredExpenses.length > 0" class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">{{ t('expenses.tableHeaders.amount') }}</th>
                                <th scope="col">{{ t('expenses.tableHeaders.description') }}</th>
                                <th scope="col">{{ t('expenses.tableHeaders.transaction_date') }}</th>
                                <th scope="col">{{ t('expenses.tableHeaders.branch') }}</th>
                                <th scope="col">{{ t('expenses.tableHeaders.registered_by') }}</th>
                                <th scope="col" class="text-center">{{ t('expenses.tableHeaders.actions') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="expense in filteredExpenses" :key="expense.id">
                                <td>{{ expense.amount }}</td>
                                <td>{{ expense.description }}</td>
                                <td>{{ expense.transaction_date ? new Date(expense.transaction_date).toLocaleDateString() : 'N/A' }}</td>
                                <td>{{ expense.Branch ? expense.Branch.name : 'N/A' }}</td>
                                <td>{{ expense.registered_by_user ? `${expense.registered_by_user.first_name} ${expense.registered_by_user.last_name}` : 'N/A' }}</td>
                                <td class="text-center">
                                    <button @click="openEditModal(expense)" class="btn btn-sm btn-outline-info me-1" :title="t('expenses.edit')">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button @click="handleDelete(expense.id)" class="btn btn-sm btn-outline-danger" :title="t('expenses.delete')">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="alert alert-info text-center" role="alert">
                    {{ t('expenses.noExpensesFound') }}
                </div>
            </template>
        </ProfileTabs>

        <!-- Add/Edit Expense Modal -->
        <div class="modal fade" ref="addExpenseModal" tabindex="-1" aria-labelledby="expenseModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="expenseModalLabel">{{ isEditMode ? t('expenses.editExpense') : t('expenses.addExpense') }}</h5>
                        <button type="button" class="btn-close" @click="hideModal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="handleSubmit">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="exp-amount" class="form-label">{{ t('expenses.tableHeaders.amount') }}</label>
                                    <input type="number" id="exp-amount" class="form-control" v-model.number="currentExpense.amount" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="exp-branch" class="form-label">{{ t('expenses.tableHeaders.branch') }}</label>
                                    <select id="exp-branch" class="form-select" v-model="currentExpense.branch_id" required>
                                        <option :value="null">Select a branch</option>
                                        <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                                    </select>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="exp-description" class="form-label">{{ t('expenses.tableHeaders.description') }}</label>
                                <textarea id="exp-description" class="form-control" v-model="currentExpense.description"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="exp-transaction-date" class="form-label">{{ t('expenses.tableHeaders.transaction_date') }}</label>
                                <input type="date" id="exp-transaction-date" class="form-control" v-model="currentExpense.transaction_date" required>
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