const { Hono } = require('hono');
const profileController = require('../controllers/profileController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const profilesApp = new Hono();

// All profile routes should be protected and accessible only by authorized users (e.g., admins)
profilesApp.use('*', authMiddleware, adminMiddleware);

// --- Global Profile Routes ---

// GET all profiles
profilesApp.get('/', profileController.getAllProfiles);

// POST a new profile
profilesApp.post('/', profileController.createProfile);

// PUT to set a profile as active
profilesApp.put('/:profileId/activate', profileController.setActiveProfile);

// PUT to update a profile's details
profilesApp.put('/:profileId', profileController.updateProfile);

// DELETE a profile
profilesApp.delete('/:profileId', profileController.deleteProfile);

module.exports = profilesApp;