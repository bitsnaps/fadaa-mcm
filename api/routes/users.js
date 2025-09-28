const { Hono } = require('hono');
const { authMiddleware } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');
const userController = require('../controllers/userController');

const userApp = new Hono();

// Get all users
userApp.get('/', authMiddleware, userController.getAllUsers);

// Get users by role
userApp.get('/role/:roleName', authMiddleware, userController.getUsersByRole);

// Get a single user by ID
userApp.get('/:id', authMiddleware, userController.getUserById);

// Create a new user
userApp.post('/', authMiddleware, userController.createUser);

// Update a user
userApp.put('/:id', authMiddleware, userController.updateUser);

// Update user profile
userApp.put('/profile/:id', authMiddleware, userController.updateUserProfile);

// Change password
userApp.post('/change-password/:id', authMiddleware, userController.changePassword);

// Reset password
userApp.post('/reset-password/:id', authMiddleware, userController.resetPassword);

// Update user preferences
userApp.put('/preferences/:id', authMiddleware, userController.updateUserPreferences);

// Upload profile picture
userApp.post('/profile-picture/:id', authMiddleware, uploadMiddleware('avatars', 'profile_picture'), userController.updateProfilePicture);

// Delete a user
userApp.delete('/:id', authMiddleware, userController.deleteUser);

// Get available roles
userApp.get('/data/roles', authMiddleware, userController.getRoles);

// Get available branches
userApp.get('/data/branches', authMiddleware, userController.getBranches);

module.exports = userApp;