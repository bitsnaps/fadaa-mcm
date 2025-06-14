<template>
  <div class="manage-users-container container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Gestion des Utilisateurs</h2>
      <button class="btn btn-fadaa-primary" @click="showAddUserModal = true">
        <i class="bi bi-plus-circle-fill me-2"></i>Ajouter un Utilisateur
      </button>
    </div>

    <!-- User Table -->
    <div class="card shadow-sm">
      <div class="card-header bg-fadaa-light-blue">
        <h5 class="mb-0"><i class="bi bi-list-ul me-2"></i>Liste des Utilisateurs</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Date de Création</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td><span :class="`badge bg-${getRoleClass(user.role)}`">{{ user.role }}</span></td>
                <td><span :class="`badge bg-${user.status === 'Actif' ? 'success' : 'secondary'}`">{{ user.status }}</span></td>
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
                <td colspan="7" class="text-center text-muted">Aucun utilisateur trouvé.</td>
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
            <h5 class="modal-title">{{ editingUser ? 'Modifier Utilisateur' : 'Ajouter Utilisateur' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveUser">
              <div class="mb-3">
                <label for="userName" class="form-label">Nom Complet</label>
                <input type="text" class="form-control" id="userName" v-model="currentUser.name" required>
              </div>
              <div class="mb-3">
                <label for="userEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="userEmail" v-model="currentUser.email" required>
              </div>
              <div class="mb-3">
                <label for="userRole" class="form-label">Rôle</label>
                <select class="form-select" id="userRole" v-model="currentUser.role" required>
                  <option value="admin">Admin</option>
                  <option value="assistant">Assistant</option>
                  <option value="investor">Investisseur</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <div class="mb-3" v-if="!editingUser">
                <label for="userPassword" class="form-label">Mot de passe</label>
                <input type="password" class="form-control" id="userPassword" v-model="currentUser.password" :required="!editingUser">
              </div>
               <div class="mb-3">
                <label for="userStatus" class="form-label">Statut</label>
                <select class="form-select" id="userStatus" v-model="currentUser.status" required>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
                <button type="submit" class="btn btn-fadaa-primary">{{ editingUser ? 'Enregistrer' : 'Ajouter' }}</button>
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
            <h5 class="modal-title">Confirmer la Suppression</h5>
            <button type="button" class="btn-close" @click="userToDelete = null"></button>
          </div>
          <div class="modal-body">
            <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{{ userToDelete.name }}</strong> ? Cette action est irréversible.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="userToDelete = null">Annuler</button>
            <button type="button" class="btn btn-danger" @click="deleteUser">Supprimer</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';

const users = ref([
  { id: 'U001', name: 'Alice Admin', email: 'alice.admin@fadaa.com', role: 'Admin', status: 'Actif', createdAt: '01/01/2023' },
  { id: 'U002', name: 'Bob Assistant', email: 'bob.assistant@fadaa.com', role: 'Assistant', status: 'Actif', createdAt: '15/02/2023' },
  { id: 'U003', name: 'Charlie Client', email: 'charlie.client@example.com', role: 'Client', status: 'Actif', createdAt: '01/03/2023' },
  { id: 'U004', name: 'Diana Investor', email: 'diana.investor@example.com', role: 'Investisseur', status: 'Inactif', createdAt: '10/04/2023' },
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
    case 'investisseur': return 'info text-dark';
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
    alert('Utilisateur mis à jour avec succès (simulation).');
  } else {
    // Simulate add
    const newUser = {
      ...currentUser.value,
      id: `U${String(Date.now()).slice(-3)}`,
      createdAt: new Date().toLocaleDateString('fr-FR'),
    };
    users.value.unshift(newUser);
    alert('Utilisateur ajouté avec succès (simulation).');
  }
  closeModal();
};

const confirmDeleteUser = (user) => {
  userToDelete.value = user;
};

const deleteUser = () => {
  if (userToDelete.value) {
    users.value = users.value.filter(u => u.id !== userToDelete.value.id);
    alert(`Utilisateur ${userToDelete.value.name} supprimé avec succès (simulation).`);
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