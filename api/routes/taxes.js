const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, assistantMiddleware } = require('../middleware/auth');
const { handleRouteError } = require('../lib/errorHandler');

const taxApp = new Hono();
taxApp.use('*', authMiddleware, assistantMiddleware); // Protect all tax routes

// GET /api/taxes - Get all taxes
taxApp.get('/', async (c) => {
    try {
        const taxes = await models.Tax.findAll({ paranoid: false });
        return c.json({ success: true, taxes });
    } catch (error) {
        console.error('Error fetching taxes:', error);
        return c.json({ success: false, message: 'Failed to fetch taxes' }, 500);
    }
});

// POST /api/taxes - Create a new tax
taxApp.post('/', async (c) => {
    try {
        const { name, rate, description, bearer } = await c.req.json();
        const newTax = await models.Tax.create({ name, rate, description, bearer });
        return c.json({ success: true, message: 'Tax created successfully', tax: newTax }, 201);
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
        return handleRouteError(c, 'Error creating tax', error);
    }
});

// GET /api/taxes/:id - Get a single tax
taxApp.get('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const tax = await models.Tax.findByPk(id, { paranoid: false });
        if (tax) {
            return c.json({ success: true, tax });
        }
        return c.json({ success: false, message: 'Tax not found' }, 404);
    } catch (error) {
        console.error('Error fetching tax:', error);
        return c.json({ success: false, message: 'Failed to fetch tax' }, 500);
    }
});

// PUT /api/taxes/:id - Update a tax
taxApp.put('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const { name, rate, description, bearer } = await c.req.json();
        const tax = await models.Tax.findByPk(id, { paranoid: false });
        if (!tax) {
            return c.json({ success: false, message: 'Tax not found' }, 404);
        }
        await tax.update({ name, rate, description, bearer });
        return c.json({ success: true, message: 'Tax updated successfully', tax });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
        return handleRouteError(c, `Error updating tax ${c.req.param('id')}`, error);
    }
});

// DELETE /api/taxes/:id - Delete a tax
taxApp.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const tax = await models.Tax.findByPk(id, { paranoid: false });
        if (!tax) {
            return c.json({ success: false, message: 'Tax not found' }, 404);
        }
        
        await tax.destroy({ force: true }); // This will hard-delete
        return c.json({ success: true, message: 'Tax deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting tax ${c.req.param('id')}`, error);
    }
});

module.exports = taxApp;