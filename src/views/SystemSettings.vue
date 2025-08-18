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
            <form @submit.prevent="saveGeneralSettings">
              <div class="mb-3">
                <label for="siteName" class="form-label">{{ $t('systemSettings.generalSettings.siteName') }}</label>
                <input type="text" class="form-control" id="siteName" v-model="generalSettings.siteName">
              </div>
              <div class="mb-3">
                <label for="siteLogo" class="form-label">{{ $t('systemSettings.generalSettings.siteLogo') }}</label>
                <input type="text" class="form-control" id="siteLogo" v-model="generalSettings.siteLogo">
              </div>
              <div class="mb-3">
                <label for="defaultTheme" class="form-label">{{ $t('systemSettings.generalSettings.defaultTheme') }}</label>
                <select class="form-select" id="defaultTheme" v-model="generalSettings.defaultTheme">
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
            <form @submit.prevent="saveEmailSettings">
              <div class="mb-3">
                <label for="smtpHost" class="form-label">{{ $t('systemSettings.emailSettings.smtpHost') }}</label>
                <input type="text" class="form-control" id="smtpHost" v-model="emailSettings.smtpHost">
              </div>
              <div class="mb-3">
                <label for="smtpPort" class="form-label">{{ $t('systemSettings.emailSettings.smtpPort') }}</label>
                <input type="number" class="form-control" id="smtpPort" v-model="emailSettings.smtpPort">
              </div>
              <div class="mb-3">
                <label for="smtpUser" class="form-label">{{ $t('systemSettings.emailSettings.smtpUser') }}</label>
                <input type="text" class="form-control" id="smtpUser" v-model="emailSettings.smtpUser">
              </div>
              <div class="mb-3">
                <label for="smtpPassword" class="form-label">{{ $t('systemSettings.emailSettings.smtpPassword') }}</label>
                <input type="password" class="form-control" id="smtpPassword" v-model="emailSettings.smtpPassword">
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
            <form @submit.prevent="saveApiKeys">
              <div class="mb-3">
                <label for="googleApiKey" class="form-label">{{ $t('systemSettings.apiKeys.googleMaps') }}</label>
                <input type="text" class="form-control" id="googleApiKey" v-model="apiKeys.googleMaps">
              </div>
              <div class="mb-3">
                <label for="openAiApiKey" class="form-label">{{ $t('systemSettings.apiKeys.openAI') }}</label>
                <input type="text" class="form-control" id="openAiApiKey" v-model="apiKeys.openAI">
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
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/helpers/toast';

const { t } = useI18n();
const { showSuccessToast } = useToast();

const generalSettings = ref({
  siteName: 'FADAA Platform',
  siteLogo: '/logo.png', // Assuming logo is in public folder
  defaultTheme: 'light',
});

const emailSettings = ref({
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUser: 'user@example.com',
  smtpPassword: '',
});

const apiKeys = ref({
  googleMaps: '',
  openAI: '',
});

const saveGeneralSettings = () => {
  // Placeholder for actual save logic
  console.log('General Settings Saved:', generalSettings.value);
  showSuccessToast(t('systemSettings.generalSettings.alert'));
};

const saveEmailSettings = () => {
  // Placeholder for actual save logic
  console.log('Email Settings Saved:', emailSettings.value);
  showSuccessToast(t('systemSettings.emailSettings.alert'));
};

const saveApiKeys = () => {
  // Placeholder for actual save logic
  console.log('API Keys Saved:', apiKeys.value);
  showSuccessToast(t('systemSettings.apiKeys.alert'));
};

</script>

<style scoped>
/* Add any component-specific styles here */
.card {
  border: none;
}
</style>