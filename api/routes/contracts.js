const { Hono } = require('hono');
const ExcelJS = require('exceljs');
const { jsPDF } = require("jspdf");
const autoTable = require('jspdf-autotable').default; // note .default
const { Op } = require('sequelize');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');
const branchRestriction = require('../middleware/branchRestriction');
const { handleRouteError } = require('../lib/errorHandler');
const { downloadFile } = require('../services/fileService');
const { createNotification } = require('../services/notificationService');
const { getContractDurationInMonths } = require('../lib/dateUtils');

const contractApp = new Hono();

// Helper function to check office availability
async function isOfficeAvailable(office_id, start_date, end_date, profile_id, exclude_contract_id = null) {
    const office = await models.Office.findByPk(office_id);
    if (!office || office.status === 'Maintenance' || office.status === 'Unavailable') {
        return { available: false, message: 'This office is not available for booking.' };
    }

    const where = {
        office_id,
        profile_id,
        status: { [Op.ne]: 'Terminated' },
        [Op.or]: [
            { start_date: { [Op.between]: [start_date, end_date] } },
            { end_date: { [Op.between]: [start_date, end_date] } },
            {
                [Op.and]: [
                    { start_date: { [Op.lte]: start_date } },
                    { end_date: { [Op.gte]: end_date } }
                ]
            }
        ]
    };

    if (exclude_contract_id) {
        where.id = { [Op.ne]: exclude_contract_id };
    }

    const existingContract = await models.Contract.findOne({ where });

    if (existingContract) {
        return { available: false, message: 'This office is already booked for the selected dates.' };
    }

    return { available: true };
}

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

        const contractsWithNetTotal = contracts.map(contract => {
            const contractJSON = contract.toJSON();
            const durationInMonths = getContractDurationInMonths(contract.start_date, contract.end_date);
            const companyTaxRate = contract.taxes.reduce((sum, tax) => {
                if (tax.bearer === 'Company') {
                    return sum + (parseFloat(tax.rate) || 0);
                }
                return sum;
            }, 0);

            const netTotalAmount = parseFloat(contract.monthly_rate) * durationInMonths * (1 - (companyTaxRate / 100));
            contractJSON.net_total_amount = netTotalAmount;
            return contractJSON;
        });

        return c.json({ success: true, contracts: contractsWithNetTotal });
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

    const contractJSON = contract.toJSON();
    const durationInMonths = getContractDurationInMonths(contract.start_date, contract.end_date);
    const companyTaxRate = contract.taxes.reduce((sum, tax) => {
        if (tax.bearer === 'Company') {
            return sum + (parseFloat(tax.rate) || 0);
        }
        return sum;
    }, 0);

    const netTotalAmount = parseFloat(contract.monthly_rate) * durationInMonths * (1 - (companyTaxRate / 100));
    contractJSON.net_total_amount = netTotalAmount;

    return c.json({ success: true, contract: contractJSON });
  } catch (error) {
    return handleRouteError(c, `Error fetching contract ${id}`, error);
  }
});


// POST /api/contracts - Create a new contract with document upload
contractApp.post('/', uploadMiddleware('contracts', 'document'), async (c) => {
    try {
        const body = await c.req.parseBody();
        const { client_id, office_id, start_date, end_date, monthly_rate, profile_id, notes, payment_terms, service_type, area, activity } = body;
        const documentUrl = c.req.filePath;

        // Validate office availability
        const availability = await isOfficeAvailable(office_id, start_date, end_date, profile_id);
        if (!availability.available) {
            return c.json({ errors: { office_id: availability.message } }, 422);
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
            area,
            activity,
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
        const { client_id, office_id, start_date, end_date, monthly_rate, status, notes, payment_terms, service_type, area, activity } = body;

        const contract = await models.Contract.findByPk(id);
        if (!contract) {
            return c.json({ success: false, message: 'Contract not found' }, 404);
        }

        // Validate office availability if dates or office have changed
        if ((start_date && end_date) || office_id !== contract.office_id) {
            const availability = await isOfficeAvailable(office_id, start_date, end_date, contract.profile_id, id);
            if (!availability.available) {
                return c.json({ errors: { office_id: availability.message } }, 422);
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
            area,
            activity,
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
    const user = c.get('user');
    try {
        const contract = await models.Contract.findByPk(id);
        if (!contract) {
            return c.json({ success: false, message: 'Contract not found' }, 404);
        }

        if (user.isAdmin()) {
            await contract.destroy();
            return c.json({ success: true, message: 'Contract deleted successfully' });
        } else {
            const existingRequest = await models.PendingDeletion.findOne({
                where: {
                    entity_type: 'contract',
                    entity_id: id,
                    status: 'pending',
                },
            });

            if (existingRequest) {
                return c.json({ success: false, message: 'A deletion request for this contract already exists.' }, 409);
            }

            await models.PendingDeletion.create({
                requester_id: user.id,
                entity_type: 'contract',
                entity_id: id,
            });
            const admins = await models.User.findAll({
                include: [{
                    model: models.Role,
                    as: 'role',
                    where: { name: 'Admin' },
                    attributes: [],
                }],
            });
            const message = `User ${user.email} has requested to delete contract #${id}.`;

            for (const admin of admins) {
                await createNotification({
                    userId: admin.id,
                    type: 'DeletionRequest',
                    message: message,
                    relatedEntityType: 'contract',
                    relatedEntityId: parseInt(id),
                });
            }
            return c.json({ success: true, message: 'Contract deletion request submitted for admin approval' });
        }
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

contractApp.post('/export', async (c) => {
    try {
        const { format, profile_id, branchId: reqBranchId } = await c.req.json();
        const branchId = c.get('user').isAdmin() ? reqBranchId : (reqBranchId || c.req.branch_id || c.get('user')['branch_id']);

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

        const contracts = await models.Contract.findAll({
            where: whereClause,
            include: includeClause
        });

        const contractsData = contracts.map(contract => ({
            id: contract.id,
            client_name: contract.Client ? contract.Client.company_name : 'N/A',
            office_name: contract.Office ? contract.Office.name : 'N/A',
            status: contract.status,
            service_type: contract.service_type,
            payment_terms: contract.payment_terms,
            start_date: contract.start_date,
            end_date: contract.end_date,
            monthly_rate: contract.monthly_rate,
        }));

        if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Contracts');
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Client', key: 'client_name', width: 30 },
                { header: 'Office', key: 'office_name', width: 20 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Service Type', key: 'service_type', width: 20 },
                { header: 'Payment Terms', key: 'payment_terms', width: 20 },
                { header: 'Start Date', key: 'start_date', width: 20 },
                { header: 'End Date', key: 'end_date', width: 20 },
                { header: 'Monthly Rate', key: 'monthly_rate', width: 15 },
            ];
            worksheet.addRows(contractsData);
            const buffer = await workbook.xlsx.writeBuffer();
            c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return c.body(buffer);
        } else if (format === 'csv') {
            let csv = 'ID,Client,Office,Status,Service Type,Payment Terms,Start Date,End Date,Monthly Rate\n';
            contractsData.forEach(c => {
                csv += `${c.id},"${c.client_name}","${c.office_name}",${c.status},${c.service_type},${c.payment_terms},${c.start_date.toISOString().split('T')[0]},${c.end_date.toISOString().split('T')[0]},${c.monthly_rate}\n`;
            });
            c.header('Content-Type', 'text/csv');
            return c.body(csv);
        } else if (format === 'pdf') {
            const doc = new jsPDF({ orientation: 'landscape' });
            doc.text('Contracts List', 14, 16);
            autoTable(doc, {
                startY: 20,
                head: [['ID', 'Client', 'Office', 'Status', 'Service Type', 'Payment Terms', 'Start Date', 'End Date', 'Monthly Rate']],
                body: contractsData.map(c => [c.id, c.client_name, c.office_name, c.status, c.service_type, c.payment_terms, c.start_date.toISOString().split('T')[0], c.end_date.toISOString().split('T')[0], c.monthly_rate]),
            });
            const pdfBuffer = doc.output('arraybuffer');
            c.header('Content-Type', 'application/pdf');
            return c.body(pdfBuffer);
        }

        return c.json({ success: false, message: 'Unsupported format' }, 400);

    } catch (error) {
        return handleRouteError(c, 'Error exporting contracts', error);
    }
});

module.exports = contractApp;