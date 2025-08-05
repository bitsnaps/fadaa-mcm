import ApiClient from './ApiClient';

export default {
  getAllProfiles() {
    return ApiClient.get('/profiles');
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