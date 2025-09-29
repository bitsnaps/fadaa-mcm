const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { handleRouteError } = require('../lib/errorHandler');

const pendingDeletionsApp = new Hono();

pendingDeletionsApp.use('*', authMiddleware);

// GET all pending deletions
pendingDeletionsApp.get('/', async (c) => {
    const user = c.get('user');
    if (!user.isAdmin()) {
        return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    try {
        const pendingDeletions = await models.PendingDeletion.findAll({
            where: { status: 'pending' },
            include: [
                { model: models.User, as: 'requester', attributes: ['id', 'first_name', 'last_name', 'email'] }
            ]
        });
        return c.json({ success: true, data: pendingDeletions });
    } catch (error) {
        return handleRouteError(c, 'Error fetching pending deletions', error);
    }
});

// POST approve or reject a pending deletion
pendingDeletionsApp.post('/:id/status', async (c) => {
    const { id } = c.req.param();
    const { status } = await c.req.json();
    const user = c.get('user');

    if (!user.isAdmin()) {
        return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    if (!['approved', 'rejected'].includes(status)) {
        return c.json({ success: false, message: 'Invalid status' }, 400);
    }

    try {
        const pendingDeletion = await models.PendingDeletion.findByPk(id);
        if (!pendingDeletion) {
            return c.json({ success: false, message: 'Pending deletion not found' }, 404);
        }

        if (pendingDeletion.status !== 'pending') {
            return c.json({ success: false, message: 'This request has already been processed' }, 400);
        }

        pendingDeletion.status = status;
        pendingDeletion.approved_by = user.id;
        await pendingDeletion.save();

        if (status === 'approved') {
            if (pendingDeletion.entity_type === 'client') {
                const client = await models.Client.findByPk(pendingDeletion.entity_id);
                if (client) {
                    await client.destroy();
                }
            } else if (pendingDeletion.entity_type === 'contract') {
                const contract = await models.Contract.findByPk(pendingDeletion.entity_id);
                if (contract) {
                    await contract.destroy();
                }
            }
        }

        return c.json({ success: true, message: `Deletion request ${status}` });
    } catch (error) {
        return handleRouteError(c, 'Error processing deletion request', error);
    }
});

module.exports = pendingDeletionsApp;