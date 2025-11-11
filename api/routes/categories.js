const { Hono } = require('hono');
const { authMiddleware } = require('../middleware/auth');
const { IncomeCategory, ExpenseCategory } = require('../models');
const { handleRouteError } = require('../lib/errorHandler');

const categoryApp = new Hono();

categoryApp.use('*', authMiddleware);

// Income Category Routes
categoryApp.get('/incomes', async (c) => {
    try {
        const categories = await IncomeCategory.findAll();

        return c.json({
            success: true,
            categories,
            items: categories,
            total: categories.length
        });
    } catch (error) {
        return handleRouteError(c, 'Error fetching income categories', error);
    }
});

categoryApp.post('/incomes', async (c) => {
    try {
        const { name, description } = await c.req.json();
        const newCategory = await IncomeCategory.create({ name, description });
        return c.json({ success: true, category: newCategory }, 201);
    } catch (error) {
        return handleRouteError(c, 'Error creating income category', error);
    }
});

categoryApp.put('/incomes/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const { name, description } = await c.req.json();
        const category = await IncomeCategory.findByPk(id);
        if (!category) return c.json({ success: false, message: 'Category not found' }, 404);
        await category.update({ name, description });
        return c.json({ success: true, category });
    } catch (error) {
        return handleRouteError(c, `Error updating income category ${id}`, error);
    }
});

categoryApp.delete('/incomes/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const category = await IncomeCategory.findByPk(id);
        if (!category) return c.json({ success: false, message: 'Category not found' }, 404);
        await category.destroy();
        return c.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting income category ${id}`, error);
    }
});

// Get single income category (used by SmartSelect.fetchInitialSelectedItem)
categoryApp.get('/incomes/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const category = await IncomeCategory.findByPk(id);
        if (!category) {
            return c.json({ success: false, message: 'Category not found' }, 404);
        }

        return c.json({
            success: true,
            category,
            item: category
        });
    } catch (error) {
        return handleRouteError(c, `Error fetching income category ${id}`, error);
    }
});


 // Expense Category Routes
 categoryApp.get('/expenses', async (c) => {
     try {
         const categories = await ExpenseCategory.findAll();

         return c.json({
             success: true,
             categories,
             items: categories,
             total: categories.length
         });
     } catch (error) {
         return handleRouteError(c, 'Error fetching expense categories', error);
     }
 });

categoryApp.post('/expenses', async (c) => {
    try {
        const { name, description } = await c.req.json();
        const newCategory = await ExpenseCategory.create({ name, description });
        return c.json({ success: true, category: newCategory }, 201);
    } catch (error) {
        return handleRouteError(c, 'Error creating expense category', error);
    }
});

categoryApp.put('/expenses/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const { name, description } = await c.req.json();
        const category = await ExpenseCategory.findByPk(id);
        if (!category) return c.json({ success: false, message: 'Category not found' }, 404);
        await category.update({ name, description });
        return c.json({ success: true, category });
    } catch (error) {
        return handleRouteError(c, `Error updating expense category ${id}`, error);
    }
});

categoryApp.delete('/expenses/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const category = await ExpenseCategory.findByPk(id);
        if (!category) return c.json({ success: false, message: 'Category not found' }, 404);
        await category.destroy();
        return c.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting expense category ${id}`, error);
    }
});

// Get single expense category (used by SmartSelect.fetchInitialSelectedItem)
categoryApp.get('/expenses/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const category = await ExpenseCategory.findByPk(id);
        if (!category) {
            return c.json({ success: false, message: 'Category not found' }, 404);
        }

        return c.json({
            success: true,
            category,
            item: category
        });
    } catch (error) {
        return handleRouteError(c, `Error fetching expense category ${id}`, error);
    }
});


module.exports = categoryApp;