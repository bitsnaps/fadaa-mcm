const { Hono } = require('hono');
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
            include: [],
            order: [['company_name', 'ASC']],
            subQuery: false
        };

        if (q) {
            where.company_name = { [Op.like]: `%${q}%` };
        }

        if (client_id) {
            where.id = client_id;
        } else if (profile_id) {
            where[Op.or] = [
                { '$Contracts.profile_id$': profile_id },
                { '$ClientServices.profile_id$': profile_id }
            ];
            findOptions.include.push({ model: models.Contract, attributes: [], required: false });
            findOptions.include.push({ model: models.ClientService, attributes: [], required: false });
        } else if (branchId) {
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
            const services = clientData.ClientServices || [];
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

module.exports = clientsApp;