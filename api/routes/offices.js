const { Hono } = require('hono');
const { Op } = require('sequelize');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const officeController = require('../controllers/officeController');
const branchRestriction = require('../middleware/branchRestriction');
const { createNotification } = require('../services/notificationService');
const { handleRouteError } = require('../lib/errorHandler');

const officesApp = new Hono();

// GET all offices with pagination and search
officesApp.get('/', authMiddleware, branchRestriction(), officeController.getOffices);

// GET single office by ID
officesApp.get('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const office = await models.Office.findByPk(id, {
            include: [{ model: models.Branch, as: 'branch' }],
        });
        if (!office) {
            return c.json({ success: false, message: 'Office not found' }, 404);
        }
        return c.json({ success: true, item: office });
    } catch (error) {
        return handleRouteError(c, `Error fetching office ${id}`, error);
    }
});

// POST a new office
officesApp.post('/', authMiddleware, async (c) => {
    try {
        const { name, branch_id, capacity, status, amenities, type, area } = await c.req.json();
        const newOffice = await models.Office.create({ name, branch_id, capacity, status, amenities, type, area });
        return c.json({ success: true, message: 'Office created successfully', data: newOffice }, 201);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
        return handleRouteError(c, 'Error creating office', error);
    }
});

// PUT (update) an office
officesApp.put('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const { name, branch_id, capacity, status, amenities, type, area } = await c.req.json();
        const user = c.get('user');

        const office = await models.Office.findByPk(id);
        if (!office) {
            return c.json({ success: false, message: 'Office not found' }, 404);
        }

        if (user.role_id === 2 && status === 'En instance') {
            const admins = await models.User.findAll({ where: { role_id: 1 } });
            const message = `Assistant ${user.first_name} has requested to book office ${office.name}.`;
            for (const admin of admins) {
                await createNotification({
                    userId: admin.id,
                    type: 'OfficeBookingRequest',
                    message: message,
                    relatedEntityType: 'office',
                    relatedEntityId: office.id,
                });
            }
            return c.json({ success: true, message: 'Booking request sent to admin for approval.' });
        }

        await office.update({ name, branch_id, capacity, status, amenities, type, area });
        return c.json({ success: true, message: 'Office updated successfully', data: office });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
        return handleRouteError(c, `Error updating office ${id}`, error);
    }
});

// DELETE an office
officesApp.delete('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const office = await models.Office.findByPk(id);
        if (!office) {
            return c.json({ success: false, message: 'Office not found' }, 404);
        }

        await office.destroy();
        return c.json({ success: true, message: 'Office deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting office ${id}`, error);
    }
});

module.exports = officesApp;