const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, assistantMiddleware } = require('../middleware/auth');
const { handleRouteError } = require('../lib/errorHandler');

const clientServicesApp = new Hono();

// Middleware to ensure user is authenticated and is an admin or assistant
clientServicesApp.use('*', authMiddleware, assistantMiddleware);

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
        const { categoryId, paymentType, price, notes, taxId, profile_id, status, transaction_date } = await c.req.json();

        const txDate = transaction_date ? new Date(transaction_date) : new Date();

        // Find active contract for this client at the transaction date
        const activeContract = await models.Contract.findOne({
            where: {
                client_id: clientId,
                start_date: { [models.Op.lte]: txDate },
                end_date: { [models.Op.gte]: txDate }
            }
        });

        const newService = await models.ClientService.create({
            client_id: clientId,
            profile_id: profile_id,
            service_category_id: categoryId,
            payment_type: paymentType,
            price,
            notes,
            status,
            taxId,
            contract_id: activeContract ? activeContract.id : null,
            transaction_date: txDate
        });

        return c.json({ success: true, message: 'Service added successfully', service: newService }, 201);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
        return handleRouteError(c, `Error adding client service for client ${c.req.param('clientId')}`, error);
    }
});

// PUT /api/client-services/:serviceId - Update a service for a client
clientServicesApp.put('/:serviceId', async (c) => {
    const { serviceId } = c.req.param();
    try {
        const { categoryId, paymentType, price, notes, taxId, status, transaction_date } = await c.req.json();

        const service = await models.ClientService.findByPk(serviceId);
        if (!service) {
            return c.json({ success: false, message: 'Service not found' }, 404);
        }

        let contractId = service.contract_id;
        const newTxDate = transaction_date ? new Date(transaction_date) : service.transaction_date;

        // If date changed or no contract assigned, try to find one
        if (transaction_date || !contractId) {
             const activeContract = await models.Contract.findOne({
                where: {
                    client_id: service.client_id,
                    start_date: { [models.Op.lte]: newTxDate },
                    end_date: { [models.Op.gte]: newTxDate }
                }
            });
            if (activeContract) {
                contractId = activeContract.id;
            }
        }

        await service.update({
            service_category_id: categoryId,
            payment_type: paymentType,
            price,
            notes,
            taxId,
            status,
            contract_id: contractId,
            transaction_date: newTxDate
        });

        return c.json({ success: true, message: 'Service updated successfully', service });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
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