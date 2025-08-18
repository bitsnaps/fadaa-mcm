const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, adminOrAssistantMiddleware } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');
const { Op } = require('sequelize');
const { handleRouteError } = require('../lib/errorHandler');

const expensesApp = new Hono();

expensesApp.use('*', authMiddleware, adminOrAssistantMiddleware);

// GET total expenses for a given period (e.g., current month)
expensesApp.get('/total', async (c) => {
    try {
      const { startDate, endDate, profile_id } = c.req.query();
      const whereClause = {};

      if (profile_id) {
        whereClause.profile_id = profile_id;
      }

      if (startDate && endDate) {
        whereClause.transaction_date = {
          [models.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)],
        };
      } else {
        // Default to current month if no dates are provided
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        whereClause.transaction_date = {
          [models.Sequelize.Op.between]: [startOfMonth, endOfMonth],
        };
      }

      const totalExpense = await models.Expense.sum('amount', { where: whereClause });
      return c.json({ success: true, data: totalExpense || 0 });
    } catch (error) {
      console.error('Error fetching total expense:', error);
      return c.json({ success: false, message: 'Failed to fetch total expense' }, 500);
    }
});

// GET all expenses
expensesApp.get('/', async (c) => {
    try {
      const { profile_id } = c.req.query();
      let whereClause = {};

      if (profile_id) {
        whereClause.profile_id = profile_id;
      }

      const expenses = await models.Expense.findAll({
        where: whereClause,
        include: [
          { model: models.Branch },
          { model: models.Profile },
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] }
        ],
        order: [['transaction_date', 'DESC']],
      });
      return c.json({ success: true, data: expenses });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return c.json({ success: false, message: 'Failed to fetch expenses' }, 500);
    }
});

// GET expense by ID
expensesApp.get('/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const expense = await models.Expense.findByPk(id, {
        include: [
          { model: models.Branch },
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] }
        ],
      });
      if (!expense) {
        return c.json({ success: false, message: 'Expense not found' }, 404);
      }
      return c.json({ success: true, data: expense });
    } catch (error) {
      console.error(`Error fetching expense ${id}:`, error);
      return c.json({ success: false, message: 'Failed to fetch expense' }, 500);
    }
});

// POST a new expense
expensesApp.post('/', async (c) => {
    try {
      const expenseData = await c.req.json();
      if (!expenseData.profile_id) {
        return c.json({ success: false, message: 'profile_id is required' }, 400);
      }
      const newExpense = await models.Expense.create(expenseData);

      // High-value transaction notification
      const HIGH_VALUE_THRESHOLD = 10000;
      if (newExpense.amount > HIGH_VALUE_THRESHOLD) {
        const admins = await models.User.findAll({
            include: [{
                model: models.Role,
                as: 'role',
                where: { name: { [Op.in]: ['Admin'] } },
                attributes: [],
            }],
        });
        const message = `A high-value expense of ${newExpense.amount} was recorded by ${c.get('user').email}.`;
        for (const admin of admins) {
          await createNotification({
            userId: admin.id,
            type: 'HighValueTransaction',
            message: message,
            relatedEntityType: 'expense',
            relatedEntityId: newExpense.id,
          });
        }
      }

      const finalExpense = await models.Expense.findByPk(newExpense.id, {
        include: [
          { model: models.Branch },
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] }
        ],
      });
      return c.json({ success: true, message: 'Expense created successfully', data: finalExpense }, 201);
    } catch (error) {
      console.error('Error creating expense:', error);
      return c.json({ success: false, message: 'Failed to create expense' }, 500);
    }
});

// PUT (update) an expense
expensesApp.put('/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const expenseData = await c.req.json();
      const expense = await models.Expense.findByPk(id);

      if (!expense) {
        return c.json({ success: false, message: 'Expense not found' }, 404);
      }

      await expense.update(expenseData);
      const finalExpense = await models.Expense.findByPk(id, {
        include: [
          { model: models.Branch },
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] }
        ],
      });
      return c.json({ success: true, message: 'Expense updated successfully', data: finalExpense });
    } catch (error) {
      return handleRouteError(c, 'Error updating expense', error);
    }
});

// DELETE an expense
expensesApp.delete('/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const expense = await models.Expense.findByPk(id);
      if (!expense) {
        return c.json({ success: false, message: 'Expense not found' }, 404);
      }

      await expense.destroy();
      return c.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
      return handleRouteError(c, `Error deleting expense ${c.req.param('id')}`, error);
    }
});

module.exports = expensesApp;