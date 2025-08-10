const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const fs = require('fs/promises');
const path = require('path');

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
documentApp.post('/', async (c) => {
    try {
        const body = await c.req.parseBody();
        const { client_id, title, type, investment_id, uploaded_by_user_id } = body;
        const documentFile = body['document'];

        if (!client_id || !title || !type || !documentFile || !uploaded_by_user_id) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        // --- File Upload Logic ---
        const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'documents');
        await fs.mkdir(uploadDir, { recursive: true });

        const timestamp = Date.now();
        const fileExtension = path.extname(documentFile.name);
        const newFileName = `document-${client_id}-${timestamp}${fileExtension}`;
        const filePath = path.join(uploadDir, newFileName);
        
        const fileData = await documentFile.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(fileData));

        const documentUrl = `/uploads/documents/${newFileName}`;
        // --- End File Upload Logic ---

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
        console.error('Error creating document:', error);
        return c.json({ success: false, message: 'Failed to create document' }, 500);
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
        console.error('Error updating document:', error);
        return c.json({ success: false, message: 'Failed to update document' }, 500);
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
        // const filePath = path.join(__dirname, '../public', document.file_path);
        // if (fs.existsSync(filePath)) {
        //     fs.unlinkSync(filePath);
        // }

        await document.destroy();
        return c.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        return c.json({ success: false, message: 'Failed to delete document' }, 500);
    }
});

module.exports = documentApp;
