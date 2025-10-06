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

// GET /api/offices-available - Get a list of available offices for dropdowns
miscApp.get('/offices-available', authMiddleware, async (c) => {
    try {
        const { Op } = require('sequelize');
        const { branch_id, start_date, end_date, current_contract_id } = c.req.query();
        const whereClause = {
            status: { [Op.notIn]: ['Maintenance', 'Unavailable'] }
        };

        if (branch_id) {
            whereClause.branch_id = branch_id;
        }

        // If start_date and end_date are provided, find offices that are already booked
        if (start_date && end_date) {
            const contractWhere = {
                [Op.or]: [
                    { // Contract starts within the selected range
                        start_date: { [Op.between]: [start_date, end_date] }
                    },
                    { // Contract ends within the selected range
                        end_date: { [Op.between]: [start_date, end_date] }
                    },
                    { // Contract envelops the selected range
                        [Op.and]: [
                            { start_date: { [Op.lte]: start_date } },
                            { end_date: { [Op.gte]: end_date } }
                        ]
                    }
                ],
                status: ['Active', 'Pending']
            };

            // If editing a contract, exclude it from the conflict check
            if (current_contract_id) {
                contractWhere.id = { [Op.ne]: current_contract_id };
            }

            const conflictingContracts = await models.Contract.findAll({
                where: contractWhere,
                attributes: ['office_id']
            });

            const bookedOfficeIds = conflictingContracts.map(contract => contract.office_id).filter(id => id);

            if (bookedOfficeIds.length > 0) {
                whereClause.id = { [Op.notIn]: bookedOfficeIds };
            }
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
        
        // In server-side mode, SmartSelect expects `items` and `total`
        return c.json({ success: true, items: offices, total: offices.length });
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