const models = require('../models');

const expenseController = {
  // Get all expenses
  getAllExpenses: async (c) => {
    try {
      const expenses = await models.Expense.findAll({
        include: [
          { model: models.Branch },
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] }
        ],
        order: [['transaction_date', 'DESC']],
      });
      return c.json({ success: true, data: expenses });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return c.json({ success: false, message: 'Failed to fetch expenses' }, 500);
    }
  },

  // Get expense by ID
  getExpenseById: async (c) => {
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
  },

  // Create new expense
  createExpense: async (c) => {
    try {
      const expenseData = await c.req.json();
      const newExpense = await models.Expense.create(expenseData);
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
  },

  // Update expense
  updateExpense: async (c) => {
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
      console.error(`Error updating expense:`, error);
      return c.json({ success: false, message: 'Failed to update expense' }, 500);
    }
  },

  // Delete expense
  deleteExpense: async (c) => {
    try {
      const { id } = c.req.param();
      const expense = await models.Expense.findByPk(id);
      if (!expense) {
        return c.json({ success: false, message: 'Expense not found' }, 404);
      }

      await expense.destroy();
      return c.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
      console.error(`Error deleting expense:`, error);
      return c.json({ success: false, message: 'Failed to delete expense' }, 500);
    }
  },
};

module.exports = expenseController;