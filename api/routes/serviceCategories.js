const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');

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
        if (!name) {
            return c.json({ success: false, message: 'Name is required' }, 400);
        }
        const newCategory = await models.ServiceCategory.create({ name, description });
        return c.json({ success: true, message: 'Service category created successfully', data: newCategory }, 201);
    } catch (error) {
        console.error('Error creating service category:', error);
        return c.json({ success: false, message: 'Failed to create service category' }, 500);
    }
});

// PUT (update) a service category
serviceCategoriesApp.put('/:id', authMiddleware, async (c) => {
    try {
        const { id } = c.req.param();
        const { name, description } = await c.req.json();
        
        const category = await models.ServiceCategory.findByPk(id);
        if (!category) {
            return c.json({ success: false, message: 'Service category not found' }, 404);
        }

        await category.update({ name, description });
        return c.json({ success: true, message: 'Service category updated successfully', data: category });
    } catch (error) {
        console.error(`Error updating service category ${id}:`, error);
        return c.json({ success: false, message: 'Failed to update service category' }, 500);
    }
});

// DELETE a service category
serviceCategoriesApp.delete('/:id', authMiddleware, async (c) => {
    try {
        const { id } = c.req.param();
        const category = await models.ServiceCategory.findByPk(id);
        if (!category) {
            return c.json({ success: false, message: 'Service category not found' }, 404);
        }

        await category.destroy();
        return c.json({ success: true, message: 'Service category deleted successfully' });
    } catch (error) {
        console.error(`Error deleting service category ${id}:`, error);
        return c.json({ success: false, message: 'Failed to delete service category' }, 500);
    }
});

module.exports = serviceCategoriesApp;