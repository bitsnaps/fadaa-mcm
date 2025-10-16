const { Hono } = require('hono');
const {
    listFiles,
    deleteFile,
    downloadFile,
    previewFile,
    extractRequestedPath
} = require('../controllers/fileManagerController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const fileManagerApp = new Hono();

fileManagerApp.use('*', authMiddleware, adminMiddleware);

fileManagerApp.get('/', listFiles);
fileManagerApp.get('/download', downloadFile);
fileManagerApp.get('/preview', previewFile);
fileManagerApp.delete('/delete', deleteFile);

// GET /api/files/download/documents/* - Download a document
fileManagerApp.get('/download/documents/*', downloadFile);

module.exports = fileManagerApp;