<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getIncomes, addIncome, updateIncome, deleteIncome } from '@/services/IncomeService';
import { getBranches } from '@/services/BranchService';
import { useAuthStore } from '@/stores/auth'; // To get registered_by user ID
import { Modal } from 'bootstrap';
import ProfileTabs from '@/components/ProfileTabs.vue';

const { t } = useI18n();
const authStore = useAuthStore();

const incomes = ref([]);
const branches = ref([]);
const isLoading = ref(true);
const searchTerm = ref('');
const isSubmitting = ref(false);
const activeProfileId = ref(null);

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
    if (!searchTerm.value) {
        return incomes.value;
    }
    return incomes.value.filter(inc =>
        (inc.description && inc.description.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
        (inc.Branch && inc.Branch.name.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
        (inc.registered_by_user && `${inc.registered_by_user.first_name} ${inc.registered_by_user.last_name}`.toLowerCase().includes(searchTerm.value.toLowerCase()))
    );
});

const openAddModal = () => {
    isEditMode.value = false;
    currentIncome.value = {
        amount: 0,
        description: '',
        transaction_date: new Date().toISOString().slice(0, 10), // Default to today's date
        branch_id: null,
        registered_by: authStore.user.id, // Set current user as registered_by
        profile_id: activeProfileId.value,
    };
    modalInstance.value.show();
};

const openEditModal = (income) => {
    isEditMode.value = true;
    currentIncome.value = { ...income, transaction_date: income.transaction_date.slice(0, 10) }; // Format date for input
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
            response = await updateIncome(currentIncome.value.id, currentIncome.value);
        } else {
            response = await addIncome(currentIncome.value);
        }
        if (response.data.success) {
            fetchIncomes(activeProfileId.value); // Re-fetch all incomes to update the list
            hideModal();
        } else {
            console.error('Failed to submit income:', response.data.message);
        }
    } catch (error) {
        console.error('An error occurred while submitting income:', error);
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

                <div v-else-if="filteredIncomes.length > 0" class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">{{ t('incomes.tableHeaders.amount') }}</th>
                                <th scope="col">{{ t('incomes.tableHeaders.description') }}</th>
                                <th scope="col">{{ t('incomes.tableHeaders.transaction_date') }}</th>
                                <th scope="col">{{ t('incomes.tableHeaders.branch') }}</th>
                                <th scope="col">{{ t('incomes.tableHeaders.registered_by') }}</th>
                                <th scope="col" class="text-center">{{ t('incomes.tableHeaders.actions') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="income in filteredIncomes" :key="income.id">
                                <td>{{ income.amount }}</td>
                                <td>{{ income.description }}</td>
                                <td>{{ income.transaction_date ? new Date(income.transaction_date).toLocaleDateString() : 'N/A' }}</td>
                                <td>{{ income.Branch ? income.Branch.name : 'N/A' }}</td>
                                <td>{{ income.registered_by_user ? `${income.registered_by_user.first_name} ${income.registered_by_user.last_name}` : 'N/A' }}</td>
                                <td class="text-center">
                                    <button @click="openEditModal(income)" class="btn btn-sm btn-outline-info me-1" :title="t('incomes.edit')">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button @click="handleDelete(income.id)" class="btn btn-sm btn-outline-danger" :title="t('incomes.delete')">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
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
                                    <label for="inc-amount" class="form-label">{{ t('incomes.tableHeaders.amount') }}</label>
                                    <input type="number" id="inc-amount" class="form-control" v-model.number="currentIncome.amount" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="inc-branch" class="form-label">{{ t('incomes.tableHeaders.branch') }}</label>
                                    <select id="inc-branch" class="form-select" v-model="currentIncome.branch_id" required>
                                        <option :value="null">Select a branch</option>
                                        <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                                    </select>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="inc-description" class="form-label">{{ t('incomes.tableHeaders.description') }}</label>
                                <textarea id="inc-description" class="form-control" v-model="currentIncome.description"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="inc-transaction-date" class="form-label">{{ t('incomes.tableHeaders.transaction_date') }}</label>
                                <input type="date" id="inc-transaction-date" class="form-control" v-model="currentIncome.transaction_date" required>
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