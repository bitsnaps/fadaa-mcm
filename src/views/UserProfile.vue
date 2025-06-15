<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-4">
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h5 class="m-0 font-weight-bold text-primary">Profile Picture</h5>
          </div>
          <div class="card-body text-center">
            <img :src="user.avatar || '/src/public/default-avatar.png'" class="rounded-circle mb-3" width="150" height="150" alt="Profile Picture">
            <div class="d-flex justify-content-center">
              <input type="file" ref="fileInput" class="d-none" @change="handleFileUpload" accept="image/*">
              <button @click="$refs.fileInput.click()" class="btn btn-primary btn-sm me-2">
                <i class="bi bi-upload me-1"></i> Upload
              </button>
              <button @click="removeAvatar" class="btn btn-outline-danger btn-sm">
                <i class="bi bi-trash me-1"></i> Remove
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-8">
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h5 class="m-0 font-weight-bold text-primary">Personal Information</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="updateProfile">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">First Name</label>
                  <input v-model="user.firstName" type="text" class="form-control" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Last Name</label>
                  <input v-model="user.lastName" type="text" class="form-control" required>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input v-model="user.email" type="email" class="form-control" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Phone Number</label>
                <input v-model="user.phone" type="tel" class="form-control">
              </div>
              
              <button type="submit" class="btn btn-primary">
                <i class="bi bi-save me-1"></i> Save Changes
              </button>
            </form>
          </div>
        </div>
        
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h5 class="m-0 font-weight-bold text-primary">Change Password</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="changePassword">
              <div class="mb-3">
                <label class="form-label">Current Password</label>
                <input v-model="password.current" type="password" class="form-control" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">New Password</label>
                <input v-model="password.new" type="password" class="form-control" required>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Confirm New Password</label>
                <input v-model="password.confirm" type="password" class="form-control" required>
              </div>
              
              <button type="submit" class="btn btn-primary">
                <i class="bi bi-key me-1"></i> Change Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const user = ref({
  firstName: authStore.user?.firstName || '',
  lastName: authStore.user?.lastName || '',
  email: authStore.user?.email || '',
  phone: authStore.user?.phone || '',
  avatar: authStore.user?.avatar || null
});

const password = ref({
  current: '',
  new: '',
  confirm: ''
});

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      user.value.avatar = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeAvatar = () => {
  user.value.avatar = null;
};

const updateProfile = async () => {
  try {
    // Call API to update profile
    await authStore.updateProfile(user.value);
    alert('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile');
  }
};

const changePassword = async () => {
  if (password.value.new !== password.value.confirm) {
    alert('New passwords do not match!');
    return;
  }
  
  try {
    // Call API to change password
    await authStore.changePassword({
      currentPassword: password.value.current,
      newPassword: password.value.new
    });
    alert('Password changed successfully!');
    password.value = { current: '', new: '', confirm: '' };
  } catch (error) {
    console.error('Error changing password:', error);
    alert('Failed to change password');
  }
};
</script>

<style scoped>
/* Add component-specific styles here */
.container {
  padding-top: 20px;
}
</style>