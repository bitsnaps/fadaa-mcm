const { Hono } = require('hono');
const { getSettings, updateSettings } = require('../controllers/systemSettingController');
const { authMiddleware, adminMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const settingsApp = new Hono();

settingsApp.get('/', optionalAuthMiddleware, getSettings);
settingsApp.put('/', authMiddleware, adminMiddleware, updateSettings);

module.exports = settingsApp;