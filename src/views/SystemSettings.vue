<template>
  <div class="container-fluid p-4">
    <h1 class="h3 mb-4 text-gray-800">{{ $t('systemSettings.title') }}</h1>

    <div class="row">
      <div class="col-lg-6 mb-4">
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">{{ $t('systemSettings.generalSettings.title') }}</h6>
          </div>
          <div class="card-body">
            <form @submit.prevent="saveSettings">
              <div class="mb-3">
                <label for="siteName" class="form-label">{{ $t('systemSettings.generalSettings.siteName') }}</label>
                <input type="text" class="form-control" id="siteName" v-model="settings.siteName">
              </div>
              <div class="mb-3">
                <label for="siteLogo" class="form-label">{{ $t('systemSettings.generalSettings.siteLogo') }}</label>
                <input type="text" class="form-control" id="siteLogo" v-model="settings.siteLogo">
              </div>
              <div class="mb-3">
                <label for="defaultTheme" class="form-label">{{ $t('systemSettings.generalSettings.defaultTheme') }}</label>
                <select class="form-select" id="defaultTheme" v-model="settings.defaultTheme">
                  <option value="dark">{{ $t('systemSettings.generalSettings.themeOptions.system') }}</option>
                  <option value="light">{{ $t('systemSettings.generalSettings.themeOptions.light') }}</option>
                  <option value="dark">{{ $t('systemSettings.generalSettings.themeOptions.dark') }}</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">{{ $t('systemSettings.generalSettings.saveButton') }}</button>
            </form>
          </div>
        </div>
      </div>

      <div class="col-lg-6 mb-4">
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">{{ $t('systemSettings.emailSettings.title') }}</h6>
          </div>
          <div class="card-body">
            <form @submit.prevent="saveSettings">
              <div class="mb-3">
                <label for="smtpHost" class="form-label">{{ $t('systemSettings.emailSettings.smtpHost') }}</label>
                <input type="text" class="form-control" id="smtpHost" v-model="settings.smtpHost">
              </div>
              <div class="mb-3">
                <label for="smtpPort" class="form-label">{{ $t('systemSettings.emailSettings.smtpPort') }}</label>
                <input type="number" class="form-control" id="smtpPort" v-model="settings.smtpPort">
              </div>
              <div class="mb-3">
                <label for="smtpUser" class="form-label">{{ $t('systemSettings.emailSettings.smtpUser') }}</label>
                <input type="text" class="form-control" id="smtpUser" v-model="settings.smtpUser">
              </div>
              <div class="mb-3">
                <label for="smtpPassword" class="form-label">{{ $t('systemSettings.emailSettings.smtpPassword') }}</label>
                <input type="password" class="form-control" id="smtpPassword" v-model="settings.smtpPassword">
              </div>
              <button type="submit" class="btn btn-primary">{{ $t('systemSettings.emailSettings.saveButton') }}</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
       <div class="col-lg-6 mb-4">
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">{{ $t('systemSettings.apiKeys.title') }}</h6>
          </div>
          <div class="card-body">
            <form @submit.prevent="saveSettings">
              <div class="mb-3">
                <label for="googleApiKey" class="form-label">{{ $t('systemSettings.apiKeys.googleMaps') }}</label>
                <input type="text" class="form-control" id="googleApiKey" v-model="settings.googleMaps">
              </div>
              <div class="mb-3">
                <label for="openAiApiKey" class="form-label">{{ $t('systemSettings.apiKeys.openAI') }}</label>
                <input type="text" class="form-control" id="openAiApiKey" v-model="settings.openAI">
              </div>
              <div class="mb-3">
                <label for="openAIBaseUrl" class="form-label">{{ $t('systemSettings.apiKeys.openAIBaseUrl') }}</label>
                <input type="text" class="form-control" id="openAIBaseUrl" v-model="settings.openAIBaseUrl">
              </div>
              <button type="submit" class="btn btn-primary">{{ $t('systemSettings.apiKeys.saveButton') }}</button>
            </form>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/helpers/toast';
import { getSettings, updateSettings } from '@/services/SystemSettingsService';

const { t } = useI18n();
// const { showSuccessToast, showErrorToast } = useToast();

const settings = ref({});

const loadSettings = async () => {
  try {
    const response = await getSettings();
    settings.value = response.data;
  } catch (error) {
    console.error('Failed to load settings:', error);
    // showErrorToast(t('systemSettings.errors.load'));
  }
};

const saveSettings = async () => {
  try {
    await updateSettings(settings.value);
    // showSuccessToast(t('systemSettings.success.save'));
  } catch (error) {
    console.error('Failed to save settings:', error);
    // showErrorToast(t('systemSettings.errors.save'));
  }
};

onMounted(loadSettings);
</script>

<style scoped>
/* Add any component-specific styles here */
.card {
  border: none;
}
</style>