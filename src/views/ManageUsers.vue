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
                <th>{{ $t('manageUsers.branch') }}</th>
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
                <td>{{ user.branch?.name }}</td>
                <td><span :class="`badge bg-${getRoleClass(user.role.name)}`">{{ user.role.name }}</span></td>
                <td><span :class="`badge bg-${user.is_active ? 'success' : 'secondary'}`">{{ user.is_active ? $t('manageUsers.active') : $t('manageUsers.inactive') }}</span></td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-2" @click="editUser(user)">
                    <i class="bi bi-pencil-fill"></i>
                  </button>
                  <button
                    v-if="['assistant','investor','manager'].includes(user.role.name.toLowerCase())"
                    class="btn btn-sm btn-outline-warning me-2"
                    @click="showResetPasswordModal(user)"
                  >
                    <i class="bi bi-key-fill"></i>
                  </button>
                  <button
                    v-if="canDeleteUser(user)"
                    class="btn btn-sm btn-outline-danger"
                    @click="confirmDeleteUser(user)"
                  >
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
                    <label for="userFirstName" class="form-label">{{ $t('manageUsers.firstName') }} <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="userFirstName" v-model="v$.first_name.$model" :class="{ 'is-invalid': v$.first_name.$error }">
                    <div v-if="v$.first_name.$error" class="invalid-feedback">
                      <p v-for="error of v$.first_name.$errors" :key="error.$uid">{{ error.$message }}</p>
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="userLastName" class="form-label">{{ $t('manageUsers.lastName') }} <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="userLastName" v-model="v$.last_name.$model" :class="{ 'is-invalid': v$.last_name.$error }">
                    <div v-if="v$.last_name.$error" class="invalid-feedback">
                      <p v-for="error of v$.last_name.$errors" :key="error.$uid">{{ error.$message }}</p>
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="userEmail" class="form-label">{{ $t('manageUsers.emailAddress') }} <span class="text-danger">*</span></label>
                  <input type="email" class="form-control" id="userEmail" v-model="v$.email.$model" :class="{ 'is-invalid': v$.email.$error }">
                  <div v-if="v$.email.$error" class="invalid-feedback">
                    <p v-for="error of v$.email.$errors" :key="error.$uid">{{ error.$message }}</p>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="userPhone" class="form-label">{{ $t('manageUsers.phone') }}</label>
                  <input type="tel" class="form-control" id="userPhone" v-model="currentUser.phone">
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="userRole" class="form-label">{{ $t('manageUsers.role') }} <span class="text-danger">*</span></label>
                    <select class="form-select" id="userRole" v-model="v$.role_id.$model" :class="{ 'is-invalid': v$.role_id.$error }">
                      <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
                    </select>
                    <div v-if="v$.role_id.$error" class="invalid-feedback">
                      <p v-for="error of v$.role_id.$errors" :key="error.$uid">{{ error.$message }}</p>
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="userBranch" class="form-label">{{ $t('manageUsers.branch') }} <span class="text-danger">*</span></label>
                    <select class="form-select" id="userBranch" v-model="v$.branch_id.$model" :class="{ 'is-invalid': v$.branch_id.$error }">
                      <option :value="null" disabled>{{ $t('manageUsers.selectBranch') }}</option>
                      <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                    </select>
                    <div v-if="v$.branch_id.$error" class="invalid-feedback">
                      <p v-for="error of v$.branch_id.$errors" :key="error.$uid">{{ error.$message }}</p>
                    </div>
                  </div>
                </div>
                <div class="mb-3" v-if="!editingUser">
                  <label for="userPassword" class="form-label">{{ $t('manageUsers.password') }} <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <input :type="passwordFieldType" class="form-control" id="userPassword" v-model="currentUser.password" :class="{ 'is-invalid': v$.password.$error }" :required="!editingUser">
                    <button class="btn btn-outline-secondary" type="button" @click="togglePasswordVisibility">
                      <i class="bi" :class="isPasswordVisible ? 'bi-eye-slash' : 'bi-eye'"></i>
                    </button>
                  </div>
                   <div v-if="v$.password.$error" class="invalid-feedback">
                    <p v-for="error of v$.password.$errors" :key="error.$uid">{{ error.$message }}</p>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="userStatus" class="form-label">{{ $t('manageUsers.status') }}</label>
                  <select class="form-select" id="userStatus" v-model="currentUser.is_active" required>
                    <option :value="true">{{ $t('manageUsers.active') }}</option>
                    <option :value="false">{{ $t('manageUsers.inactive') }}</option>
                  </select>
                </div>
                <div v-if="errors.server" class="alert alert-danger mt-3">
                  {{ errors.server }}
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

    <!-- Reset Password Modal -->
    <div v-if="userToResetPassword" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ $t('manageUsers.resetPasswordTitle') }}</h5>
            <button type="button" class="btn-close" @click="userToResetPassword = null"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="resetPassword">
              <div class="mb-3">
                <label for="newPassword" class="form-label">{{ $t('manageUsers.newPassword') }}</label>
                <div class="input-group">
                  <input :type="passwordFieldType" class="form-control" id="newPassword" v-model="newPassword" required>
                  <button class="btn btn-outline-secondary" type="button" @click="togglePasswordVisibility">
                    <i class="bi" :class="isPasswordVisible ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                </div>
              </div>
              <div class="mb-3">
                <label for="confirmPassword" class="form-label">{{ $t('manageUsers.confirmPassword') }}</label>
                <div class="input-group">
                  <input :type="passwordFieldType" class="form-control" id="confirmPassword" v-model="confirmPassword" required>
                  <button class="btn btn-outline-secondary" type="button" @click="togglePasswordVisibility">
                    <i class="bi" :class="isPasswordVisible ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                </div>
              </div>
               <div v-if="errors.password" class="alert alert-danger mt-3">
                  {{ errors.password }}
                </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="userToResetPassword = null">{{ $t('manageUsers.cancel') }}</button>
                <button type="submit" class="btn btn-primary">{{ $t('manageUsers.resetPassword') }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getUsers, getRoles, getBranches, updateUser, addUser, deleteUser as deleteUserApi, resetPassword as resetPasswordApi } from '@/services/UserService';
import { usePasswordToggle } from '@/composables/usePasswordToggle';
import { formatDate } from '@/helpers/utils';
import { useVuelidate } from '@vuelidate/core';
import { required, email, minLength } from '@vuelidate/validators';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const { passwordFieldType, isPasswordVisible, togglePasswordVisibility } = usePasswordToggle();
const authStore = useAuthStore();

const users = ref([]);
const roles = ref([]);
const branches = ref([]);
const showAddUserModal = ref(false);
const editingUser = ref(null);
const userToDelete = ref(null);
const userToResetPassword = ref(null);
const newPassword = ref('');
const confirmPassword = ref('');

const defaultUser = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role_id: null,
  branch_id: null,
  password: '',
  is_active: true,
};

const currentUser = ref({ ...defaultUser });
const errors = reactive({ server: '', password: '' });

const rules = computed(() => ({
  first_name: { required },
  last_name: { required },
  email: { required, email },
  role_id: { required },
  branch_id: { required },
  password: {
    required: !editingUser.value,
    minLength: !editingUser.value || currentUser.value.password ? minLength(3) : {},
  },
}));

const v$ = useVuelidate(rules, currentUser);

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
    case 'manager': return 'primary';
    default: return 'secondary';
  }
};

const closeModal = () => {
  showAddUserModal.value = false;
  editingUser.value = null;
  currentUser.value = { ...defaultUser };
  v$.value.$reset();
  errors.server = '';
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
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    if (editingUser.value) {
      const payload = { ...currentUser.value };
      delete payload.password;
      await updateUser(editingUser.value.id, payload);
    } else {
      await addUser(currentUser.value);
    }
    fetchUsers();
    closeModal();
  } catch (error) {
    if (error.response && error.response.status === 422) {
      const backendErrors = error.response.data.errors;
      for (const field in backendErrors) {
        if (v$.value[field]) {
          v$.value[field].$errors.push({ $uid: `server-error-${field}`, $message: backendErrors[field] });
        }
      }
      errors.server = 'Please check the fields below for errors.';
    } else {
      errors.server = error.response?.data?.message || 'An unknown error occurred';
    }
    console.error('Failed to save user:', error);
  }
};

const canDeleteUser = (user) => {
  if (!authStore.user) return false;
  return user.id !== authStore.user.id;
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

const showResetPasswordModal = (user) => {
  userToResetPassword.value = user;
  newPassword.value = '';
  confirmPassword.value = '';
  errors.password = '';
};

const resetPassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errors.password = t('userProfile.alerts.passwordsDoNotMatch');// Passwords do not match
    return;
  }
  if (newPassword.value.length < 3) {
    errors.password = t('userProfile.alerts.passwordTooShort');// Password is too short
    return;
  }

  try {
    await resetPasswordApi(userToResetPassword.value.id, { password: newPassword.value });
    userToResetPassword.value = null;
  } catch (error) {
    errors.password = error.response?.data?.message || 'An unknown error occurred';
    console.error('Failed to reset password:', error);
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