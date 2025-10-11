const { Hono } = require('hono');
const profileController = require('../controllers/profileController');
const { authMiddleware, assistantMiddleware } = require('../middleware/auth');

const profilesApp = new Hono();

// --- Public Route ---
// GET the globally active profile
profilesApp.get('/active-profile', profileController.getActiveProfile);

// All profile routes should be protected and accessible only by authorized users (e.g., admins)
profilesApp.use('*', authMiddleware, assistantMiddleware);

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