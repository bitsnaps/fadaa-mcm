const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');

const clientsApp = new Hono();

// GET all clients
clientsApp.get('/', authMiddleware, async (c) => {
    try {
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
                { model: models.Office, as: 'office', attributes: ['id', 'name'] }
            ],
            order: [['company_name', 'ASC']],
        });
        return c.json({ success: true, data: clients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return c.json({ success: false, message: 'Failed to fetch clients' }, 500);
    }
});

// GET a single client by ID
clientsApp.get('/:id', authMiddleware, async (c) => {
    try {
        const { id } = c.req.param();
        const client = await models.Client.findByPk(id);
        if (!client) {
            return c.json({ success: false, message: 'Client not found' }, 404);
        }
        return c.json({ success: true, data: client });
    } catch (error) {
        console.error(`Error fetching client ${id}:`, error);
        return c.json({ success: false, message: 'Failed to fetch client' }, 500);
    }
});

// POST a new client
clientsApp.post('/', authMiddleware, async (c) => {
    try {
        const clientData = await c.req.json();
        const newClient = await models.Client.create(clientData);
        return c.json({ success: true, message: 'Client created successfully', data: newClient }, 201);
    } catch (error) {
        console.error('Error creating client:', error);
        return c.json({ success: false, message: 'Failed to create client' }, 500);
    }
});

// PUT (update) a client
clientsApp.put('/:id', authMiddleware, async (c) => {
    try {
        const { id } = c.req.param();
        const clientData = await c.req.json();
        
        const client = await models.Client.findByPk(id);
        if (!client) {
            return c.json({ success: false, message: 'Client not found' }, 404);
        }

        await client.update(clientData);
        return c.json({ success: true, message: 'Client updated successfully', data: client });
    } catch (error) {
        console.error(`Error updating client ${id}:`, error);
        return c.json({ success: false, message: 'Failed to update client' }, 500);
    }
});

// DELETE a client
clientsApp.delete('/:id', authMiddleware, async (c) => {
    try {
        const { id } = c.req.param();
        const client = await models.Client.findByPk(id);
        if (!client) {
            return c.json({ success: false, message: 'Client not found' }, 404);
        }

        await client.destroy();
        return c.json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
        console.error(`Error deleting client ${id}:`, error);
        return c.json({ success: false, message: 'Failed to delete client' }, 500);
    }
});

module.exports = clientsApp;