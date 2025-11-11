const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, assistantMiddleware } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');
const { Op } = require('sequelize');
const { handleRouteError } = require('../lib/errorHandler');

const incomesApp = new Hono();

incomesApp.use('*', authMiddleware, assistantMiddleware); // Apply middleware to all income routes

// GET total income for a given period (e.g., current month)
incomesApp.get('/total', async (c) => {
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

      const totalIncome = await models.Income.sum('amount', { where: whereClause });
      return c.json({ success: true, data: totalIncome || 0 });
    } catch (error) {
      console.error('Error fetching total income:', error);
      return c.json({ success: false, message: 'Failed to fetch total income' }, 500);
    }
});

// GET monthly income aggregated by branch
incomesApp.get('/monthly-by-branch', async (c) => {
    try {
      const { profile_id } = c.req.query();
      let whereClause = {};

      if (profile_id) {
        whereClause.profile_id = profile_id;
      }

      const incomes = await models.Income.findAll({
        where: whereClause,
        attributes: [
          [models.Sequelize.fn('DATE_FORMAT', models.Sequelize.col('transaction_date'), '%Y-%m'), 'month'],
          [models.Sequelize.fn('SUM', models.Sequelize.col('amount')), 'total_amount'],
          [models.Sequelize.col('Branch.name'), 'branch_name']
        ],
        include: [
          {
            model: models.Branch,
            attributes: [],
          }
        ],
        group: ['month', 'Branch.name'],
        order: [[models.Sequelize.literal('month'), 'ASC']],
      });

      // Transform data for chart.js format using robust (month, branch) mapping
      const monthSet = new Set();
      const branchSet = new Set();
      const valueMap = {}; // { [branchName]: { [month]: total } }

      incomes.forEach((item) => {
        const month = item.dataValues.month;
        const branchName = item.dataValues.branch_name;
        const totalAmount = Number(item.dataValues.total_amount) || 0;
        monthSet.add(month);
        branchSet.add(branchName);
        if (!valueMap[branchName]) valueMap[branchName] = {};
        valueMap[branchName][month] = totalAmount;
      });

      const labels = Array.from(monthSet).sort();
      const datasets = Array.from(branchSet).map((branchName) => ({
        label: branchName,
        data: labels.map((m) => (valueMap[branchName]?.[m] ?? 0)),
        backgroundColor: getRandomColor(),
        stack: 'Stack 0',
      }));

      return c.json({ success: true, data: { labels, datasets } });
    } catch (error) {
      console.error('Error fetching monthly income by branch:', error);
      return c.json({ success: false, message: 'Failed to fetch monthly income by branch' }, 500);
    }
});

// GET all incomes
incomesApp.get('/', async (c) => {
    try {
      const { profile_id } = c.req.query();
      let whereClause = {};

      if (profile_id) {
        whereClause.profile_id = profile_id;
      }

      const incomes = await models.Income.findAll({
        where: whereClause,
        include: [
          { model: models.Branch },
          { model: models.Profile },
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] },
          { model: models.IncomeCategory, as: 'category' }
        ],
        order: [['transaction_date', 'DESC']],
      });
      return c.json({ success: true, data: incomes });
    } catch (error) {
      console.error('Error fetching incomes:', error);
      return c.json({ success: false, message: 'Failed to fetch incomes' }, 500);
    }
});

// GET income by ID
incomesApp.get('/:id', async (c) => {
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
});

// POST a new income
incomesApp.post('/', async (c) => {
    try {
      const incomeData = await c.req.json();
      const newIncome = await models.Income.create(incomeData);

      // High-value transaction notification
      const HIGH_VALUE_THRESHOLD = 10000;
      if (newIncome.amount > HIGH_VALUE_THRESHOLD) {
        const admins = await models.User.findAll({
            include: [{
                model: models.Role,
                as: 'role',
                where: { name: { [Op.in]: ['Admin'] } },
                attributes: [],
            }],
        });
        const message = `A high-value income of ${newIncome.amount} was recorded by ${c.get('user').email}.`;
        for (const admin of admins) {
          await createNotification({
            userId: admin.id,
            type: 'HighValueTransaction',
            message: message,
            relatedEntityType: 'income',
            relatedEntityId: newIncome.id,
          });
        }
      }

      const finalIncome = await models.Income.findByPk(newIncome.id, {
        include: [
          { model: models.Branch },
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] }
        ],
      });
      return c.json({ success: true, message: 'Income created successfully', data: finalIncome }, 201);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
      return handleRouteError(c, 'Error creating income', error);
    }
});

// PUT (update) an income
incomesApp.put('/:id', async (c) => {
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
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.reduce((acc, err) => {
                acc[err.path] = err.message;
                return acc;
            }, {});
            return c.json({ errors }, 422);
        }
      return handleRouteError(c, 'Error updating income', error);
    }
});

// DELETE an income
incomesApp.delete('/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const income = await models.Income.findByPk(id);
      if (!income) {
        return c.json({ success: false, message: 'Income not found' }, 404);
      }

      await income.destroy();
      return c.json({ success: true, message: 'Income deleted successfully' });
    } catch (error) {
      return handleRouteError(c, `Error deleting income ${c.req.param('id')}`, error);
    }
});

// Helper to generate random colors (can be replaced with a fixed palette)
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

module.exports = incomesApp;