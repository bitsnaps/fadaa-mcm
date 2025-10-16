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

fileManagerApp.use('*', authMiddleware, adminMiddleware );

fileManagerApp.get('/', listFiles);
// Update routes to use wildcard to capture full file paths in production proxies
fileManagerApp.get('/download/*', downloadFile);

// GET /api/files/download/documents/* - Download a document
fileManagerApp.get('/download/documents/*', downloadFile);

fileManagerApp.get('/preview/*', previewFile);
fileManagerApp.delete('/:filePath', deleteFile);

module.exports = fileManagerApp;