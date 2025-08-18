const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, adminOrAssistantMiddleware } = require('../middleware/auth');
const { handleRouteError } = require('../lib/errorHandler');

const clientServicesApp = new Hono();

// Middleware to ensure user is authenticated and is an admin or assistant
clientServicesApp.use('*', authMiddleware, adminOrAssistantMiddleware);

// GET /api/client-services/:clientId - Get all services for a specific client
clientServicesApp.get('/:clientId', async (c) => {
    const { clientId } = c.req.param();
    const { profile_id } = c.req.query();

    try {
        const whereClause = { client_id: clientId };
        if (profile_id) {
            whereClause.profile_id = profile_id;
        }

        const services = await models.ClientService.findAll({
            where: whereClause,
            include: [
                {
                    model: models.Profile
                },
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
        return handleRouteError(c, `Error fetching client services for client ${c.req.param('clientId')}`, error);
    }
});

// POST /api/client-services/:clientId - Add a new service to a client
clientServicesApp.post('/:clientId', async (c) => {
    const { clientId } = c.req.param();
    try {
        const { categoryId, paymentType, price, notes, tax_ids, profile_id } = await c.req.json();
        
        if (!categoryId || !paymentType || !price || !profile_id) {
            return c.json({ success: false, message: 'Missing required fields, including profile_id' }, 400);
        }

        const newService = await models.ClientService.create({
            client_id: clientId,
            profile_id: profile_id,
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
        return handleRouteError(c, `Error adding client service for client ${c.req.param('clientId')}`, error);
    }
});

// PUT /api/client-services/:serviceId - Update a service for a client
clientServicesApp.put('/:serviceId', async (c) => {
    const { serviceId } = c.req.param();
    try {
        const { categoryId, paymentType, price, notes, taxId } = await c.req.json();
        
        if (!categoryId || !paymentType || !price) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        const service = await models.ClientService.findByPk(serviceId);
        if (!service) {
            return c.json({ success: false, message: 'Service not found' }, 404);
        }

        await service.update({
            service_category_id: categoryId,
            payment_type: paymentType,
            price,
            notes,
            taxId
        });

        return c.json({ success: true, message: 'Service updated successfully', service });
    } catch (error) {
        return handleRouteError(c, `Error updating client service ${c.req.param('serviceId')}`, error);
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
        return handleRouteError(c, `Error removing client service ${c.req.param('serviceId')}`, error);
    }
});

module.exports = clientServicesApp;