const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { handleRouteError } = require('../lib/errorHandler');

const miscApp = new Hono();

// GET /api/clients-list - Get a simplified list of clients for dropdowns
miscApp.get('/clients', authMiddleware, async (c) => {
    try {
        const clients = await models.Client.findAll({
            attributes: ['id', 'company_name'],
            order: [['company_name', 'ASC']]
        });
        return c.json({ success: true, clients });
    } catch (error) {
        return handleRouteError(c, 'Error fetching client list', error);
    }
});

// GET /api/offices-available - Get a list of available offices for dropdowns
miscApp.get('/offices', authMiddleware, async (c) => {
    try {
        const { branch_id } = c.req.query();
        const whereClause = { status: 'Available' };

        if (branch_id) {
            whereClause.branch_id = branch_id;
        }

        const offices = await models.Office.findAll({
            where: whereClause,
            attributes: ['id', 'name', 'branch_id'],
            include: [{
                model: models.Branch,
                as: 'branch',
                attributes: ['id', 'name']
            }],
            order: [['name', 'ASC']]
        });
        return c.json({ success: true, offices });
    } catch (error) {
        return handleRouteError(c, 'Error fetching available offices', error);
    }
});

// GET /api/investments-list - Get a simplified list of investments for dropdowns
miscApp.get('/investments', authMiddleware, async (c) => {
    try {
        const investments = await models.Investment.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });
        return c.json({ success: true, investments });
    } catch (error) {
        return handleRouteError(c, 'Error fetching investment list', error);
    }
});
// GET /api/roles - Get a simplified list of roles for dropdowns
miscApp.get('/roles', authMiddleware, async (c) => {
    try {
        const roles = await models.Role.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });
        return c.json({ success: true, roles });
    } catch (error) {
        return handleRouteError(c, 'Error fetching role list', error);
    }
});

// GET /api/branches - Get a simplified list of branches for dropdowns
miscApp.get('/branches', authMiddleware, async (c) => {
    try {
        const branches = await models.Branch.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });
        return c.json({ success: true, branches });
    } catch (error) {
        return handleRouteError(c, 'Error fetching branch list', error);
    }
});
miscApp.get('/', async (c) => {
    return c.json({message: 'ready'});
});

module.exports = miscApp;