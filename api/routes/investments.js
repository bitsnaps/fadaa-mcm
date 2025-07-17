const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const investmentsApp = new Hono();

investmentsApp.use('*', authMiddleware, adminMiddleware);

// GET all investments
investmentsApp.get('/', async (c) => {
    try {
        const investments = await models.Investment.findAll({
            order: [['name', 'ASC']],
        });
        return c.json({ success: true, data: investments });
    } catch (error) {
        console.error('Error fetching investments:', error);
        return c.json({ success: false, message: 'Failed to fetch investments' }, 500);
    }
});

// GET a single investment by ID
investmentsApp.get('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const investment = await models.Investment.findByPk(id);
        if (!investment) {
            return c.json({ success: false, message: 'Investment not found' }, 404);
        }
        return c.json({ success: true, data: investment });
    } catch (error) {
        console.error(`Error fetching investment ${id}:`, error);
        return c.json({ success: false, message: 'Failed to fetch investment' }, 500);
    }
});

// POST a new investment
investmentsApp.post('/', async (c) => {
    try {
        const investmentData = await c.req.json();
        const newInvestment = await models.Investment.create(investmentData);
        return c.json({ success: true, message: 'Investment created successfully', data: newInvestment }, 201);
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
        return c.json({ success: true, message: 'Investment updated successfully', data: investment });
    } catch (error) {
        console.error(`Error updating investment ${id}:`, error);
        return c.json({ success: false, message: 'Failed to update investment' }, 500);
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
        console.error(`Error deleting investment ${id}:`, error);
        return c.json({ success: false, message: 'Failed to delete investment' }, 500);
    }
});

module.exports = investmentsApp;