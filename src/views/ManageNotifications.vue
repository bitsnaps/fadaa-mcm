<template>
  <div class="container-fluid p-4">
    <h1 class="h3 mb-4 text-gray-800">{{ $t('notifications.manage') }}</h1>

    <div class="card shadow mb-4">
      <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 class="m-0 font-weight-bold text-primary">{{ $t('notifications.list') }}</h6>
        <div>
          <button class="btn btn-secondary btn-sm me-2" @click="markAllAsRead">
            <i class="bi bi-check-all"></i> {{ $t('notifications.markAllAsRead') }}
          </button>
          <button class="btn btn-primary btn-sm" @click="showCreateModal = true">
            <i class="bi bi-plus"></i> {{ $t('notifications.create') }}
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="row mb-3">
            <div class="col-md-4">
                <input type="text" class="form-control" :placeholder="$t('notifications.searchPlaceholder')" v-model="searchQuery" @input="searchNotifications">
            </div>
        </div>
        <div class="table-responsive">
          <table class="table table-bordered" width="100%" cellspacing="0">
            <thead>
              <tr>
                <th @click="setSortKey('id')">{{ $t('notifications.id') }} <i class="bi" :class="getSortIcon('id')"></i></th>
                <th @click="setSortKey('message')">{{ $t('notifications.message') }} <i class="bi" :class="getSortIcon('message')"></i></th>
                <th @click="setSortKey('type')">{{ $t('notifications.type') }} <i class="bi" :class="getSortIcon('type')"></i></th>
                <th v-if="isAdmin">{{ $t('notifications.assignedTo') }}</th>
                <th @click="setSortKey('is_read')">{{ $t('notifications.status') }} <i class="bi" :class="getSortIcon('is_read')"></i></th>
                <th @click="setSortKey('created_at')">{{ $t('notifications.date') }} <i class="bi" :class="getSortIcon('created_at')"></i></th>
                <th>{{ $t('notifications.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="notifications.length === 0">
                <td :colspan="isAdmin ? 7 : 6" class="text-center">{{ $t('notifications.noNotifications') }}</td>
              </tr>
              <tr v-for="notification in notifications" :key="notification.id" :class="{ 'fw-bold': !notification.is_read }">
                <td>{{ notification.id }}</td>
                <td>{{ notification.message }}</td>
                <td><span class="badge bg-info">{{ notification.type }}</span></td>
                <td v-if="isAdmin">
                  <span v-if="notification.user" class="badge bg-secondary">
                    {{ notification.user.first_name }} {{ notification.user.last_name }}
                    <small class="text-muted">({{ notification.user.role?.name }})</small>
                  </span>
                  <span v-else class="text-muted">{{ $t('notifications.unassigned') }}</span>
                </td>
                <td>
                  <span :class="['badge', notification.is_read ? 'bg-success' : 'bg-warning']">
                    {{ notification.is_read ? $t('notifications.read') : $t('notifications.unread') }}
                  </span>
                </td>
                <td>{{ new Date(notification.created_at).toLocaleString() }}</td>
                <td>
                  <button class="btn btn-sm btn-light me-2" @click="markAsRead(notification.id)" :disabled="notification.is_read">
                    <i class="bi bi-check"></i>
                  </button>
                  <button class="btn btn-sm btn-warning me-2" @click="showEditModal(notification)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" @click="deleteNotification(notification.id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="d-flex justify-content-end mt-3">
          <BPagination
            v-model="currentPage"
            :total-rows="totalNotifications"
            :per-page="perPage"
            @change="fetchNotifications"
          />
        </div>
      </div>
    </div>
    
    <!-- Create Notification Modal -->
    <BModal v-model="showCreateModal" :title="$t('notifications.createModalTitle')" @ok="handleCreateNotification">
        <form>
            <div class="mb-3">
                <label for="notificationType" class="form-label">{{ $t('notifications.type') }}</label>
                <select class="form-select" id="notificationType" v-model="newNotification.type">
                    <option value="NewTask">{{ $t('notifications.types.NewTask') }}</option>
                    <option value="TaskUpdate">{{ $t('notifications.types.TaskUpdate') }}</option>
                    <option value="ContractReminder">{{ $t('notifications.types.ContractReminder') }}</option>
                    <option value="SystemAlert">{{ $t('notifications.types.SystemAlert') }}</option>
                    <option value="InvestorContractExpiry">{{ $t('notifications.types.InvestorContractExpiry') }}</option>
                    <option value="HighValueTransaction">{{ $t('notifications.types.HighValueTransaction') }}</option>
                    <option value="OfficeBookingRequest">{{ $t('notifications.types.OfficeBookingRequest') }}</option>
                    <option value="ClientDeletion">{{ $t('notifications.types.ClientDeletion') }}</option>
                </select>
            </div>
            <div class="mb-3" v-if="isAdmin">
                <label for="notificationUser" class="form-label">{{ $t('notifications.assignTo') }}</label>
                <select class="form-select" id="notificationUser" v-model="newNotification.user_id">
                    <option :value="null">{{ $t('notifications.selectUser') }}</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ user.first_name }} {{ user.last_name }} ({{ user.role?.name }})
                    </option>
                </select>
            </div>
            <div class="mb-3">
                <label for="notificationMessage" class="form-label">{{ $t('notifications.message') }}</label>
                <textarea class="form-control" id="notificationMessage" rows="3" v-model="newNotification.message"></textarea>
            </div>
        </form>
    </BModal>

    <!-- Edit Notification Modal -->
    <BModal v-model="showEditNotificationModal" :title="$t('notifications.editModalTitle')" @ok="handleUpdateNotification">
        <form>
            <div class="mb-3">
                <label for="notificationType" class="form-label">{{ $t('notifications.type') }}</label>
                <select class="form-select" id="notificationType" v-model="editingNotification.type">
                    <option value="NewTask">{{ $t('notifications.types.NewTask') }}</option>
                    <option value="TaskUpdate">{{ $t('notifications.types.TaskUpdate') }}</option>
                    <option value="ContractReminder">{{ $t('notifications.types.ContractReminder') }}</option>
                    <option value="SystemAlert">{{ $t('notifications.types.SystemAlert') }}</option>
                    <option value="InvestorContractExpiry">{{ $t('notifications.types.InvestorContractExpiry') }}</option>
                    <option value="HighValueTransaction">{{ $t('notifications.types.HighValueTransaction') }}</option>
                    <option value="OfficeBookingRequest">{{ $t('notifications.types.OfficeBookingRequest') }}</option>
                    <option value="ClientDeletion">{{ $t('notifications.types.ClientDeletion') }}</option>
                    <option value="WithdrawalRequest">{{ $t('notifications.types.WithdrawalRequest') }}</option>
                </select>
            </div>
            <div class="mb-3" v-if="isAdmin">
                <label for="editNotificationUser" class="form-label">{{ $t('notifications.assignTo') }}</label>
                <select class="form-select" id="editNotificationUser" v-model="editingNotification.user_id">
                    <option :value="null">{{ $t('notifications.selectUser') }}</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ user.first_name }} {{ user.last_name }} ({{ user.role?.name }})
                    </option>
                </select>
            </div>
            <div class="mb-3">
                <label for="notificationMessage" class="form-label">{{ $t('notifications.message') }}</label>
                <textarea class="form-control" id="notificationMessage" rows="3" v-model="editingNotification.message"></textarea>
            </div>
        </form>
    </BModal>

    <!-- Delete Confirmation Modal -->
    <BModal v-model="showDeleteConfirmModal" title="Confirm Deletion" @ok="confirmDelete">
        <p>{{ $t('notifications.deleteConfirm') }}</p>
    </BModal>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getNotifications, markNotificationsAsRead } from '@/services/notificationService';
import apiClient from '@/services/ApiClient';
import { BModal, BPagination } from 'bootstrap-vue-next';
import { useAuthStore } from '@/stores/auth';
import { getUsers } from '@/services/UserService';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.userRole === 'admin');

const notifications = ref([]);
const currentPage = ref(1);
const totalNotifications = ref(0);
const perPage = ref(10);
const searchQuery = ref('');
const sortKey = ref('created_at');
const sortOrder = ref('DESC');
const showCreateModal = ref(false);
const showEditNotificationModal = ref(false);
const showDeleteConfirmModal = ref(false);
const notificationToDelete = ref(null);
const editingNotification = ref({});
const newNotification = ref({
    type: 'SystemAlert',
    message: '',
    user_id: null
});
const users = ref([]);

const showEditModal = (notification) => {
    editingNotification.value = {
        ...notification,
        user_id: notification.user_id || (notification.user ? notification.user.id : null)
    };
    showEditNotificationModal.value = true;
};

const fetchNotifications = async (page = 1) => {
  try {
    const params = {
      page,
      limit: perPage.value,
      search: searchQuery.value,
      sort: sortKey.value,
      order: sortOrder.value,
    };
    const response = await getNotifications(params);
    if (response.data.success) {
      notifications.value = response.data.notifications;
      totalNotifications.value = response.data.total;
      currentPage.value = response.data.page;
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }
};

const markAsRead = async (id) => {
    try {
        await markNotificationsAsRead([id]);
        fetchNotifications(currentPage.value);
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
};

const markAllAsRead = async () => {
    const unreadIds = notifications.value.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
        try {
            await markNotificationsAsRead(unreadIds);
            fetchNotifications(currentPage.value);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }
};

const handleCreateNotification = async () => {
    try {
        await apiClient.post('/notifications', newNotification.value);
        showCreateModal.value = false;
        newNotification.value.message = '';
        newNotification.value.user_id = null;
        fetchNotifications(currentPage.value);
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

const handleUpdateNotification = async () => {
    if (!editingNotification.value) return;
    try {
        const updateData = {
            message: editingNotification.value.message,
            type: editingNotification.value.type,
        };

        // Add user_id if admin is editing
        if (isAdmin.value) {
            updateData.user_id = editingNotification.value.user_id;
        }

        await apiClient.put(`/notifications/${editingNotification.value.id}`, updateData);
        showEditNotificationModal.value = false;
        fetchNotifications(currentPage.value);
    } catch (error) {
        console.error('Failed to update notification:', error);
    }
};

const deleteNotification = (id) => {
    notificationToDelete.value = id;
    showDeleteConfirmModal.value = true;
};

const confirmDelete = async () => {
    if (!notificationToDelete.value) return;
    try {
        await apiClient.delete(`/notifications/${notificationToDelete.value}`);
        fetchNotifications(currentPage.value);
    } catch (error) {
        console.error('Failed to delete notification:', error);
    } finally {
        notificationToDelete.value = null;
    }
};

const searchNotifications = () => {
    fetchNotifications(1);
};



const setSortKey = (key) => {
    if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC';
    } else {
        sortKey.value = key;
        sortOrder.value = 'DESC';
    }
    fetchNotifications(1);
};

const getSortIcon = (key) => {
    if (sortKey.value !== key) {
        return 'bi-sort-down-alt';
    }
    return sortOrder.value === 'ASC' ? 'bi-sort-up' : 'bi-sort-down';
};

const fetchUsers = async () => {
  if (isAdmin.value) {
    try {
      const response = await getUsers();
      if (response.data.success) {
        users.value = response.data.data;
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }
};

onMounted(() => {
  fetchNotifications(currentPage.value);
  fetchUsers();
});
</script>

<style scoped>
.fw-bold {
    font-weight: 700 !important;
}
</style>