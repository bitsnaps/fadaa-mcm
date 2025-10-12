import ApiClient from './ApiClient';
import { useAuthStore } from '@/stores/auth';

export default {
  getAllProfiles() {
    const authStore = useAuthStore();
    const userRole = authStore.userRole;

    if (userRole === 'admin') {
      return ApiClient.get('/profiles');
    }
    
    return ApiClient.get('/profiles/active');
  },
  getActiveProfile() {
    return ApiClient.get('/profiles/active?single=true');
  },
  createProfile(profileData) {
    return ApiClient.post('/profiles', profileData);
  },
  setActiveProfile(profileId) {
    return ApiClient.put(`/profiles/${profileId}/activate`);
  },
  updateProfile(profileId, profileData) {
    return ApiClient.put(`/profiles/${profileId}`, profileData);
  },
  deleteProfile(profileId) {
    return ApiClient.delete(`/profiles/${profileId}`);
  }
};