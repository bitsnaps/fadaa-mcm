const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, adminOrAssistantMiddleware } = require('../middleware/auth');

const clientServicesApp = new Hono();

// Middleware to ensure user is authenticated and is an admin or assistant
clientServicesApp.use('*', authMiddleware, adminOrAssistantMiddleware);

// GET /api/client-services/:clientId - Get all services for a specific client
clientServicesApp.get('/:clientId', async (c) => {
    const { clientId } = c.req.param();
    try {
        const services = await models.ClientService.findAll({
            where: { client_id: clientId },
            include: [
                {
                    model: models.Tax
                },
                {
                    model: models.ServiceCategory,
                    attributes: ['name']
                }
            ]
        });
        return c.json({ success: true, services });
    } catch (error) {
        console.error('Error fetching client services:', error);
        return c.json({ success: false, message: 'Failed to fetch client services' }, 500);
    }
});

// POST /api/client-services/:clientId - Add a new service to a client
clientServicesApp.post('/:clientId', async (c) => {
    const { clientId } = c.req.param();
    try {
        const { categoryId, paymentType, price, notes, tax_ids } = await c.req.json();
        
        if (!categoryId || !paymentType || !price) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        const newService = await models.ClientService.create({
            client_id: clientId,
            service_category_id: categoryId,
            payment_type: paymentType,
            price,
            notes
        });

        if (tax_ids && tax_ids.length > 0) {
            await newService.setTaxes(tax_ids);
        }

        return c.json({ success: true, message: 'Service added successfully', service: newService }, 201);
    } catch (error) {
        console.error('Error adding client service:', error);
        return c.json({ success: false, message: 'Failed to add service' }, 500);
    }
});

// DELETE /api/client-services/:serviceId - Remove a service from a client
clientServicesApp.delete('/:serviceId', async (c) => {
    const { serviceId } = c.req.param();
    try {
        const service = await models.ClientService.findByPk(serviceId);
        if (!service) {
            return c.json({ success: false, message: 'Service not found' }, 404);
        }
        await service.destroy();
        return c.json({ success: true, message: 'Service removed successfully' });
    } catch (error) {
        console.error('Error removing client service:', error);
        return c.json({ success: false, message: 'Failed to remove service' }, 500);
    }
});

module.exports = clientServicesApp;