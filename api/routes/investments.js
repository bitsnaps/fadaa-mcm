const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { getInvestmentCalculations } = require('../controllers/investmentController');
const { handleRouteError } = require('../lib/errorHandler');

const investmentsApp = new Hono();

investmentsApp.use('*', authMiddleware, adminMiddleware);

// GET all investments with calculations
investmentsApp.get('/', async (c) => {
    try {
        const { profile_id } = c.req.query();
        let whereClause = {};

        if (profile_id) {
            whereClause.profile_id = profile_id;
        }

        const investments = await models.Investment.findAll({
            where: whereClause,
            include: [
                { model: models.User, as: 'investor' },
                { model: models.Branch },
                { model: models.Profile }
            ],
            order: [['created_at', 'DESC']],
        });

        const enrichedInvestments = await Promise.all(
            investments.map(async (investment) => {
                const calculations = await getInvestmentCalculations([investment]);
                return {
                    ...investment.toJSON(),
                    ...calculations[investment.id],
                };
            })
        );

        return c.json({ success: true, data: enrichedInvestments });
    } catch (error) {
        console.error('Error fetching investments:', error);
        return c.json({ success: false, message: 'Failed to fetch investments' }, 500);
    }
});

// GET a single investment by ID
investmentsApp.get('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const investment = await models.Investment.findByPk(id, {
            include: [
                { model: models.User, as: 'investor' },
                { model: models.Branch }
            ]
        });
        if (!investment) {
            return c.json({ success: false, message: 'Investment not found' }, 404);
        }
        return c.json({ success: true, data: investment });
    } catch (error) {
        return handleRouteError(c, `Error fetching investment ${id}`, error);
    }
});

// POST a new investment
investmentsApp.post('/', async (c) => {
    try {
        const investmentData = await c.req.json();
        if (!investmentData.profile_id) {
            return c.json({ success: false, message: 'profile_id is required' }, 400);
        }
        const newInvestment = await models.Investment.create({
            ...investmentData
        });
        const finalInvestment = await models.Investment.findByPk(newInvestment.id, {
            include: [
                { model: models.User, as: 'investor' },
                { model: models.Branch }
            ]
        });
        return c.json({ success: true, message: 'Investment created successfully', data: finalInvestment }, 201);
    } catch (error) {
        console.error('Error creating investment:', error);
        return c.json({ success: false, message: 'Failed to create investment' }, 500);
    }
});

// PUT (update) an investment
investmentsApp.put('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const investmentData = await c.req.json();
        const investment = await models.Investment.findByPk(id);

        if (!investment) {
            return c.json({ success: false, message: 'Investment not found' }, 404);
        }

        await investment.update(investmentData);
        
        const finalInvestment = await models.Investment.findByPk(id, {
            include: [
                { model: models.User, as: 'investor' },
                { model: models.Branch }
            ]
        });

        return c.json({ success: true, message: 'Investment updated successfully', data: finalInvestment });
    } catch (error) {
        return handleRouteError(c, 'Error updating investment', error);
    }
});

// DELETE an investment
investmentsApp.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const investment = await models.Investment.findByPk(id);
        if (!investment) {
            return c.json({ success: false, message: 'Investment not found' }, 404);
        }

        await investment.destroy();
        return c.json({ success: true, message: 'Investment deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting investment ${c.req.param('id')}`, error);
    }
});

module.exports = investmentsApp;