const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');
const { createNotification } = require('../services/notificationService');
const { Op } = require('sequelize');
const { handleRouteError } = require('../lib/errorHandler');

const clientsApp = new Hono();

clientsApp.use('*', authMiddleware);

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
        const { profile_id } = c.req.query();

        const clientServiceInclude = {
            model: models.ClientService,
            attributes: ['id', 'price', 'taxId', 'profile_id'],
            include: [
                {
                    model: models.Tax,
                    attributes: ['rate', 'bearer']
                }
            ],
            required: false // keep clients even if they have no services for this profile
        };

        if (profile_id) {
            clientServiceInclude.where = { profile_id };
        }

        const clients = await models.Client.findAll({
            attributes: [
                'id',
                'company_name',
                'first_name',
                'last_name',
                'email',
                'phone_number',
                'address',
                'status',
                'created_at'
            ],
            include: [
                { model: models.User, as: 'managed_by', attributes: ['id', 'first_name', 'last_name'] },
                { model: models.Office, as: 'office', attributes: ['id', 'name'] },
                clientServiceInclude
            ],
            order: [['company_name', 'ASC']],
        });

        // Calculate service count and total amount for each client
        const clientsWithStats = clients.map(client => {
            const clientData = client.toJSON();
            const services = clientData.ClientServices || [];

            // Calculate total service count
            clientData.total_services = services.length;

            // Calculate total amount with and without taxes
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

            // Remove the ClientServices array from response to keep it clean
            delete clientData.ClientServices;

            return clientData;
        });

        return c.json({ success: true, data: clientsWithStats });
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
    try {
        const clientData = await c.req.parseBody();

        // Validate required fields
        // if (!clientData.company_name || !clientData.first_name || !clientData.last_name || !clientData.phone_number) {
        //     return c.json({ success: false, message: 'Missing required fields: company_name, first_name, last_name, phone_number' }, 400);
        // }

        const newClient = await models.Client.create(clientData);
        return c.json({ success: true, message: 'Client created successfully', data: newClient }, 201);
    } catch (error) {
        console.error('Error creating client:', error);
        return c.json({ success: false, message: 'Failed to create client' }, 500);
    }
});

// PUT (update) a client
clientsApp.put('/:id', uploadMiddleware('attachments', 'attachments'), async (c) => {
    const { id } = c.req.param();
    try {
        const clientData = await c.req.parseBody();

        // Validate required fields
        if (!clientData.company_name || !clientData.first_name || !clientData.last_name || !clientData.phone_number) {
            return c.json({ success: false, message: 'Missing required fields: company_name, first_name, last_name, phone_number' }, 400);
        }

        const client = await models.Client.findByPk(id);
        if (!client) {
            return c.json({ success: false, message: 'Client not found' }, 404);
        }
        await client.update(clientData);
        return c.json({ success: true, message: 'Client updated successfully', data: client });
    } catch (error) {
        return handleRouteError(c, `Error updating client ${id}`, error);
    }
});

// DELETE a client
clientsApp.delete('/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const client = await models.Client.findByPk(id);
        if (!client) {
            return c.json({ success: false, message: 'Client not found' }, 404);
        }

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
        const message = `Client ${deletedClientName} has been deleted by ${c.get('user').email}.`;

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
    } catch (error) {
        return handleRouteError(c, `Error deleting client ${id}`, error);
    }
});

module.exports = clientsApp;