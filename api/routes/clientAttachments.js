const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const { handleRouteError } = require('../lib/errorHandler');

const clientAttachmentsApp = new Hono();
clientAttachmentsApp.use('*', authMiddleware);

// GET /api/client-attachments/:clientId - Get all attachments for a client
clientAttachmentsApp.get('/:clientId', async (c) => {
    try {
        const { clientId } = c.req.param();
        const attachments = await models.ClientAttachment.findAll({
            where: { client_id: clientId },
            include: [
                { model: models.User, as: 'uploaded_by', attributes: ['id', 'first_name', 'last_name'] }
            ]
        });
        return c.json({ success: true, data: attachments });
    } catch (error) {
        return handleRouteError(c, `Error fetching client attachments for client ${c.req.param('clientId')}`, error);
    }
});

// POST /api/client-attachments/:clientId - Upload attachments for a client
clientAttachmentsApp.post('/:clientId', uploadMiddleware('attachments', 'attachments'), async (c) => {
    try {
        const { clientId } = c.req.param();
        const body = await c.req.parseBody({ all: true });
        const { uploaded_by_user_id } = body;
        const files = body['attachments'];

        if (!files || files.length === 0) {
            return c.json({ success: false, message: 'No files uploaded' }, 400);
        }
        
        const attachments = Array.isArray(files) ? files : [files];
        const attachmentRecords = [];

        for (const file of attachments) {
            if (file instanceof Blob && file.name) {
                const fileArrayBuffer = await file.arrayBuffer();
                const fileBuffer = Buffer.from(fileArrayBuffer);
                const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
                
                const uploadDir = path.join(process.env.UPLOAD_DIR, 'attachments');
                 if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const filePath = path.join(uploadDir, fileName);
                
                await fs.promises.writeFile(filePath, fileBuffer);
                const attachmentRecord = await models.ClientAttachment.create({
                    client_id: clientId,
                    file_path: `/uploads/attachments/${fileName}`,
                    file_name: file.name,
                    uploaded_by_user_id,
                });
                attachmentRecords.push(attachmentRecord);
            }
        }

        return c.json({ success: true, message: 'Attachments uploaded successfully', data: attachmentRecords }, 201);

    } catch (error) {
        return handleRouteError(c, `Error uploading client attachments for client ${c.req.param('clientId')}`, error);
    }
});

module.exports = clientAttachmentsApp;