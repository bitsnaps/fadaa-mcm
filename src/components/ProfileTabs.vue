<template>
  <BTabs v-if="profiles.length > 0" @update:model-value="onTabChange" nav-class="mb-3">
    <BTab v-for="profile in profiles"
          :key="profile.id"
          :id="`profile-${profile.id}`"
          :title="profile.name"
          :active="profile.id === localActiveProfileId"
          :lazy="true">
      <!-- The content will be rendered by the parent component inside a slot -->
      <slot :profileId="profile.id"></slot>
    </BTab>
  </BTabs>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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

function onTabChange(newActive) {
  // Normalize payload: could be a numeric index or a tab pane id string
  const payload = String(newActive);
  let newProfile = null;

  // Case 1: numeric index payload
  const idx = Number(payload);
  if (!Number.isNaN(idx) && profiles.value[idx]) {
    newProfile = profiles.value[idx];
  } else {
    // Case 2: explicit BTab id we set, e.g., "profile-123"
    const m1 = payload.match(/profile-(\d+)/);
    if (m1) {
      const pid = Number(m1[1]);
      newProfile = profiles.value.find(p => p.id === pid) || null;
    } else {
      // Fallback: try to extract a number and match by id
      const m2 = payload.match(/(\d+)/);
      if (m2) {
        const pid2 = Number(m2[1]);
        newProfile = profiles.value.find(p => p.id === pid2) || null;
      }
    }
  }

  if (newProfile) {
    localActiveProfileId.value = newProfile.id; // Update local state for immediate visual feedback
    emit('update:activeProfile', newProfile.id); // Inform parent
  } else {
    console.warn('Tabs onTabChange: could not resolve profile from payload', newActive);
  }
}
</script>