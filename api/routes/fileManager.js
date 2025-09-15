const { Hono } = require('hono');
const {
    listFiles,
    deleteFile,
    downloadFile,
} = require('../controllers/fileManagerController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const fileManagerApp = new Hono();

fileManagerApp.use('*', authMiddleware, adminMiddleware );

fileManagerApp.get('/', listFiles);
fileManagerApp.get('/download/:filePath', downloadFile);
fileManagerApp.delete('/:filePath', deleteFile);

module.exports = fileManagerApp;