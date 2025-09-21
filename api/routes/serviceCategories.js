const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { handleRouteError } = require('../lib/errorHandler');

const serviceCategoriesApp = new Hono();

// GET all service categories
serviceCategoriesApp.get('/', authMiddleware, async (c) => {
    try {
        const categories = await models.ServiceCategory.findAll({ order: [['name', 'ASC']] });
        return c.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching service categories:', error);
        return c.json({ success: false, message: 'Failed to fetch service categories' }, 500);
    }
});

// POST a new service category
serviceCategoriesApp.post('/', authMiddleware, async (c) => {
    try {
        const { name, description } = await c.req.json();
        const newCategory = await models.ServiceCategory.create({ name, description });
        return c.json({ success: true, message: 'Service category created successfully', data: newCategory }, 201);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
        return handleRouteError(c, 'Error creating service category', error);
    }
});

// PUT (update) a service category
serviceCategoriesApp.put('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const { name, description } = await c.req.json();
        const category = await models.ServiceCategory.findByPk(id);
        if (!category) {
            return c.json({ success: false, message: 'Service category not found' }, 404);
        }
        await category.update({ name, description });
        return c.json({ success: true, message: 'Service category updated successfully', data: category });
    } catch (error) {
        return handleRouteError(c, `Error updating service category ${id}`, error);
    }
});

// DELETE a service category
serviceCategoriesApp.delete('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const category = await models.ServiceCategory.findByPk(id);
        if (!category) {
            return c.json({ success: false, message: 'Service category not found' }, 404);
        }
        await category.destroy();
        return c.json({ success: true, message: 'Service category deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting service category ${id}`, error);
    }
});

module.exports = serviceCategoriesApp;