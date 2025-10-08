const { Hono } = require('hono');
const ExcelJS = require('exceljs');
const { jsPDF } = require("jspdf");
const autoTable = require('jspdf-autotable').default; // note .default
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');
const branchRestriction = require('../middleware/branchRestriction');
const { createNotification } = require('../services/notificationService');
const { Op } = require('sequelize');
const { handleRouteError } = require('../lib/errorHandler');

const clientsApp = new Hono();

clientsApp.use('*', authMiddleware, branchRestriction());

// GET total number of clients
clientsApp.get('/total', async (c) => {
    try {
      const count = await models.Client.count();
      return c.json({ success: true, data: count });
    } catch (error) {
      console.error('Error fetching total clients:', error);
      return c.json({ success: false, message: 'Failed to fetch total clients' }, 500);
    }
});

// GET all clients
clientsApp.get('/', async (c) => {
    try {
        const { profile_id, client_id, q, page = 1, pageSize = 20 } = c.req.query();
        const branchId = c.get('user').isAdmin() ? null : (c.req.query('branchId') || c.req.branch_id || c.get('user')['branch_id']);

        let where = {};
        let findOptions = {
            attributes: [
                'id', 'company_name', 'first_name', 'last_name', 'email',
                'phone_number', 'address', 'status', 'created_at'
            ],
            include: [
                {
                    model: models.Contract,
                    attributes: [],
                    required: false
                },
                {
                    model: models.ClientService,
                    attributes: ['price', 'taxId'],
                    required: false,
                    include: [{ model: models.Tax, attributes: ['rate', 'bearer'], required: false }]
                }
            ],
            order: [['company_name', 'ASC']],
            subQuery: false,
            distinct: true
        };

        if (q) {
            where.company_name = { [Op.like]: `%${q}%` };
        }

        if (client_id) {
            where.id = client_id;
        }
        
        if (profile_id) {
            findOptions.include[0].where = { profile_id: profile_id };
            findOptions.include[1].where = { profile_id: profile_id };
        }

        if (branchId) {
            findOptions.include.push({
                model: models.Contract,
                required: false,
                attributes: [],
                include: [{ model: models.Office, required: false, attributes: [] }]
            });
            where[Op.or] = [
                { '$Contracts.id$': null },
                { '$Contracts.Office.branch_id$': branchId }
            ];
        }

        findOptions.where = where;

        if (c.req.url.includes('page')) {
            const limit = parseInt(pageSize, 10);
            const offset = (parseInt(page, 10) - 1) * limit;
            findOptions.limit = limit;
            findOptions.offset = offset;

            const { count, rows } = await models.Client.findAndCountAll(findOptions);
            return c.json({ success: true, items: rows, total: count });
        } else {
            const clients = await models.Client.findAll(findOptions);
            const clientsWithStats = clients.map(client => {
                const clientData = client.toJSON();
                const services = client.ClientServices || [];
                clientData.total_services = services.length;
                let totalAmountWithTaxes = 0;
                let totalAmountWithoutTaxes = 0;
                services.forEach(service => {
                    const servicePrice = parseFloat(service.price) || 0;
                    totalAmountWithoutTaxes += servicePrice;
                    let serviceAmountWithTax = servicePrice;
                    if (service.Tax && service.Tax.rate) {
                        const taxRate = parseFloat(service.Tax.rate) || 0;
                        const taxAmount = servicePrice * (taxRate / 100);
                        if (service.Tax.bearer === 'Company') {
                            serviceAmountWithTax += taxAmount;
                        }
                    }
                    totalAmountWithTaxes += serviceAmountWithTax;
                });
                clientData.total_amount_with_taxes = totalAmountWithTaxes;
                clientData.total_amount_without_taxes = totalAmountWithoutTaxes;
                delete clientData.ClientServices;
                return clientData;
            });
            return c.json({ success: true, data: clientsWithStats });
        }

    } catch (error) {
        console.error('Error fetching clients:', error);
        return c.json({ success: false, message: 'Failed to fetch clients' }, 500);
    }
});
// GET investments for a specific client
clientsApp.get('/:id/investments', async (c) => {
    const { id } = c.req.param();
    try {
        const client = await models.Client.findByPk(id, {
            include: [{
                model: models.Contract,
                include: [{
                    model: models.Profile,
                    include: [models.Investment]
                }]
            }]
        });

        if (!client) {
            return c.json({ success: false, message: 'Client not found' }, 404);
        }

        let investments = [];
        if (client.Contracts) {
            client.Contracts.forEach(contract => {
                if (contract.Profile && contract.Profile.Investments) {
                    investments = investments.concat(contract.Profile.Investments);
                }
            });
        }

        // Remove duplicates
        const uniqueInvestments = investments.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

        return c.json({ success: true, data: uniqueInvestments });
    } catch (error) {
        return handleRouteError(c, `Error fetching investments for client ${id}`, error);
    }
});

// GET a single client by ID
clientsApp.get('/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const client = await models.Client.findByPk(id);
        if (!client) {
            return c.json({ success: false, message: 'Client not found' }, 404);
        }
        return c.json({ success: true, data: client });
    } catch (error) {
        return handleRouteError(c, `Error fetching client ${id}`, error);
    }
});

// POST a new client
clientsApp.post('/', uploadMiddleware('attachments', 'attachments'), async (c) => {
    const clientData = await c.req.parseBody();
    try {

        const newClient = await models.Client.create({email: clientData.email || null, ...clientData});
        return c.json({ success: true, message: 'Client created successfully', data: newClient }, 201);
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
        return handleRouteError(c, 'Error creating client', error);
    }
});

// PUT (update) a client
clientsApp.put('/:id', uploadMiddleware('attachments', 'attachments'), async (c) => {
    const { id } = c.req.param();
    try {
        const clientData = await c.req.parseBody();

        const client = await models.Client.findByPk(id);
        if (!client) {
            return c.json({ success: false, message: 'Client not found' }, 404);
        }

        if (clientData.managed_by_user_id === 'null' || clientData.managed_by_user_id === '') {
            clientData.managed_by_user_id = null;
        }
        if (clientData.id_expiry_date === 'null' || clientData.id_expiry_date === '') {
            clientData.id_expiry_date = null;
        }

        await client.update(clientData);
        return c.json({ success: true, message: 'Client updated successfully', data: client });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
        return handleRouteError(c, `Error updating client ${id}`, error);
    }
});

// DELETE a client
clientsApp.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const user = c.get('user');

    try {
        const client = await models.Client.findByPk(id);
        if (!client) {
            return c.json({ success: false, message: 'Client not found' }, 404);
        }

        if (user.isAdmin()) {
            const deletedClientName = client.company_name || `${client.first_name} ${client.last_name}`;
            await client.destroy();

            // Notify admins about the client deletion
            const admins = await models.User.findAll({
                include: [{
                    model: models.Role,
                    as: 'role',
                    where: { name: 'Admin' },
                    attributes: [],
                }],
            });
            const message = `Client ${deletedClientName} has been deleted by ${user.email}.`;

            for (const admin of admins) {
                await createNotification({
                    userId: admin.id,
                    type: 'ClientDeletion',
                    message: message,
                    relatedEntityType: 'client',
                    relatedEntityId: parseInt(id),
                });
            }

            return c.json({ success: true, message: 'Client deleted successfully' });
        } else {
            const existingRequest = await models.PendingDeletion.findOne({
                where: {
                    entity_type: 'client',
                    entity_id: id,
                    status: 'pending',
                },
            });

            if (existingRequest) {
                return c.json({ success: false, message: 'A deletion request for this client already exists.' }, 409);
            }

            await models.PendingDeletion.create({
                requester_id: user.id,
                entity_type: 'client',
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
            const message = `User ${user.email} has requested to delete client ${client.company_name || `${client.first_name} ${client.last_name}`}.`;

            for (const admin of admins) {
                await createNotification({
                    userId: admin.id,
                    type: 'DeletionRequest',
                    message: message,
                    relatedEntityType: 'client',
                    relatedEntityId: parseInt(id),
                });
            }

            return c.json({ success: true, message: 'Client deletion request submitted for admin approval' });
        }
    } catch (error) {
        return handleRouteError(c, `Error deleting client ${id}`, error);
    }
});

clientsApp.post('/export', async (c) => {
    try {
        const { format, q, branchId: reqBranchId } = await c.req.json();
        const branchId = c.get('user').isAdmin() ? reqBranchId : (reqBranchId || c.req.branch_id || c.get('user')['branch_id']);

        let where = {};
        if (q) {
            where.company_name = { [Op.like]: `%${q}%` };
        }

        let findOptions = {
            where,
            order: [['company_name', 'ASC']],
            include: [],
        };

        if (branchId) {
            findOptions.include.push({
                model: models.Contract,
                required: false,
                attributes: [],
                include: [{
                    model: models.Office,
                    required: true,
                    attributes: [],
                    where: { branch_id: branchId }
                }]
            });
        }

        const clients = await models.Client.findAll(findOptions);

        const clientsData = clients.map(client => ({
            id: client.id,
            company_name: client.company_name,
            email: client.email,
            phone_number: client.phone_number,
            status: client.status,
            created_at: client.created_at,
        }));

        if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Clients');
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Company Name', key: 'company_name', width: 30 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Phone', key: 'phone_number', width: 20 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Registration Date', key: 'created_at', width: 20 },
            ];
            worksheet.addRows(clientsData);
            const buffer = await workbook.xlsx.writeBuffer();
            c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return c.body(buffer);
        } else if (format === 'csv') {
            let csv = 'ID,Company Name,Email,Phone,Status,Registration Date\n';
            clientsData.forEach(client => {
                csv += `${client.id},"${client.company_name}","${client.email}",${client.phone_number},${client.status},${client.created_at}\n`;
            });
            c.header('Content-Type', 'text/csv');
            return c.body(csv);
        } else if (format === 'pdf') {
            const doc = new jsPDF();
            doc.text('Clients List', 14, 16);
            autoTable(doc, {
                startY: 26, // Adds 10 units of vertical space below the title
                head: [['ID', 'Company Name', 'Email', 'Phone', 'Status', 'Registration Date']],
                body: clientsData.map(c => [c.id, c.company_name, c.email, c.phone_number, c.status, c.created_at.toISOString().split('T')[0]]),
            });
            const pdfBuffer = doc.output('arraybuffer');
            c.header('Content-Type', 'application/pdf');
            return c.body(pdfBuffer);
        }

        return c.json({ success: false, message: 'Unsupported format' }, 400);

    } catch (error) {
        return handleRouteError(c, 'Error exporting clients', error);
    }
});

module.exports = clientsApp;