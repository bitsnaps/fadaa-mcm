<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getInvestments, addInvestment, updateInvestment, deleteInvestment } from '@/services/ApiClient';
import { Modal } from 'bootstrap';

const { t } = useI18n();

const investments = ref([]);
const isLoading = ref(true);
const searchTerm = ref('');
const isSubmitting = ref(false);

const modalInstance = ref(null);
const addInvestmentModal = ref(null);
const currentInvestment = ref({});
const isEditMode = ref(false);

const fetchInvestments = async () => {
    try {
        isLoading.value = true;
        const response = await getInvestments();
        if (response.data.success) {
            investments.value = response.data.data;
        } else {
            console.error('Failed to fetch investments:', response.data.message);
        }
    } catch (error) {
        console.error('An error occurred while fetching investments:', error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchInvestments();
    modalInstance.value = new Modal(addInvestmentModal.value);
});

const filteredInvestments = computed(() => {
    if (!searchTerm.value) {
        return investments.value;
    }
    return investments.value.filter(inv =>
        inv.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        inv.type.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        inv.status.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
});

const openAddModal = () => {
    isEditMode.value = false;
    currentInvestment.value = {
        name: '',
        description: '',
        type: '',
        status: 'Active',
        initial_value: 0,
        current_value: 0
    };
    modalInstance.value.show();
};

const openEditModal = (investment) => {
    isEditMode.value = true;
    currentInvestment.value = { ...investment };
    modalInstance.value.show();
};

const hideModal = () => {
    modalInstance.value.hide();
};

const handleSubmit = async () => {
    isSubmitting.value = true;
    try {
        if (isEditMode.value) {
            await updateInvestment(currentInvestment.value.id, currentInvestment.value);
        } else {
            await addInvestment(currentInvestment.value);
        }
        fetchInvestments();
        hideModal();
    } catch (error) {
        console.error('Failed to submit investment:', error);
    } finally {
        isSubmitting.value = false;
    }
};

const handleDelete = async (id) => {
    if (confirm(t('investments.confirmDelete'))) {
        try {
            await deleteInvestment(id);
            fetchInvestments();
        } catch (error) {
            console.error('Failed to delete investment:', error);
        }
    }
};
</script>

<template>
    <div class="container mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>{{ t('investments.title') }}</h2>
            <button class="btn btn-primary" @click="openAddModal">
                <i class="bi bi-plus-lg me-2"></i>{{ t('investments.addInvestment') }}
            </button>
        </div>

        <div class="mb-3">
            <input
                type="text"
                class="form-control"
                v-model="searchTerm"
                :placeholder="t('investments.searchPlaceholder')"
            />
        </div>

        <div v-if="isLoading" class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <div v-else-if="filteredInvestments.length > 0" class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th scope="col">{{ t('investments.tableHeaders.name') }}</th>
                        <th scope="col">{{ t('investments.tableHeaders.type') }}</th>
                        <th scope="col">{{ t('investments.tableHeaders.initialValue') }}</th>
                        <th scope="col">{{ t('investments.tableHeaders.currentValue') }}</th>
                        <th scope="col">{{ t('investments.tableHeaders.status') }}</th>
                        <th scope="col" class="text-center">{{ t('investments.tableHeaders.actions') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="investment in filteredInvestments" :key="investment.id">
                        <td>{{ investment.name }}</td>
                        <td>{{ investment.type }}</td>
                        <td>{{ investment.initial_value }}</td>
                        <td>{{ investment.current_value }}</td>
                        <td>
                            <span :class="`badge bg-${investment.status === 'Active' ? 'success' : 'secondary'}`">
                                {{ investment.status }}
                            </span>
                        </td>
                        <td class="text-center">
                            <button @click="openEditModal(investment)" class="btn btn-sm btn-outline-info me-1" :title="t('investments.edit')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button @click="handleDelete(investment.id)" class="btn btn-sm btn-outline-danger" :title="t('investments.delete')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-else class="alert alert-info text-center" role="alert">
            {{ t('investments.noInvestmentsFound') }}
        </div>

        <!-- Add/Edit Investment Modal -->
        <div class="modal fade" ref="addInvestmentModal" tabindex="-1" aria-labelledby="investmentModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="investmentModalLabel">{{ isEditMode ? t('investments.editInvestment') : t('investments.addInvestment') }}</h5>
                        <button type="button" class="btn-close" @click="hideModal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="handleSubmit">
                            <div class="mb-3">
                                <label for="inv-name" class="form-label">{{ t('investments.tableHeaders.name') }}</label>
                                <input type="text" id="inv-name" class="form-control" v-model="currentInvestment.name" required>
                            </div>
                            <div class="mb-3">
                                <label for="inv-desc" class="form-label">{{ t('investments.tableHeaders.description') }}</label>
                                <textarea id="inv-desc" class="form-control" v-model="currentInvestment.description"></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="inv-type" class="form-label">{{ t('investments.tableHeaders.type') }}</label>
                                    <input type="text" id="inv-type" class="form-control" v-model="currentInvestment.type">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="inv-status" class="form-label">{{ t('investments.tableHeaders.status') }}</label>
                                    <select id="inv-status" class="form-select" v-model="currentInvestment.status" required>
                                        <option>Active</option>
                                        <option>Sold</option>
                                        <option>Pending</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="inv-initial" class="form-label">{{ t('investments.tableHeaders.initialValue') }}</label>
                                    <input type="number" id="inv-initial" class="form-control" v-model.number="currentInvestment.initial_value">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="inv-current" class="form-label">{{ t('investments.tableHeaders.currentValue') }}</label>
                                    <input type="number" id="inv-current" class="form-control" v-model.number="currentInvestment.current_value">
                                </div>
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