<template>
  <div class="manage-users-container container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ $t('manageUsers.title') }}</h2>
      <button class="btn btn-fadaa-primary" @click="showAddUserModal = true">
        <i class="bi bi-plus-circle-fill me-2"></i>{{ $t('manageUsers.addUser') }}
      </button>
    </div>

    <!-- User Table -->
    <div class="card shadow-sm">
      <div class="card-header bg-fadaa-light-blue">
        <h5 class="mb-0"><i class="bi bi-list-ul me-2"></i>{{ $t('manageUsers.userList') }}</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>{{ $t('manageUsers.id') }}</th>
                <th>{{ $t('manageUsers.fullName') }}</th>
                <th>{{ $t('manageUsers.email') }}</th>
                <th>{{ $t('manageUsers.role') }}</th>
                <th>{{ $t('manageUsers.status') }}</th>
                <th>{{ $t('manageUsers.createdAt') }}</th>
                <th>{{ $t('manageUsers.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.first_name }} {{ user.last_name }}</td>
                <td>{{ user.email }}</td>
                <td><span :class="`badge bg-${getRoleClass(user.role.name)}`">{{ user.role.name }}</span></td>
                <td><span :class="`badge bg-${user.is_active ? 'success' : 'secondary'}`">{{ user.is_active ? $t('manageUsers.active') : $t('manageUsers.inactive') }}</span></td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-2" @click="editUser(user)">
                    <i class="bi bi-pencil-fill"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDeleteUser(user)">
                    <i class="bi bi-trash-fill"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!users.length">
                <td colspan="7" class="text-center text-muted">{{ $t('manageUsers.noUsersFound') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit User Modal -->
    <div v-if="showAddUserModal || editingUser" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingUser ? $t('manageUsers.editUser') : $t('manageUsers.addUserTitle') }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveUser">
              <div class="mb-3">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="userFirstName" class="form-label">{{ $t('manageUsers.firstName') }}</label>
                    <input type="text" class="form-control" id="userFirstName" v-model="currentUser.first_name" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="userLastName" class="form-label">{{ $t('manageUsers.lastName') }}</label>
                    <input type="text" class="form-control" id="userLastName" v-model="currentUser.last_name" required>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="userEmail" class="form-label">{{ $t('manageUsers.emailAddress') }}</label>
                  <input type="email" class="form-control" id="userEmail" v-model="currentUser.email" required>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="userRole" class="form-label">{{ $t('manageUsers.role') }}</label>
                    <select class="form-select" id="userRole" v-model="currentUser.role_id" required>
                      <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
                    </select>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="userBranch" class="form-label">{{ $t('manageUsers.branch') }}</label>
                    <select class="form-select" id="userBranch" v-model="currentUser.branch_id">
                      <option :value="null">{{ $t('manageUsers.noBranch') }}</option>
                      <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                    </select>
                  </div>
                </div>
                <div class="mb-3" v-if="!editingUser">
                  <label for="userPassword" class="form-label">{{ $t('manageUsers.password') }}</label>
                  <input type="password" class="form-control" id="userPassword" v-model="currentUser.password" :required="!editingUser">
                </div>
                <div class="mb-3">
                  <label for="userStatus" class="form-label">{{ $t('manageUsers.status') }}</label>
                  <select class="form-select" id="userStatus" v-model="currentUser.is_active" required>
                    <option :value="true">{{ $t('manageUsers.active') }}</option>
                    <option :value="false">{{ $t('manageUsers.inactive') }}</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">{{ $t('manageUsers.cancel') }}</button>
                <button type="submit" class="btn btn-fadaa-primary">{{ editingUser ? $t('manageUsers.save') : $t('manageUsers.add') }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="userToDelete" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ $t('manageUsers.confirmDeleteTitle') }}</h5>
            <button type="button" class="btn-close" @click="userToDelete = null"></button>
          </div>
          <div class="modal-body">
            <p>{{ $t('manageUsers.confirmDeleteMessage', { userName: `${userToDelete.first_name} ${userToDelete.last_name}` }) }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="userToDelete = null">{{ $t('manageUsers.cancel') }}</button>
            <button type="button" class="btn btn-danger" @click="deleteUser">{{ $t('manageUsers.delete') }}</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getUsers, getRoles, getBranches, updateUser, addUser, deleteUser as deleteUserApi } from '@/services/UserService';
import { formatDate } from '@/helpers/utils';

const { t } = useI18n();

const users = ref([]);
const roles = ref([]);
const branches = ref([]);
const showAddUserModal = ref(false);
const editingUser = ref(null);
const userToDelete = ref(null);

const defaultUser = {
  first_name: '',
  last_name: '',
  email: '',
  role_id: null,
  branch_id: null,
  password: '',
  is_active: true,
};

const currentUser = ref({ ...defaultUser });

const fetchUsers = async () => {
  try {
    const response = await getUsers();
    if (response.data.success) {
      users.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    //
  }
};

const fetchRoles = async () => {
  try {
    const response = await getRoles();
    if (response.data.success) {
      roles.value = response.data.roles;
    }
  } catch (error) {
    console.error('Failed to fetch roles:', error);
  }
};

const fetchBranches = async () => {
  try {
    const response = await getBranches();
    if (response.data.success) {
      branches.value = response.data.branches;
    }
  } catch (error) {
    console.error('Failed to fetch branches:', error);
  }
};

onMounted(() => {
  fetchUsers();
  fetchRoles();
  fetchBranches();
});


const getRoleClass = (roleName) => {
    if (!roleName) return 'secondary';
  switch (roleName.toLowerCase()) {
    case 'admin': return 'danger';
    case 'assistant': return 'warning text-dark';
    case 'investor': return 'info text-dark';
    case 'client': return 'success';
    default: return 'secondary';
  }
};

const closeModal = () => {
  showAddUserModal.value = false;
  editingUser.value = null;
  currentUser.value = { ...defaultUser };
};

const editUser = (user) => {
  editingUser.value = user;
  currentUser.value = {
    ...user,
    role_id: user.role.id,
    branch_id: user.branch ? user.branch.id : null,
   };
  showAddUserModal.value = true;
};

const saveUser = async () => {
  try {
    if (editingUser.value) {
      // Update User
      const payload = { ...currentUser.value };
      delete payload.password; // Do not send password on update
      await updateUser(editingUser.value.id, payload);
      console.log(t('manageUsers.userUpdatedSuccess'));
    } else {
      // Add User
      await addUser(currentUser.value);
      console.log(t('manageUsers.userAddedSuccess'));
    }
    fetchUsers();
    closeModal();
  } catch (error) {
    console.error('Failed to save user:', error);
    const errorMessage = error.response?.data?.message || 'An unknown error occurred';
    console.log(`Error: ${errorMessage}`);
  }
};

const confirmDeleteUser = (user) => {
  userToDelete.value = user;
};

const deleteUser = async () => {
  if (!userToDelete.value) return;
  try {
    await deleteUserApi(userToDelete.value.id);
    console.log(t('manageUsers.userDeletedSuccess', { userName: `${userToDelete.value.first_name} ${userToDelete.value.last_name}` }));
    fetchUsers();
    userToDelete.value = null;
  } catch (error) {
    console.error('Failed to delete user:', error);
    console.log('Failed to delete user.');
  }
};

</script>

<style scoped>
.manage-users-container {
  padding: 20px;
}

.card-header.bg-fadaa-light-blue {
  background-color: #e7f3fe;
  color: #0d6efd;
  border-bottom: 1px solid #dee2e6;
}

.btn-fadaa-primary {
  background-color: #0D6EFD;
  border-color: #0D6EFD;
  color: white;
}
.btn-fadaa-primary:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

.modal.show {
  display: block;
}

.table th {
  font-weight: 600;
}

.badge {
  font-size: 0.85em;
  padding: 0.4em 0.6em;
}
</style>