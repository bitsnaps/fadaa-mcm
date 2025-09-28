const { Hono } = require('hono');
const { Op } = require('sequelize');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');
const branchRestriction = require('../middleware/branchRestriction');
const { handleRouteError } = require('../lib/errorHandler');
const { downloadFile } = require('../services/fileService');

const contractApp = new Hono();

contractApp.use('*', authMiddleware);
contractApp.use('/', branchRestriction());

// GET /api/contracts - Get all contracts
contractApp.get('/', async (c) => {
    try {
        const { profile_id, expiring_within_days } = c.req.query();
        const branchId = c.get('user').isAdmin()?null:(c.req.query('branchId') || c.req.branch_id || c.get('user')['branch_id']);
        let whereClause = {};
        let includeClause = [
            { model: models.Client, attributes: ['id', 'company_name'] },
            { model: models.Profile },
            { model: models.Office, attributes: ['id', 'name'] },
            { model: models.Tax, as: 'taxes' }
        ];

        if (branchId) {
            includeClause.push({
                model: models.Office,
                where: { branch_id: branchId },
                required: true
            });
        }

        if (profile_id) {
            whereClause.profile_id = profile_id;
        }

        if (expiring_within_days) {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + parseInt(expiring_within_days, 10));
            whereClause.end_date = {
                [Op.between]: [now, futureDate]
            };
        }

        const contracts = await models.Contract.findAll({
            where: whereClause,
            include: includeClause
        });
        return c.json({ success: true, contracts });
    } catch (error) {
        console.error('Error fetching contracts:', error);
        return c.json({ success: false, message: 'Failed to fetch contracts' }, 500);
    }
});
// GET /api/contracts/:id - Get one contract
contractApp.get('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    const contract = await models.Contract.findByPk(id, {
      include: [
        { model: models.Client, attributes: ['id', 'company_name'] },
        { model: models.Profile },
        { model: models.Office, attributes: ['id', 'name'] },
        { model: models.Tax, as: 'taxes' }
      ]
    });
    if (!contract) return c.json({ success: false, message: 'Contract not found' }, 404);
    return c.json({ success: true, contract });
  } catch (error) {
    return handleRouteError(c, `Error fetching contract ${id}`, error);
  }
});


// POST /api/contracts - Create a new contract with document upload
contractApp.post('/', uploadMiddleware('contracts', 'document'), async (c) => {
    try {
        const body = await c.req.parseBody();
        const { client_id, office_id, start_date, end_date, monthly_rate, profile_id, notes, payment_terms, service_type } = body;
        const documentUrl = c.req.filePath;

        const office = await models.Office.findByPk(office_id);
        if (!office || office.status == 'Maintenance' || office.status == 'Unavailable') {
            return c.json({ errors: { office_id: 'This office is not available for booking.' } }, 422);
        }

        const existingContract = await models.Contract.findOne({
            where: {
                office_id,
                profile_id,
                status: { [Op.ne]: 'Terminated' },
                [Op.or]: [
                    {
                        start_date: {
                            [Op.between]: [start_date, end_date]
                        }
                    },
                    {
                        end_date: {
                            [Op.between]: [start_date, end_date]
                        }
                    },
                    {
                        [Op.and]: [
                            { start_date: { [Op.lte]: start_date } },
                            { end_date: { [Op.gte]: end_date } }
                        ]
                    }
                ]
            }
        });

        if (existingContract) {
            return c.json({ errors: { office_id: 'This office is already booked for the selected dates.' } }, 422);
        }

        const newContract = await models.Contract.create({
            client_id,
            office_id,
            profile_id,
            start_date,
            end_date,
            monthly_rate,
            status: 'Active', // Or 'Pending' if an approval process is needed
            document_url: documentUrl,
            notes,
            payment_terms,
            service_type,
        });

        // Support both 'tax_ids' and 'tax_ids[]' from multipart form data
        const rawTaxIds = body['tax_ids'] ?? body['tax_ids[]'];
        if (rawTaxIds !== undefined) {
            const taxIdArray = Array.isArray(rawTaxIds) ? rawTaxIds : (rawTaxIds ? [rawTaxIds] : []);
            const parsedIds = taxIdArray
              .filter(v => v !== '' && v !== null && v !== undefined)
              .map(id => parseInt(id, 10))
              .filter(n => !Number.isNaN(n));
            if (parsedIds.length > 0) {
              const taxes = await models.Tax.findAll({ where: { id: parsedIds } });
              await newContract.setTaxes(taxes);
            }
        }

        // Optionally, update the office status
        await models.Office.update({ status: 'Occupied' }, { where: { id: office_id } });

        return c.json({ success: true, message: 'Contract created successfully', contract: newContract }, 201);

    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
        return handleRouteError(c, 'Error creating contract', error);
    }
});

// PUT /api/contracts/:id - Update a contract
contractApp.put('/:id', uploadMiddleware('contracts', 'document'), async (c) => {
    const { id } = c.req.param();
    try {
        const body = await c.req.parseBody();
        const { client_id, office_id, start_date, end_date, monthly_rate, status, notes, payment_terms, service_type } = body;

        const contract = await models.Contract.findByPk(id);
        if (!contract) {
            return c.json({ success: false, message: 'Contract not found' }, 404);
        }

        if (start_date && end_date) {
            const targetOfficeId = office_id || contract.office_id;
            const office = await models.Office.findByPk(targetOfficeId);
            if (office && office.status !== 'Maintenance' && office.status !== 'Unavailable' && office.id !== contract.office_id) {
                return c.json({ errors: { office_id: 'This office is not available for booking.' } }, 422);
            }

            const existingContract = await models.Contract.findOne({
                where: {
                    id: { [Op.ne]: id },
                    office_id: targetOfficeId,
                    profile_id: contract.profile_id,
                    status: { [Op.ne]: 'Terminated' },
                    [Op.or]: [
                        {
                            start_date: {
                                [Op.between]: [start_date, end_date]
                            }
                        },
                        {
                            end_date: {
                                [Op.between]: [start_date, end_date]
                            }
                        },
                        {
                            [Op.and]: [
                                { start_date: { [Op.lte]: start_date } },
                                { end_date: { [Op.gte]: end_date } }
                            ]
                        }
                    ]
                }
            });

            if (existingContract) {
                return c.json({ errors: { office_id: 'This office is already booked for the selected dates.' } }, 422);
            }
        }

        const documentUrl = c.req.filePath || contract.document_url;

        await contract.update({
            client_id,
            office_id,
            start_date,
            end_date,
            monthly_rate,
            status,
            document_url: documentUrl,
            notes,
            payment_terms,
            service_type,
        });

        // Support both 'tax_ids' and 'tax_ids[]' from multipart form data.
        // Only update taxes if the parameter is present; don't clear implicitly.
        const hasTaxIdsParam = Object.prototype.hasOwnProperty.call(body, 'tax_ids') || Object.prototype.hasOwnProperty.call(body, 'tax_ids[]');
        if (hasTaxIdsParam) {
            const rawTaxIds = body['tax_ids'] ?? body['tax_ids[]'];
            const taxIdArray = Array.isArray(rawTaxIds) ? rawTaxIds : (rawTaxIds ? [rawTaxIds] : []);
            const parsedIds = taxIdArray
              .filter(v => v !== '' && v !== null && v !== undefined)
              .map(id => parseInt(id, 10))
              .filter(n => !Number.isNaN(n));
            const taxes = parsedIds.length > 0 ? await models.Tax.findAll({ where: { id: parsedIds } }) : [];
            await contract.setTaxes(taxes);
        }

        if (body.original_office_id && office_id !== body.original_office_id) {
            await models.Office.update({ status: 'Available' }, { where: { id: body.original_office_id } });
            await models.Office.update({ status: 'Occupied' }, { where: { id: office_id } });
        }

        return c.json({ success: true, message: 'Contract updated successfully', contract });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
        return handleRouteError(c, `Error updating contract ${id}`, error);
    }
});

// PUT /api/contracts/:id - Update a contract's status
contractApp.put('/:id/status', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const { status } = await c.req.json();

        if (!status) {
            return c.json({ success: false, message: 'Status is required' }, 400);
        }

        const contract = await models.Contract.findByPk(id);
        if (!contract) {
            return c.json({ success: false, message: 'Contract not found' }, 404);
        }

        await contract.update({ status });

        if (status === 'Terminated' || status === 'Expired') {
            await models.Office.update({ status: 'Available' }, { where: { id: contract.office_id } });
        }

        return c.json({ success: true, message: 'Contract status updated successfully', contract });
    } catch (error) {
        return handleRouteError(c, `Error updating contract ${id} status`, error);
    }
});


// DELETE /api/contracts/:id - Delete a contract
contractApp.delete('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const contract = await models.Contract.findByPk(id);
        if (!contract) {
            return c.json({ success: false, message: 'Contract not found' }, 404);
        }

        await contract.destroy();

        return c.json({ success: true, message: 'Contract deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting contract ${id}`, error);
    }
});

// POST /api/contracts/:id/document - Upload a document for an existing contract
contractApp.post('/:id/document', uploadMiddleware('contracts', 'document'), async (c) => {
    try {
        const { id } = c.req.param();
        const documentUrl = c.req.filePath;

        const contract = await models.Contract.findByPk(id);
        if (!contract) {
            return c.json({ success: false, message: 'Contract not found' }, 404);
        }

        if (!documentUrl) {
            return c.json({ success: false, message: 'Document file is required' }, 400);
        }

        await contract.update({ document_url: documentUrl });

        return c.json({ success: true, message: 'Document uploaded successfully', contract });
    } catch (error) {
        console.error(`Error uploading document for contract ${c.req.param('id')}:`, error);
        return c.json({ success: false, message: 'Failed to upload document' }, 500);
    }
});


// GET /api/contracts/download/* - Download a contract document
contractApp.get('/download/*', async (c) => {
    const filePath = c.req.path.replace('/api/contracts/download/uploads/', '');
    return downloadFile(c, filePath);
});

module.exports = contractApp;