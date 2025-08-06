<template>
  <BTabs v-if="profiles.length > 0" @update:model-value="onTabChange" nav-class="mb-3">
    <BTab v-for="profile in profiles" 
          :key="profile.id" 
          :title="profile.name"
          :active="profile.id === localActiveProfileId" 
          :lazy="true">
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
const localActiveProfileId = ref(null); // This will hold the ID of the active tab

onMounted(async () => {
  await fetchProfiles();
});

async function fetchProfiles() {
  try {
    const response = await profileService.getAllProfiles();
    profiles.value = response.data;
    
    const activeProfile = profiles.value.find(p => p.is_active);
    if (activeProfile) {
      localActiveProfileId.value = activeProfile.id;
    } else if (profiles.value.length > 0) {
      // Fallback to the first profile if none are active
      localActiveProfileId.value = profiles.value[0].id;
    }
    
    // Emit the initial active profile ID
    if (localActiveProfileId.value !== null) {
      emit('update:activeProfile', localActiveProfileId.value);
    }
  } catch (error) {
    console.error('Error fetching profiles:', error);
  }
}

function onTabChange(newTabIndex) {
  const newProfile = profiles.value[newTabIndex];
  if (newProfile) {
    localActiveProfileId.value = newProfile.id; // Update local state for immediate visual feedback
    emit('update:activeProfile', newProfile.id); // Inform parent
  }
}
</script>