const models = require('../models');

const incomeController = {
  // Get all incomes
  getAllIncomes: async (c) => {
    try {
      const incomes = await models.Income.findAll({
        include: [
          { model: models.Branch },
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] }
        ],
        order: [['transaction_date', 'DESC']],
      });
      return c.json({ success: true, data: incomes });
    } catch (error) {
      console.error('Error fetching incomes:', error);
      return c.json({ success: false, message: 'Failed to fetch incomes' }, 500);
    }
  },

  // Get income by ID
  getIncomeById: async (c) => {
    try {
      const { id } = c.req.param();
      const income = await models.Income.findByPk(id, {
        include: [
          { model: models.Branch },
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] }
        ],
      });
      if (!income) {
        return c.json({ success: false, message: 'Income not found' }, 404);
      }
      return c.json({ success: true, data: income });
    } catch (error) {
      console.error(`Error fetching income ${id}:`, error);
      return c.json({ success: false, message: 'Failed to fetch income' }, 500);
    }
  },

  // Create new income
  createIncome: async (c) => {
    try {
      const incomeData = await c.req.json();
      const newIncome = await models.Income.create(incomeData);
      const finalIncome = await models.Income.findByPk(newIncome.id, {
        include: [
          { model: models.Branch },
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] }
        ],
      });
      return c.json({ success: true, message: 'Income created successfully', data: finalIncome }, 201);
    } catch (error) {
      console.error('Error creating income:', error);
      return c.json({ success: false, message: 'Failed to create income' }, 500);
    }
  },

  // Update income
  updateIncome: async (c) => {
    try {
      const { id } = c.req.param();
      const incomeData = await c.req.json();
      const income = await models.Income.findByPk(id);

      if (!income) {
        return c.json({ success: false, message: 'Income not found' }, 404);
      }

      await income.update(incomeData);
      const finalIncome = await models.Income.findByPk(id, {
        include: [
          { model: models.Branch },
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] }
        ],
      });
      return c.json({ success: true, message: 'Income updated successfully', data: finalIncome });
    } catch (error) {
      console.error(`Error updating income:`, error);
      return c.json({ success: false, message: 'Failed to update income' }, 500);
    }
  },

  // Delete income
  deleteIncome: async (c) => {
    try {
      const { id } = c.req.param();
      const income = await models.Income.findByPk(id);
      if (!income) {
        return c.json({ success: false, message: 'Income not found' }, 404);
      }

      await income.destroy();
      return c.json({ success: true, message: 'Income deleted successfully' });
    } catch (error) {
      console.error(`Error deleting income:`, error);
      return c.json({ success: false, message: 'Failed to delete income' }, 500);
    }
  },
};

module.exports = incomeController;