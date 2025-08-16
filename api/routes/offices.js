const { Hono } = require('hono');
const { Op } = require('sequelize');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');

const officesApp = new Hono();

// GET all offices with pagination and search
officesApp.get('/', authMiddleware, async (c) => {
    try {
        const { page = 1, limit = 10, search = '' } = c.req.query();
        const offset = (page - 1) * limit;

        const whereClause = search ? {
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { '$branch.name$': { [Op.like]: `%${search}%` } },
                { status: { [Op.like]: `%${search}%` } }
            ]
        } : {};

        const { count, rows } = await models.Office.findAndCountAll({
            where: whereClause,
            include: [{ model: models.Branch, as: 'branch' }],
            order: [['name', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        return c.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            }
        });
    } catch (error) {
        console.error('Error fetching offices:', error);
        return c.json({ success: false, message: 'Failed to fetch offices' }, 500);
    }
});

// POST a new office
officesApp.post('/', authMiddleware, async (c) => {
    try {
        const { name, branch_id, capacity, status, amenities, type } = await c.req.json();
        if (!name || !branch_id || !status || !type) {
            return c.json({ success: false, message: 'Name, branch, status, and type are required' }, 400);
        }
        const newOffice = await models.Office.create({ name, branch_id, capacity, status, amenities, type });
        return c.json({ success: true, message: 'Office created successfully', data: newOffice }, 201);
    } catch (error) {
        console.error('Error creating office:', error);
        return c.json({ success: false, message: 'Failed to create office' }, 500);
    }
});

// PUT (update) an office
officesApp.put('/:id', authMiddleware, async (c) => {
    try {
        const { id } = c.req.param();
        const { name, branch_id, capacity, status, amenities, type } = await c.req.json();
        const user = c.get('user');

        const office = await models.Office.findByPk(id);
        if (!office) {
            return c.json({ success: false, message: 'Office not found' }, 404);
        }

        // If an assistant tries to set the status to 'En instance', create a notification for admins
        if (user.role_id === 2 && status === 'En instance') { // Assuming 2 is 'assistant'
            const admins = await models.User.findAll({ where: { role_id: 1 } }); // Assuming 1 is 'admin'
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
            // Prevent the status change and inform the assistant
            return c.json({ success: true, message: 'Booking request sent to admin for approval.' });
        }

        await office.update({ name, branch_id, capacity, status, amenities, type });
        return c.json({ success: true, message: 'Office updated successfully', data: office });
    } catch (error) {
        console.error(`Error updating office ${id}:`, error);
        return c.json({ success: false, message: 'Failed to update office' }, 500);
    }
});

// DELETE an office
officesApp.delete('/:id', authMiddleware, async (c) => {
    try {
        const { id } = c.req.param();
        const office = await models.Office.findByPk(id);
        if (!office) {
            return c.json({ success: false, message: 'Office not found' }, 404);
        }

        await office.destroy();
        return c.json({ success: true, message: 'Office deleted successfully' });
    } catch (error) {
        console.error(`Error deleting office ${id}:`, error);
        return c.json({ success: false, message: 'Failed to delete office' }, 500);
    }
});

module.exports = officesApp;