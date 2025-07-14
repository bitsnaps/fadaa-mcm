<template>
  <div class="container mt-5">
    <h1 class="mb-4 text-fadaa-blue">{{ $t('userProfile.title') }}</h1>

    <div class="row">
      <!-- Profile Picture Section -->
      <div class="col-md-4 mb-4">
        <div class="card shadow-sm">
          <div class="card-body text-center">
            <img :src="profileImageUrl" alt="Photo de profil" class="img-fluid rounded-circle mb-3" style="width: 150px; height: 150px; object-fit: cover;">
            <h5 class="card-title text-fadaa-orange">{{ user.firstName }} {{ user.lastName }}</h5>
            <p class="text-muted">{{ user.role }}</p>
            <input type="file" class="form-control form-control-sm mt-3" @change="onFileChange" accept="image/*">
            <button class="btn btn-sm btn-primary mt-2" @click="uploadProfilePicture" :disabled="!selectedFile">
              {{ $t('userProfile.uploadPicture') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Personal Information Section -->
      <div class="col-md-8 mb-4">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0 text-fadaa-blue">{{ $t('userProfile.personalInformation') }}</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="updateProfile">
              <div class="mb-3 row">
                <label for="firstName" class="col-sm-3 col-form-label">{{ $t('userProfile.firstName') }}</label>
                <div class="col-sm-9">
                  <input type="text" class="form-control" id="firstName" v-model="editableUser.firstName">
                </div>
              </div>
              <div class="mb-3 row">
                <label for="lastName" class="col-sm-3 col-form-label">{{ $t('userProfile.lastName') }}</label>
                <div class="col-sm-9">
                  <input type="text" class="form-control" id="lastName" v-model="editableUser.lastName">
                </div>
              </div>
              <div class="mb-3 row">
                <label for="email" class="col-sm-3 col-form-label">{{ $t('userProfile.email') }}</label>
                <div class="col-sm-9">
                  <input type="email" class="form-control" id="email" v-model="editableUser.email" readonly>
                   <small class="form-text text-muted">{{ $t('userProfile.emailCannotBeChanged') }}</small>
                </div>
              </div>
              <div class="mb-3 row">
                <label for="phone" class="col-sm-3 col-form-label">{{ $t('userProfile.phone') }}</label>
                <div class="col-sm-9">
                  <input type="tel" class="form-control" id="phone" v-model="editableUser.phone">
                </div>
              </div>
              <div class="d-flex justify-content-end">
                <button type="submit" class="btn btn-primary">{{ $t('userProfile.saveChanges') }}</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Change Password Section -->
        <div class="card shadow-sm mt-4">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0 text-fadaa-blue">{{ $t('userProfile.changePassword') }}</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="changePassword">
              <div class="mb-3">
                <label for="currentPassword" class="form-label">{{ $t('userProfile.currentPassword') }}</label>
                <input type="password" class="form-control" id="currentPassword" v-model="passwordForm.currentPassword" required>
              </div>
              <div class="mb-3">
                <label for="newPassword" class="form-label">{{ $t('userProfile.newPassword') }}</label>
                <input type="password" class="form-control" id="newPassword" v-model="passwordForm.newPassword" required>
              </div>
              <div class="mb-3">
                <label for="confirmPassword" class="form-label">{{ $t('userProfile.confirmNewPassword') }}</label>
                <input type="password" class="form-control" id="confirmPassword" v-model="passwordForm.confirmPassword" required>
              </div>
              <div class="d-flex justify-content-end">
                <button type="submit" class="btn btn-primary">{{ $t('userProfile.changePassword') }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();

const user = computed(() => authStore.user || { firstName: '', lastName: '', email: '', phone: '', role: '', profilePictureUrl: '' });

const editableUser = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
});

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const selectedFile = ref(null);
const profileImageUrl = ref('/logo.png'); // Default placeholder image

onMounted(() => {
  if (user.value) {
    editableUser.firstName = user.value.firstName;
    editableUser.lastName = user.value.lastName;
    editableUser.email = user.value.email;
    editableUser.phone = user.value.phone;
    if (user.value.profilePictureUrl) {
        profileImageUrl.value = user.value.profilePictureUrl;
    }
  }
});

const onFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      profileImageUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const uploadProfilePicture = async () => {
  if (!selectedFile.value) {
    alert(t('userProfile.alerts.selectFile'));
    return;
  }
  // Placeholder for actual upload logic
  console.log('Uploading picture:', selectedFile.value.name);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Assume success and update store/user object if backend updates it
  // For now, we've already updated profileImageUrl for preview
  // authStore.updateUserProfilePicture(newImageUrl); // Example if store handles it
  alert(t('userProfile.alerts.pictureUpdated'));
  selectedFile.value = null; // Reset file input
};

const updateProfile = async () => {
  // Placeholder for actual profile update logic
  console.log('Updating profile with:', editableUser);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  // authStore.updateUser(editableUser); // Example if store handles it
  alert(t('userProfile.alerts.profileUpdated'));
};

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alert(t('userProfile.alerts.passwordsDoNotMatch'));
    return;
  }
  if (passwordForm.newPassword.length < 6) { // Example validation
      alert(t('userProfile.alerts.passwordTooShort'));
      return;
  }
  // Placeholder for actual password change logic
  console.log('Changing password...');
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  // const success = await authStore.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
  // if (success) {
  //   alert('Mot de passe changé avec succès.');
  // } else {
  //   alert('Échec du changement de mot de passe. Vérifiez votre mot de passe actuel.');
  // }
  alert(t('userProfile.alerts.passwordChanged'));
  passwordForm.currentPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
};

</script>

<style scoped>
.text-fadaa-blue {
  color: var(--fadaa-blue);
}
.text-fadaa-orange {
  color: var(--fadaa-orange);
}
.bg-fadaa-light-blue {
  background-color: var(--fadaa-light-blue);
}
.card-header h5 {
    color: var(--fadaa-blue);
}
</style>