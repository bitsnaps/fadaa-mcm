const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');

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
    try {
        const { id } = c.req.param();
        const { name, location, status } = await c.req.json();
        
        const branch = await models.Branch.findByPk(id);
        if (!branch) {
            return c.json({ success: false, message: 'Branch not found' }, 404);
        }

        await branch.update({ name, location, status });
        return c.json({ success: true, message: 'Branch updated successfully', data: branch });
    } catch (error) {
        console.error(`Error updating branch ${id}:`, error);
        return c.json({ success: false, message: 'Failed to update branch' }, 500);
    }
});

// DELETE a branch
branchesApp.delete('/:id', authMiddleware, async (c) => {
    try {
        const { id } = c.req.param();
        const branch = await models.Branch.findByPk(id);
        if (!branch) {
            return c.json({ success: false, message: 'Branch not found' }, 404);
        }

        await branch.destroy();
        return c.json({ success: true, message: 'Branch deleted successfully' });
    } catch (error) {
        console.error(`Error deleting branch ${id}:`, error);
        return c.json({ success: false, message: 'Failed to delete branch' }, 500);
    }
});

module.exports = branchesApp;