<template>
    <div class="container pt-4">
        <h1>{{ $t('managePendingDeletions.title') }}</h1>
        <div v-if="loading">{{ $t('managePendingDeletions.loading') }}</div>
        <div v-if="error">{{ error }}</div>
        <table class="table" v-if="pendingDeletions.length">
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ $t('managePendingDeletions.date') }}</th>
                    <th>{{ $t('managePendingDeletions.requester') }}</th>
                    <th>{{ $t('managePendingDeletions.entityType') }}</th>
                    <th>{{ $t('managePendingDeletions.entityId') }}</th>
                    <th>{{ $t('managePendingDeletions.actions') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="deletion in pendingDeletions" :key="deletion.id">
                    <td>{{ deletion.id }}</td>
                    <td>{{ formatDate(deletion.createdAt) }}</td>
                    <td>{{ deletion.requester.email }}</td>
                    <td>{{ deletion.entity_type }}</td>
                    <td>{{ deletion.entity_id }}</td>
                    <td>
                        <button class="btn btn-success" @click="approve(deletion.id)">{{ $t('managePendingDeletions.approve') }}</button>
                        <button class="btn btn-danger" @click="reject(deletion.id)">{{ $t('managePendingDeletions.reject') }}</button>
                    </td>
                </tr>
            </tbody>
        </table>
        <div v-else>
            {{ $t('managePendingDeletions.noPendingDeletions') }}
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPendingDeletions, approveDeletion, rejectDeletion } from '@/services/PendingDeletionService';
import { useToast } from '@/helpers/toast';
import i18n from '@/i18n';
import { formatDate } from '../helpers/utils';

const pendingDeletions = ref([]);
const loading = ref(false);
const error = ref(null);
const { showSuccessToast, showErrorToast } = useToast();

const fetchPendingDeletions = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await getPendingDeletions();
        pendingDeletions.value = response.data.data;
    } catch (err) {
        error.value = i18n.global.t('managePendingDeletions.failLoad');
        showErrorToast(error.value);
    } finally {
        loading.value = false;
    }
};

const approve = async (id) => {
    try {
        await approveDeletion(id);
        showSuccessToast(i18n.global.t('managePendingDeletions.successApprove'));
        fetchPendingDeletions();
    } catch (err) {
        showErrorToast(i18n.global.t('managePendingDeletions.failApprove'));
    }
};

const reject = async (id) => {
    try {
        await rejectDeletion(id);
        showSuccessToast(i18n.global.t('managePendingDeletions.successReject'));
        fetchPendingDeletions();
    } catch (err) {
        showErrorToast(i18n.global.t('managePendingDeletions.failReject'));
    }
};

onMounted(fetchPendingDeletions);
</script>