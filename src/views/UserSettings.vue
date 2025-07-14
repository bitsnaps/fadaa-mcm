<template>
  <div class="container mt-5">
    <h1 class="mb-4 text-fadaa-blue">{{ $t('userSettings.title') }}</h1>

    <div class="card shadow-sm">
      <div class="card-header bg-fadaa-light-blue">
        <h5 class="mb-0 text-fadaa-blue">{{ $t('userSettings.preferences.title') }}</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveSettings">
          <!-- Language Preference -->
          <div class="mb-4">
            <label for="languageSelect" class="form-label fw-bold">{{ $t('userSettings.preferences.language') }}</label>
            <p class="text-muted small">{{ $t('userSettings.preferences.languageDesc') }}</p>
            <select id="languageSelect" class="form-select" v-model="settings.language">
              <option value="en">{{ $t('userSettings.languages.en') }}</option>
              <option value="fr">{{ $t('userSettings.languages.fr') }}</option>
            </select>
          </div>

          <!-- Theme Preference -->
          <!-- <div class="mb-4">
            <label class="form-label fw-bold">{{ $t('userSettings.preferences.theme') }}</label>
            <p class="text-muted small">{{ $t('userSettings.preferences.themeDesc') }}</p>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="theme" id="lightTheme" value="light" v-model="settings.theme">
              <label class="form-check-label" for="lightTheme">{{ $t('userSettings.themes.light') }}</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="theme" id="darkTheme" value="dark" v-model="settings.theme">
              <label class="form-check-label" for="darkTheme">{{ $t('userSettings.themes.dark') }}</label>
            </div>
          </div> -->

          <!-- Notification Preferences -->
          <!-- <div class="mb-4">
            <label class="form-label fw-bold">{{ $t('userSettings.notifications.title') }}</label>
            <p class="text-muted small">{{ $t('userSettings.notifications.desc') }}</p>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="emailNotifications" v-model="settings.notifications.email.enabled">
              <label class="form-check-label" for="emailNotifications">{{ $t('userSettings.notifications.email') }}</label>
            </div>
            <div class="form-check form-switch mt-2">
              <input class="form-check-input" type="checkbox" id="pushNotifications" v-model="settings.notifications.push.enabled">
              <label class="form-check-label" for="pushNotifications">{{ $t('userSettings.notifications.push') }}</label>
            </div>
          </div> -->

          <div class="d-flex justify-content-end">
            <button type="submit" class="btn btn-primary" :disabled="isSaving">
              <span v-if="isSaving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ isSaving ? $t('userSettings.saving') : $t('userSettings.saveChanges') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';

const { t, locale } = useI18n();
const authStore = useAuthStore();

const isSaving = ref(false);

const settings = reactive({
  language: 'en',
  theme: 'light',
  notifications: {
    email: { enabled: true },
    push: { enabled: false }
  }
});

onMounted(() => {
  const userPreferences = authStore.user?.preferences || {};
  settings.language = userPreferences.language || 'en';
  settings.theme = userPreferences.theme || 'light';
  settings.notifications = {
    ...settings.notifications,
    ...userPreferences.notifications
  };
  applyTheme(settings.theme);
});

watch(() => settings.language, (newLang) => {
  locale.value = newLang;
});


watch(() => settings.theme, (newTheme) => {
  applyTheme(newTheme);
});

const applyTheme = (theme) => {
  document.body.setAttribute('data-bs-theme', theme);
}

const saveSettings = async () => {
  isSaving.value = true;
  console.log('Saving user settings:', JSON.parse(JSON.stringify(settings)));
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
  
  // In a real app, you would call an action in your auth store
  // await authStore.updateUserPreferences(settings);
  authStore.user.preferences = JSON.parse(JSON.stringify(settings));

  isSaving.value = false;
  console.log('Settings saved successfully');
};

</script>

<style scoped>
.text-fadaa-blue {
  color: var(--fadaa-blue);
}
.bg-fadaa-light-blue {
  background-color: var(--fadaa-light-blue);
}
.card-header h5 {
    color: var(--fadaa-blue);
}
.form-label.fw-bold {
    color: var(--fadaa-orange);
}
</style>