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
                <th>{{ $t('manageUsers.name') }}</th>
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
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td><span :class="`badge bg-${getRoleClass(user.role)}`">{{ $t(`manageUsers.roles.${user.role.toLowerCase()}`) }}</span></td>
                <td><span :class="`badge bg-${user.status === 'Actif' ? 'success' : 'secondary'}`">{{ user.status === 'Actif' ? $t('manageUsers.active') : $t('manageUsers.inactive') }}</span></td>
                <td>{{ user.createdAt }}</td>
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
                <label for="userName" class="form-label">{{ $t('manageUsers.fullName') }}</label>
                <input type="text" class="form-control" id="userName" v-model="currentUser.name" required>
              </div>
              <div class="mb-3">
                <label for="userEmail" class="form-label">{{ $t('manageUsers.email') }}</label>
                <input type="email" class="form-control" id="userEmail" v-model="currentUser.email" required>
              </div>
              <div class="mb-3">
                <label for="userRole" class="form-label">{{ $t('manageUsers.role') }}</label>
                <select class="form-select" id="userRole" v-model="currentUser.role" required>
                  <option value="admin">{{ $t('manageUsers.roles.admin') }}</option>
                  <option value="assistant">{{ $t('manageUsers.roles.assistant') }}</option>
                  <option value="investor">{{ $t('manageUsers.roles.investor') }}</option>
                  <option value="client">{{ $t('manageUsers.roles.client') }}</option>
                </select>
              </div>
              <div class="mb-3" v-if="!editingUser">
                <label for="userPassword" class="form-label">{{ $t('manageUsers.password') }}</label>
                <input type="password" class="form-control" id="userPassword" v-model="currentUser.password" :required="!editingUser">
              </div>
               <div class="mb-3">
                <label for="userStatus" class="form-label">{{ $t('manageUsers.status') }}</label>
                <select class="form-select" id="userStatus" v-model="currentUser.status" required>
                  <option value="Actif">{{ $t('manageUsers.active') }}</option>
                  <option value="Inactif">{{ $t('manageUsers.inactive') }}</option>
                </select>
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
            <p>{{ $t('manageUsers.confirmDeleteMessage', { userName: userToDelete.name }) }}</p>
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
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const users = ref([
  { id: 'U001', name: 'Alice Admin', email: 'alice.admin@fadaa.com', role: 'Admin', status: 'Actif', createdAt: '01/01/2023' },
  { id: 'U002', name: 'Bob Assistant', email: 'bob.assistant@fadaa.com', role: 'Assistant', status: 'Actif', createdAt: '15/02/2023' },
  { id: 'U003', name: 'Charlie Client', email: 'charlie.client@example.com', role: 'Client', status: 'Actif', createdAt: '01/03/2023' },
  { id: 'U004', name: 'Diana Investor', email: 'diana.investor@example.com', role: 'Investor', status: 'Inactif', createdAt: '10/04/2023' },
]);

const showAddUserModal = ref(false);
const editingUser = ref(null); // Stores the user object being edited
const userToDelete = ref(null); // Stores the user object to be deleted

const defaultUser = {
  name: '',
  email: '',
  role: 'client',
  password: '',
  status: 'Actif'
};

const currentUser = ref({ ...defaultUser });

const getRoleClass = (role) => {
  switch (role.toLowerCase()) {
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
  currentUser.value = { ...defaultUser }; // Reset form
};

const editUser = (user) => {
  editingUser.value = user;
  currentUser.value = { ...user }; // Populate form with user data
  // Password field is not shown/editable directly for existing users for security
};

const saveUser = () => {
  if (editingUser.value) {
    // Simulate update
    const index = users.value.findIndex(u => u.id === editingUser.value.id);
    if (index !== -1) {
      users.value[index] = { ...currentUser.value, id: editingUser.value.id };
    }
    alert(t('manageUsers.userUpdatedSuccess'));
  } else {
    // Simulate add
    const newUser = {
      ...currentUser.value,
      id: `U${String(Date.now()).slice(-3)}`,
      createdAt: new Date().toLocaleDateString('fr-FR'),
    };
    users.value.unshift(newUser);
    alert(t('manageUsers.userAddedSuccess'));
  }
  closeModal();
};

const confirmDeleteUser = (user) => {
  userToDelete.value = user;
};

const deleteUser = () => {
  if (userToDelete.value) {
    users.value = users.value.filter(u => u.id !== userToDelete.value.id);
    alert(t('manageUsers.userDeletedSuccess', { userName: userToDelete.value.name }));
    userToDelete.value = null;
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