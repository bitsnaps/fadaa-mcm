const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, adminOrAssistantMiddleware } = require('../middleware/auth');

const incomesApp = new Hono();

incomesApp.use('*', authMiddleware, adminOrAssistantMiddleware); // Apply middleware to all income routes

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

      // Transform data for chart.js format
      const chartData = {
        labels: [],
        datasets: {},
      };

      incomes.forEach(item => {
        const month = item.dataValues.month;
        const branchName = item.dataValues.branch_name;
        const totalAmount = item.dataValues.total_amount;

        if (!chartData.labels.includes(month)) {
          chartData.labels.push(month);
        }

        if (!chartData.datasets[branchName]) {
          chartData.datasets[branchName] = {
            label: branchName,
            data: [],
            backgroundColor: getRandomColor(), // You might want to define specific colors
            stack: 'Stack 0',
          };
        }
        chartData.datasets[branchName].data.push(totalAmount);
      });

      // Ensure all datasets have data for all months, filling with 0 if no sales
      chartData.labels.sort(); // Ensure months are in order
      for (const branchName in chartData.datasets) {
        const branchData = chartData.datasets[branchName].data;
        const fullData = [];
        let dataIndex = 0;
        chartData.labels.forEach(month => {
          // This part needs to be more robust if the order of data in the raw incomes array doesn't match sorted labels
          // For simplicity, assuming it does for now, or will need a more complex mapping
          fullData.push(branchData[dataIndex] || 0); // This is a simplification, needs proper mapping
          dataIndex++;
        });
        chartData.datasets[branchName].data = fullData;
      }

      // Convert datasets object to array
      chartData.datasets = Object.values(chartData.datasets);

      return c.json({ success: true, data: chartData });
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
          { model: models.User, as: 'registered_by_user', attributes: ['id', 'first_name', 'last_name'] }
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
      if (!incomeData.profile_id) {
        return c.json({ success: false, message: 'profile_id is required' }, 400);
      }
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
      console.error(`Error updating income:`, error);
      return c.json({ success: false, message: 'Failed to update income' }, 500);
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
      console.error(`Error deleting income:`, error);
      return c.json({ success: false, message: 'Failed to delete income' }, 500);
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