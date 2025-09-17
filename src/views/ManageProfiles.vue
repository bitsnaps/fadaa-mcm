<template>
  <div class="container-fluid mt-4">
    <h1 class="h2 mb-4">{{ $t('sidebar.manageProfiles') }}</h1>

    <!-- Add Profile Button -->
    <button class="btn btn-primary mb-3" @click="openProfileModal()">{{ $t('profiles.addProfile') }}</button>

    <!-- Profiles Table -->
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>{{ $t('profiles.tableHeaders.name') }}</th>
            <th>{{ $t('profiles.tableHeaders.description') }}</th>
            <th>{{ $t('profiles.tableHeaders.status') }}</th>
            <th>{{ $t('profiles.tableHeaders.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="profile in profiles" :key="profile.id">
            <td>{{ profile.name }}</td>
            <td>{{ profile.description }}</td>
            <td>
              <span :class="['badge', profile.is_active ? 'bg-success' : 'bg-secondary']">
                {{ profile.is_active ? $t('profiles.status.active') : $t('profiles.status.inactive') }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-success me-2" @click="activateProfile(profile.id)" :disabled="profile.is_active">
                {{ $t('profiles.activate') }}
              </button>
              <button class="btn btn-sm btn-warning me-2" @click="openProfileModal(profile)">
                {{ $t('profiles.edit') }}
              </button>
              <button class="btn btn-sm btn-danger" @click="confirmDelete(profile.id)" :disabled="profile.is_active">
                {{ $t('profiles.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Profile Modal -->
    <div class="modal" tabindex="-1" ref="profileModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditMode ? $t('profiles.editProfile') : $t('profiles.addProfile') }}</h5>
            <button type="button" class="btn-close" @click="closeProfileModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveProfile">
              <div class="mb-3">
                <label for="profile-name" class="form-label">{{ $t('profiles.tableHeaders.name') }} <span class="text-danger">*</span></label>
                <input type="text" id="profile-name" class="form-control" v-model="v$.name.$model" :class="{ 'is-invalid': v$.name.$error }">
                <div v-if="v$.name.$error" class="invalid-feedback">
                  <p v-for="error of v$.name.$errors" :key="error.$uid">{{ error.$message }}</p>
                </div>
              </div>
              <div class="mb-3">
                <label for="profile-description" class="form-label">{{ $t('profiles.tableHeaders.description') }}</label>
                <textarea id="profile-description" class="form-control" v-model="currentProfile.description"></textarea>
              </div>
              <div class="mb-3" v-if="errors.server">
                <div class="alert alert-danger">
                  <p>{{ errors.server }}</p>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeProfileModal">{{ $t('addClient.form.cancel') }}</button>
            <button type="button" class="btn btn-primary" @click="saveProfile">{{ $t('manageUsers.save') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { Modal } from 'bootstrap';
import profileService from '@/services/profileService';
import { useI18n } from 'vue-i18n';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';

const { t } = useI18n();
const profiles = ref([]);
const currentProfile = ref({ id: null, name: '', description: '' });
const isEditMode = ref(false);
const profileModal = ref(null);
const errors = reactive({ server: '', name: '' });
let modalInstance = null;

const rules = computed(() => ({
  name: { required },
}));

const v$ = useVuelidate(rules, currentProfile);

onMounted(async () => {
  await fetchProfiles();
  modalInstance = new Modal(profileModal.value);
});

async function fetchProfiles() {
  try {
    const response = await profileService.getAllProfiles();
    profiles.value = response.data;
  } catch (error) {
    console.error('Error fetching profiles:', error);
    profiles.value = [];
  }
}

function openProfileModal(profile = null) {
  if (profile) {
    isEditMode.value = true;
    currentProfile.value = { ...profile };
  } else {
    isEditMode.value = false;
    currentProfile.value = { id: null, name: '', description: '' };
  }
  v$.value.$reset();
  errors.server = '';
  errors.name = '';
  modalInstance.show();
}

function closeProfileModal() {
  modalInstance.hide();
}

async function saveProfile() {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    if (isEditMode.value) {
      await profileService.updateProfile(currentProfile.value.id, currentProfile.value);
    } else {
      await profileService.createProfile(currentProfile.value);
    }
    await fetchProfiles();
    closeProfileModal();
  } catch (error) {
    if (error.response && error.response.status === 422) {
      const backendErrors = error.response.data.errors;
      if (backendErrors.name) {
        errors.name = backendErrors.name;
        // This is a bit of a hack to show server-side errors in Vuelidate
        v$.value.name.$errors.push({ $uid: 'server-error', $message: backendErrors.name });
      }
      errors.server = backendErrors.server || 'Please check the fields below.';
    } else {
      errors.server = error.message || 'An unexpected error occurred.';
    }
    console.error('Error saving profile:', error);
  }
}

async function activateProfile(profileId) {
  try {
    await profileService.setActiveProfile(profileId);
    await fetchProfiles();
  } catch (error) {
    console.error('Error activating profile:', error);
  }
}

async function confirmDelete(profileId) {
  if (confirm(t('profiles.confirmDelete'))) {
    try {
      await profileService.deleteProfile(profileId);
      await fetchProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
      // Error toast is handled globally by ApiClient interceptor
    }
  }
}
</script>

<style scoped>
/* Add any page-specific styles here */
</style>