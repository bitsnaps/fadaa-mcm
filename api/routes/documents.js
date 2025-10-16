const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');
const { handleRouteError } = require('../lib/errorHandler');
const { deleteFile } = require('../services/fileService');

const documentApp = new Hono();
documentApp.use('*', authMiddleware);

// GET /api/documents - Get all documents
documentApp.get('/', async (c) => {
    try {
        const documents = await models.Document.findAll({
            include: [
                { model: models.Client, attributes: ['id', 'company_name'] },
                { model: models.Investment, attributes: ['id', 'name'] },
                { model: models.User, as: 'uploaded_by', attributes: ['id', 'first_name', 'last_name'] }
            ]
        });
        return c.json({ success: true, documents });
    } catch (error) {
        console.error('Error fetching documents:', error);
        return c.json({ success: false, message: 'Failed to fetch documents' }, 500);
    }
});

// POST /api/documents - Create a new document with file upload
documentApp.post('/', uploadMiddleware('documents', 'document'), async (c) => {
    try {
        const body = await c.req.parseBody();
        const { client_id, title, type, investment_id, uploaded_by_user_id } = body;
        const documentUrl = c.req.filePath;

        if (!client_id || !title || !type || !documentUrl || !uploaded_by_user_id) {
            return c.json({ success: false, message: 'Missing required fields or file' }, 400);
        }

        const newDocument = await models.Document.create({
            client_id,
            title,
            type,
            investment_id,
            uploaded_by_user_id,
            file_path: documentUrl
        });

        return c.json({ success: true, message: 'Document created successfully', document: newDocument }, 201);

    } catch (error) {
        return handleRouteError(c, 'Error creating document', error);
    }
});

// Update a document
documentApp.put('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const { title, type } = await c.req.json();

        const document = await models.Document.findByPk(id);
        if (!document) {
            return c.json({ success: false, message: 'Document not found' }, 404);
        }

        await document.update({ title, type });

        return c.json({ success: true, message: 'Document updated successfully', data: document });
    } catch (error) {
        return handleRouteError(c, `Error updating document ${c.req.param('id')}`, error);
    }
});

// Delete a document
documentApp.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const document = await models.Document.findByPk(id);
        if (!document) {
            return c.json({ success: false, message: 'Document not found' }, 404);
        }

        // Optional: Delete the file from storage as well
        // deleteFile(document.file_path);

        await document.destroy();
        return c.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting document ${c.req.param('id')}`, error);
    }
});

module.exports = documentApp;
