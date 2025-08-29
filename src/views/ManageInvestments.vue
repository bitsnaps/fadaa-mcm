<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BTable, BPagination } from 'bootstrap-vue-next';
import { getInvestments, addInvestment, updateInvestment, deleteInvestment } from '@/services/InvestmentService';
import { getInvestors } from '@/services/UserService';
import { getBranches } from '@/services/BranchService';
import { Modal } from 'bootstrap';
import ProfileTabs from '@/components/ProfileTabs.vue';

const { t } = useI18n();

const investments = ref([]);
const investors = ref([]);
const branches = ref([]);
const isLoading = ref(true);
const searchTerm = ref('');
const isSubmitting = ref(false);
const activeProfileId = ref(null);

// Table state
const currentPage = ref(1);
const perPage = ref(10);
const sortBy = ref(['starting_date']);
const sortDesc = ref(true);

const modalInstance = ref(null);
const addInvestmentModal = ref(null);
const currentInvestment = ref({});
const isEditMode = ref(false);

const fetchInvestments = async (profileId) => {
    if (!profileId) return;
    try {
        isLoading.value = true;
        const response = await getInvestments(profileId); // Pass profileId to the service
        if (response.data.success) {
            investments.value = response.data.data;
        } else {
            console.error('Failed to fetch investments:', response.data.message);
            investments.value = [];
        }
    } catch (error) {
        console.error('An error occurred while fetching investments:', error);
        investments.value = [];
    } finally {
        isLoading.value = false;
    }
};

const onProfileChange = (profileId) => {
    activeProfileId.value = profileId;
    fetchInvestments(profileId);
};

const fetchInvestorsAndBranches = async () => {
    try {
        const [investorsRes, branchesRes] = await Promise.all([getInvestors(), getBranches()]);
        if (investorsRes.data.success) {
            investors.value = investorsRes.data.data;
        }
        if (branchesRes.data.success) {
            branches.value = branchesRes.data.data;
        }
    } catch (error) {
        console.error('Failed to fetch investors or branches:', error);
    }
};

onMounted(() => {
    fetchInvestorsAndBranches();
    modalInstance.value = new Modal(addInvestmentModal.value);
});

const filteredInvestments = computed(() => {
    if (!searchTerm.value) {
        return investments.value;
    }
    return investments.value.filter(inv =>
        (inv.investor && (inv.investor.first_name + ' ' + inv.investor.last_name).toLowerCase().includes(searchTerm.value.toLowerCase())) ||
        (inv.Branch && inv.Branch.name.toLowerCase().includes(searchTerm.value.toLowerCase()))
    );
});

const tableFields = computed(() => [
    { key: 'investor_name', label: t('investments.tableHeaders.investor'), sortable: true },
    { key: 'branch_name', label: t('investments.tableHeaders.branch'), sortable: true },
    { key: 'name', label: t('investments.tableHeaders.name'), sortable: true },
    { key: 'percentage', label: t('investments.tableHeaders.percentage'), sortable: true },
    { key: 'investment_amount', label: t('investments.tableHeaders.investment_amount'), sortable: true },
    { key: 'type', label: t('investments.tableHeaders.type'), sortable: true },
    { key: 'starting_date', label: t('investments.tableHeaders.starting_date'), sortable: true },
    { key: 'ending_date', label: t('investments.tableHeaders.ending_date'), sortable: true },
    { key: 'actions', label: t('investments.tableHeaders.actions') }
]);

const tableItems = computed(() =>
    filteredInvestments.value.map(inv => ({
        ...inv,
        investor_name: inv.investor ? `${inv.investor.first_name} ${inv.investor.last_name}` : 'N/A',
        branch_name: inv.Branch ? inv.Branch.name : 'N/A',
        type: t(`investments.tableHeaders.${inv.type.toLowerCase()}`),
        starting_date: inv.starting_date ? (typeof inv.starting_date === 'string' ? inv.starting_date.slice(0, 10) : '') : '',
        ending_date: inv.ending_date ? (typeof inv.ending_date === 'string' ? inv.ending_date.slice(0, 10) : '') : ''
    }))
);

const totalRows = computed(() => tableItems.value.length);


const openAddModal = () => {
    isEditMode.value = false;
    currentInvestment.value = {
        name: '',
        percentage: 0,
        investor_id: null,
        branch_id: null,
        starting_date: '',
        ending_date: '',
        investment_amount: 0,
        profile_id: activeProfileId.value // Set the current profile id
    };
    modalInstance.value.show();
};

const openEditModal = (investment) => {
    isEditMode.value = true;
    currentInvestment.value = {
        ...investment,
        starting_date: investment.starting_date ? new Date(investment.starting_date).toISOString().split('T')[0] : '',
        ending_date: investment.ending_date ? new Date(investment.ending_date).toISOString().split('T')[0] : ''
    };
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
            response = await updateInvestment(currentInvestment.value.id, currentInvestment.value);
            if (response.data.success) {
                const index = investments.value.findIndex(inv => inv.id === response.data.data.id);
                if (index !== -1) {
                    investments.value[index] = response.data.data;
                }
            }
        } else {
            response = await addInvestment(currentInvestment.value);
            if (response.data.success) {
                investments.value.push(response.data.data);
            }
        }
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
            fetchInvestments(activeProfileId.value);
        } catch (error) {
            console.error('Failed to delete investment:', error);
        }
    }
};

</script>

<template>
    <div class="container mt-4">
        <h2>{{ t('investments.title') }}</h2>

        <ProfileTabs @update:activeProfile="onProfileChange">
            <template #default="{ profileId }">
                <div class="d-flex justify-content-between align-items-center my-4">
                    <div>
                        <input
                            type="text"
                            class="form-control"
                            v-model="searchTerm"
                            :placeholder="t('investments.searchPlaceholder')"
                        />
                    </div>
                    <button class="btn btn-primary" @click="openAddModal">
                        <i class="bi bi-plus-lg me-2"></i>{{ t('investments.addInvestment') }}
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
                        :empty-text="t('investments.noInvestmentsFound')"
                    >
                        <template #cell(percentage)="data">
                            {{ data.value }}%
                        </template>
                        <template #cell(starting_date)="data">
                            {{ data.value ? new Date(data.value).toLocaleDateString() : 'N/A' }}
                        </template>
                        <template #cell(ending_date)="data">
                            {{ data.value ? new Date(data.value).toLocaleDateString() : 'N/A' }}
                        </template>
                        <template #cell(actions)="data">
                            <div class="text-center">
                                <button @click="openEditModal(data.item)" class="btn btn-sm btn-outline-info me-1" :title="t('investments.edit')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button @click="handleDelete(data.item.id)" class="btn btn-sm btn-outline-danger" :title="t('investments.delete')">
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
                    {{ t('investments.noInvestmentsFound') }}
                </div>
            </template>
        </ProfileTabs>

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
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="inv-client" class="form-label">{{ t('investments.tableHeaders.investor') }}</label>
                                    <select id="inv-investor" class="form-select" v-model="currentInvestment.investor_id">
                                        <option :value="null">Select an investor</option>
                                        <option v-for="investor in investors" :key="investor.id" :value="investor.id">{{ investor.first_name }} {{ investor.last_name }}</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="inv-branch" class="form-label">{{ t('investments.tableHeaders.branch') }}</label>
                                    <select id="inv-branch" class="form-select" v-model="currentInvestment.branch_id">
                                        <option :value="null">Select a branch</option>
                                        <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                                    </select>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="inv-name" class="form-label">{{ t('investments.tableHeaders.name') }} <span class="text-danger">*</span></label>
                                <input type="text" id="inv-name" class="form-control" v-model="currentInvestment.name" required>
                            </div>
                            <div class="mb-3">
                                <label for="inv-percentage" class="form-label">{{ t('investments.tableHeaders.percentage') }} <span class="text-danger">*</span></label>
                                <input type="number" id="inv-percentage" class="form-control" v-model.number="currentInvestment.percentage" required>
                            </div>
                            <div class="mb-3">
                                <label for="inv-type" class="form-label">{{ t('investments.tableHeaders.type') }} <span class="text-danger">*</span></label>
                                <select id="inv-type" class="form-select" v-model="currentInvestment.type" required>
                                    <option value="Comprehensive">{{ t('investments.tableHeaders.comprehensive') }}</option>
                                    <option value="Contractual">{{ t('investments.tableHeaders.contractual') }}</option>
                                </select>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="inv-starting-date" class="form-label">{{ t('investments.tableHeaders.starting_date') }}</label>
                                    <input type="date" id="inv-starting-date" class="form-control" v-model="currentInvestment.starting_date">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="inv-ending-date" class="form-label">{{ t('investments.tableHeaders.ending_date') }}</label>
                                    <input type="date" id="inv-ending-date" class="form-control" v-model="currentInvestment.ending_date">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="inv-amount" class="form-label">{{ t('investments.tableHeaders.investment_amount') }}</label>
                                <input type="number" id="inv-amount" class="form-control" v-model.number="currentInvestment.investment_amount">
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
