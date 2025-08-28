const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { handleRouteError } = require('../lib/errorHandler');

const branchesApp = new Hono();

// GET all branches
branchesApp.get('/', authMiddleware, async (c) => {
    try {
        const branches = await models.Branch.findAll({
            order: [['created_at', 'DESC']],
        });
        return c.json({ success: true, data: branches });
    } catch (error) {
        console.error('Error fetching branches:', error);
        return c.json({ success: false, message: 'Failed to fetch branches' }, 500);
    }
});

// GET branches with contracts
branchesApp.get('/with-contracts', authMiddleware, async (c) => {
    try {
        const branches = await models.Branch.findAll({
            include: [{
                model: models.Office,
                required: true, // INNER JOIN to ensure office exists
                include: [{
                    model: models.Contract,
                    required: true, // INNER JOIN to ensure contract exists
                    attributes: []
                }],
                attributes: []
            }],
            group: ['Branch.id'],
            order: [['name', 'ASC']],
        });
        return c.json({ success: true, data: branches });
    } catch (error) {
        return handleRouteError(c, 'Error fetching branches with contracts', error);
    }
});

// POST a new branch
branchesApp.post('/', authMiddleware, async (c) => {
    try {
        const { name, location } = await c.req.json();
        if (!name || !location) {
            return c.json({ success: false, message: 'Name and location are required' }, 400);
        }
        const newBranch = await models.Branch.create({ name, location });
        return c.json({ success: true, message: 'Branch created successfully', data: newBranch }, 201);
    } catch (error) {
        console.error('Error creating branch:', error);
        return c.json({ success: false, message: 'Failed to create branch' }, 500);
    }
});

// PUT (update) a branch
branchesApp.put('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const { name, location, status } = await c.req.json();
        const branch = await models.Branch.findByPk(id);
        if (!branch) {
            return c.json({ success: false, message: 'Branch not found' }, 404);
        }
        await branch.update({ name, location, status });
        return c.json({ success: true, message: 'Branch updated successfully', data: branch });
    } catch (error) {
        return handleRouteError(c, `Error updating branch ${id}`, error);
    }
});

// DELETE a branch
branchesApp.delete('/:id', authMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
        const branch = await models.Branch.findByPk(id);
        if (!branch) {
            return c.json({ success: false, message: 'Branch not found' }, 404);
        }
        await branch.destroy();
        return c.json({ success: true, message: 'Branch deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting branch ${id}`, error);
    }
});

module.exports = branchesApp;