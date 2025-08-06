<template>
  <BTabs v-if="profiles.length > 0" v-model="activeTab" @update:model-value="onTabChange" nav-class="mb-3" :key="componentKey">
    <BTab v-for="profile in profiles" :key="profile.id" :title="profile.name" :lazy="true">
      <!-- The content will be rendered by the parent component inside a slot -->
      <slot :profile-id="profile.id"></slot>
    </BTab>
  </BTabs>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue';
import { BTabs, BTab } from 'bootstrap-vue-next';
import profileService from '@/services/profileService';

const emit = defineEmits(['update:activeProfile']);

const profiles = ref([]);
const activeTab = ref(0); // Index of the active tab
const componentKey = ref(0); // Key to force re-render

onMounted(async () => {
  await fetchProfiles();
});

async function fetchProfiles() {
  try {
    const response = await profileService.getAllProfiles();
    profiles.value = response.data;
    
    // Find the index of the active profile to set the default tab
    const activeProfileIndex = profiles.value.findIndex(p => p.is_active);
    if (activeProfileIndex !== -1) {
      activeTab.value = activeProfileIndex;
    }
    
    // Emit the initial active profile ID
    if (profiles.value.length > 0) {
      emit('update:activeProfile', profiles.value[activeTab.value].id);
    }
    
    // Force re-render of the BTabs component
    componentKey.value++;

  } catch (error) {
    console.error('Error fetching profiles:', error);
  }
}

function onTabChange(newTabIndex) {
  if (profiles.value[newTabIndex]) {
    emit('update:activeProfile', profiles.value[newTabIndex].id);
  }
}
</script>