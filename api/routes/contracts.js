const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const fs = require('fs/promises');
const path = require('path');

const contractApp = new Hono();
contractApp.use('*', authMiddleware);

// GET /api/contracts - Get all contracts
contractApp.get('/', async (c) => {
    try {
        const contracts = await models.Contract.findAll({
            include: [
                { model: models.Client, attributes: ['id', 'company_name'] },
                { model: models.Office, attributes: ['id', 'name'] }
            ]
        });
        return c.json({ success: true, contracts });
    } catch (error) {
        console.error('Error fetching contracts:', error);
        return c.json({ success: false, message: 'Failed to fetch contracts' }, 500);
    }
});

// POST /api/contracts - Create a new contract with document upload
contractApp.post('/', async (c) => {
    try {
        const body = await c.req.parseBody();
        const { client_id, office_id, start_date, end_date, monthly_rate } = body;
        const documentFile = body['document'];

        if (!client_id || !office_id || !start_date || !end_date || !monthly_rate || !documentFile) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        // --- File Upload Logic ---
        const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'contracts');
        await fs.mkdir(uploadDir, { recursive: true });

        const timestamp = Date.now();
        const fileExtension = path.extname(documentFile.name);
        const newFileName = `contract-${client_id}-${timestamp}${fileExtension}`;
        const filePath = path.join(uploadDir, newFileName);
        
        const fileData = await documentFile.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(fileData));

        const documentUrl = `/uploads/contracts/${newFileName}`;
        // --- End File Upload Logic ---

        const newContract = await models.Contract.create({
            client_id,
            office_id,
            start_date,
            end_date,
            monthly_rate,
            status: 'Active', // Or 'Pending' if an approval process is needed
            document_url: documentUrl
        });

        // Optionally, update the office status
        await models.Office.update({ status: 'Occupied' }, { where: { id: office_id } });

        return c.json({ success: true, message: 'Contract created successfully', contract: newContract }, 201);

    } catch (error) {
        console.error('Error creating contract:', error);
        return c.json({ success: false, message: 'Failed to create contract' }, 500);
    }
});

module.exports = contractApp;