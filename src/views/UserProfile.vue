
<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
import { updateUserProfile, changePassword, uploadProfilePicture } from '@/services/UserService';
import { useToast } from '@/helpers/toast';

const { t } = useI18n();
const authStore = useAuthStore();
const { showErrorToast } = useToast();

const user = computed(() => authStore.user || { firstName: '', lastName: '', email: '', phone: '', role: '', profile_picture: '' });

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
const profileImageUrl = ref(user.value?.profile_picture ? `${[import.meta.env.VITE_PUBLIC_URL || '',user.value.profile_picture].join('/')}`: '/logo.png');

onMounted(() => {
  if (user.value) {
    editableUser.firstName = user.value.first_name;
    editableUser.lastName = user.value.last_name;
    editableUser.email = user.value.email;
    editableUser.phone = user.value.phone;
    if (user.value.profile_picture) {
        profileImageUrl.value = `${[import.meta.env.VITE_PUBLIC_URL || '',user.value.profile_picture].join('/')}`;
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

const handleUploadProfilePicture = async () => {
  if (!selectedFile.value) {
    showErrorToast(t('userProfile.alerts.selectFile'));
    return;
  }
  
  const formData = new FormData();
  formData.append('profile_picture', selectedFile.value);

  try {
    const { data: response } = await uploadProfilePicture(user.value.id, formData);
    if (response.success) {
      // Success message will be handled by the global response interceptor
      authStore.updateUserProfilePicture(response.filePath);
      profileImageUrl.value = `${import.meta.env.VITE_PUBLIC_URL|| ''}${response.filePath}`;
      selectedFile.value = null;
    } else {
      showErrorToast(response.message || t('userProfile.alerts.pictureUpdateFailed'));
    }
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    // Error message will be handled by the global error interceptor
  }
};

const handleUpdateProfile = async () => {
  try {
    const { data: response } = await updateUserProfile(user.value.id, {
      first_name: editableUser.firstName,
      last_name: editableUser.lastName,
      phone: editableUser.phone,
    });
    if (response.success) {
      // Success message will be handled by the global response interceptor
      authStore.updateUser({
        first_name: editableUser.firstName,
        last_name: editableUser.lastName,
        phone: editableUser.phone,
      });
    } else {
      showErrorToast(t('userProfile.alerts.profileUpdateFailed'));
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    // Error message will be handled by the global error interceptor
  }
};

const handleChangePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showErrorToast(t('userProfile.alerts.passwordsDoNotMatch'));
    return;
  }
  if (passwordForm.newPassword.length < 6) {
    showErrorToast(t('userProfile.alerts.passwordTooShort'));
    return;
  }

  try {
    const response = await changePassword(user.value.id, {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    if (response.success) {
      // Success message will be handled by the global response interceptor
      passwordForm.currentPassword = '';
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
    } else {
      showErrorToast(response.message || t('userProfile.alerts.passwordChangeFailed'));
    }
  } catch (error) {
    console.error('Error changing password:', error);
    // Error message will be handled by the global error interceptor
  }
};

</script>

<template>
  <div class="container mt-5">
    <h1 class="mb-4 text-fadaa-blue">{{ $t('userProfile.title') }}</h1>

    <div class="row">
      <!-- Profile Picture Section -->
      <div class="col-md-4 mb-4">
        <div class="card shadow-sm">
          <div class="card-body text-center">
            <img :src="profileImageUrl" alt="Photo de profil" class="img-fluid rounded-circle mb-3" style="width: 150px; height: 150px; object-fit: cover;">
            <h5 class="card-title text-fadaa-orange">{{ user.first_name }} {{ user.last_name }}</h5>
            <p class="text-muted">{{ user.role?.name }}</p>
            <input type="file" class="form-control form-control-sm mt-3" @change="onFileChange" accept="image/*">
            <button class="btn btn-sm btn-primary mt-2" @click="handleUploadProfilePicture" :disabled="!selectedFile">
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
            <form @submit.prevent="handleUpdateProfile">
              <div class="mb-3 row">
                <label for="firstName" class="col-sm-3 col-form-label">{{ $t('userProfile.firstName') }} <span class="text-danger">*</span></label>
                <div class="col-sm-9">
                  <input type="text" class="form-control" id="firstName" v-model="editableUser.firstName" required>
                </div>
              </div>
              <div class="mb-3 row">
                <label for="lastName" class="col-sm-3 col-form-label">{{ $t('userProfile.lastName') }} <span class="text-danger">*</span></label>
                <div class="col-sm-9">
                  <input type="text" class="form-control" id="lastName" v-model="editableUser.lastName" required>
                </div>
              </div>
              <div class="mb-3 row">
                <label for="email" class="col-sm-3 col-form-label">{{ $t('userProfile.email') }}</label>
                <div class="col-sm-9">
                  <input type="email" class="form-control" id="email" v-model="editableUser.email" readonly disabled>
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
            <form @submit.prevent="handleChangePassword">
              <div class="mb-3">
                <label for="currentPassword" class="form-label">{{ $t('userProfile.currentPassword') }} <span class="text-danger">*</span></label>
                <input type="password" class="form-control" id="currentPassword" v-model="passwordForm.currentPassword" required>
              </div>
              <div class="mb-3">
                <label for="newPassword" class="form-label">{{ $t('userProfile.newPassword') }} <span class="text-danger">*</span></label>
                <input type="password" class="form-control" id="newPassword" v-model="passwordForm.newPassword" required>
              </div>
              <div class="mb-3">
                <label for="confirmPassword" class="form-label">{{ $t('userProfile.confirmNewPassword') }} <span class="text-danger">*</span></label>
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