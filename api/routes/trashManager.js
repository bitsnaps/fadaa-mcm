const { Hono } = require('hono');
const {
    listTrash,
    permanentDeleteFile,
    emptyTrash,
} = require('../controllers/trashManagerController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const trashManagerApp = new Hono();

trashManagerApp.use('*', authMiddleware, adminMiddleware, async (c, next) => {
    await next();
});

trashManagerApp.get('/', listTrash);
trashManagerApp.delete('/:filePath', permanentDeleteFile);
trashManagerApp.post('/empty', emptyTrash);

module.exports = trashManagerApp;