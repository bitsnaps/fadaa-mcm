const { Hono } = require('hono');
const {
    listFiles,
    deleteFile,
    restoreFile,
    permanentDeleteFile,
    emptyTrash,
} = require('../controllers/fileManagerController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const fileManagerApp = new Hono();

fileManagerApp.use('*', authMiddleware, adminMiddleware );

fileManagerApp.get('/', listFiles);
fileManagerApp.delete('/:filePath', deleteFile);

module.exports = fileManagerApp;