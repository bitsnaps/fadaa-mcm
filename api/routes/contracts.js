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
                { model: models.Office, attributes: ['id', 'name'] },
                { model: models.Tax, as: 'taxes' }
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
        const { client_id, office_id, start_date, end_date, monthly_rate, tax_ids } = body;
        const documentFile = body['document'];

        if (!client_id || !office_id || !start_date || !end_date || !monthly_rate) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        let documentUrl = null;
        // --- File Upload Logic ---
        if (documentFile && documentFile.name) {
            const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'contracts');
            await fs.mkdir(uploadDir, { recursive: true });

            const timestamp = Date.now();
            const fileExtension = path.extname(documentFile.name);
            const newFileName = `contract-${client_id}-${timestamp}${fileExtension}`;
            const filePath = path.join(uploadDir, newFileName);
            
            const fileData = await documentFile.arrayBuffer();
            await fs.writeFile(filePath, Buffer.from(fileData));

            documentUrl = `/uploads/contracts/${newFileName}`;
        }
        // --- End File Upload Logic ---

        const newContract = await models.Contract.create({
            client_id,
            office_id,
            start_date,
            end_date,
            monthly_rate,
            status: 'Active', // Or 'Pending' if an approval process is needed
            document_url: documentUrl,
        });

        if (tax_ids) {
            const taxIdArray = Array.isArray(tax_ids) ? tax_ids : [tax_ids];
            if (taxIdArray.length > 0) {
              const taxes = await models.Tax.findAll({ where: { id: taxIdArray } });
              await newContract.setTaxes(taxes);
            }
        }

        // Optionally, update the office status
        await models.Office.update({ status: 'Occupied' }, { where: { id: office_id } });

        return c.json({ success: true, message: 'Contract created successfully', contract: newContract }, 201);

    } catch (error) {
        console.error('Error creating contract:', error);
        return c.json({ success: false, message: 'Failed to create contract' }, 500);
    }
});

// PUT /api/contracts/:id - Update a contract's status
contractApp.put('/:id/status', authMiddleware, async (c) => {
    try {
        const { id } = c.req.param();
        const { status } = await c.req.json();

        if (!status) {
            return c.json({ success: false, message: 'Status is required' }, 400);
        }

        const contract = await models.Contract.findByPk(id);
        if (!contract) {
            return c.json({ success: false, message: 'Contract not found' }, 404);
        }

        await contract.update({ status });

        // If contract is terminated, maybe change office status back to 'Available'
        if (status === 'Terminated' || status === 'Expired') {
            await models.Office.update({ status: 'Available' }, { where: { id: contract.office_id } });
        }

        return c.json({ success: true, message: 'Contract status updated successfully', contract });
    } catch (error) {
        console.error(`Error updating contract ${id} status:`, error);
        return c.json({ success: false, message: 'Failed to update contract status' }, 500);
    }
});


// DELETE /api/contracts/:id - Delete a contract
contractApp.delete('/:id', authMiddleware, async (c) => {
    try {
        const { id } = c.req.param();
        const contract = await models.Contract.findByPk(id);
        if (!contract) {
            return c.json({ success: false, message: 'Contract not found' }, 404);
        }

        // Optionally, handle related cleanup, like setting office to 'Available'
        // For now, we just delete the contract
        await contract.destroy();
        
// POST /api/contracts/:id/document - Upload a document for an existing contract
contractApp.post('/:id/document', async (c) => {
    try {
        const { id } = c.req.param();
        const body = await c.req.parseBody();
        const documentFile = body['document'];

        const contract = await models.Contract.findByPk(id);
        if (!contract) {
            return c.json({ success: false, message: 'Contract not found' }, 404);
        }

        if (!documentFile || !documentFile.name) {
            return c.json({ success: false, message: 'Document file is required' }, 400);
        }

        // --- File Upload Logic ---
        const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'contracts');
        await fs.mkdir(uploadDir, { recursive: true });

        const timestamp = Date.now();
        const fileExtension = path.extname(documentFile.name);
        const newFileName = `contract-${contract.client_id}-${timestamp}${fileExtension}`;
        const filePath = path.join(uploadDir, newFileName);
        
        const fileData = await documentFile.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(fileData));

        const documentUrl = `/uploads/contracts/${newFileName}`;
        // --- End File Upload Logic ---

        await contract.update({ document_url: documentUrl });

        return c.json({ success: true, message: 'Document uploaded successfully', contract });
    } catch (error) {
        console.error(`Error uploading document for contract ${c.req.param('id')}:`, error);
        return c.json({ success: false, message: 'Failed to upload document' }, 500);
    }
});
        return c.json({ success: true, message: 'Contract deleted successfully' });
    } catch (error) {
        console.error(`Error deleting contract ${id}:`, error);
        return c.json({ success: false, message: 'Failed to delete contract' }, 500);
    }
});


module.exports = contractApp;