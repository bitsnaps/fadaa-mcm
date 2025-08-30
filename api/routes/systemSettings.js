const { Hono } = require('hono');
const { getSettings, updateSettings } = require('../controllers/systemSettingController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const settingsApp = new Hono();

settingsApp.get('/', authMiddleware, getSettings);
settingsApp.put('/', authMiddleware, adminMiddleware, updateSettings);

module.exports = settingsApp;