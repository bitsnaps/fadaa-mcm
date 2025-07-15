const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');

const miscApp = new Hono();

// GET /api/clients-list - Get a simplified list of clients for dropdowns
miscApp.get('/clients-list', authMiddleware, async (c) => {
    try {
        const clients = await models.Client.findAll({
            attributes: ['id', 'company_name'],
            order: [['company_name', 'ASC']]
        });
        return c.json({ success: true, clients });
    } catch (error) {
        console.error('Error fetching client list:', error);
        return c.json({ success: false, message: 'Failed to fetch client list' }, 500);
    }
});

// GET /api/offices-available - Get a list of available offices for dropdowns
miscApp.get('/offices-available', authMiddleware, async (c) => {
    try {
        const offices = await models.Office.findAll({
            where: { status: 'Available' },
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });
        return c.json({ success: true, offices });
    } catch (error) {
        console.error('Error fetching available offices:', error);
        return c.json({ success: false, message: 'Failed to fetch available offices' }, 500);
    }
});

miscApp.get('/', async (c) => {
    return c.json({message: 'ready'});
});


module.exports = miscApp;