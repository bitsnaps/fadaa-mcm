const models = require('../models');
const { Op } = require('sequelize');

async function getMonthlyReport(c) {
  try {
    const { year, month, clientId, branchId, profile_id } = c.req.query();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const where = {
      profile_id,
      transaction_date: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (branchId) where.branch_id = branchId;

    const revenue = await models.Income.sum('amount', { where });
    const newClients = await models.Client.count({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
    const contractsSigned = await models.Contract.count({
      where: {
        start_date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
    const occupiedOffices = await models.Office.count({ where: { status: 'Occupied' } });
    const totalOffices = await models.Office.count();
    const occupancyRate = totalOffices > 0 ? (occupiedOffices / totalOffices) * 100 : 0;

    const reportData = [
      { metric: 'revenue', value: revenue || 0 },
      { metric: 'newClients', value: newClients || 0 },
      { metric: 'contractsSigned', value: contractsSigned || 0 },
      { metric: 'occupancyRate', value: `${occupancyRate.toFixed(2)}%` },
    ];

    return c.json({ success: true, data: reportData });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return c.json({ success: false, message: 'Failed to generate monthly report' }, 500);
  }
}

async function getAnnualReport(c) {
  try {
    const { year, branchId, profile_id } = c.req.query();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const where = {
      profile_id,
      transaction_date: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (branchId) where.branch_id = branchId;

    const revenue = await models.Income.sum('amount', { where });
    const expenses = await models.Expense.sum('amount', { where });
    const profit = revenue - expenses;
    const newClients = await models.Client.count({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
    const contractsSigned = await models.Contract.count({
      where: {
        start_date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
    const occupiedOffices = await models.Office.count({ where: { status: 'Occupied' } });
    const totalOffices = await models.Office.count();
    const occupancyRate = totalOffices > 0 ? (occupiedOffices / totalOffices) * 100 : 0;

    const reportData = {
      revenue: revenue || 0,
      expenses: expenses || 0,
      profit: profit || 0,
      newClients: newClients || 0,
      contractsSigned: contractsSigned || 0,
      occupancyRate: `${occupancyRate.toFixed(2)}%`,
    };

    return c.json({ success: true, data: reportData });
  } catch (error) {
    console.error('Error generating annual report:', error);
    return c.json({ success: false, message: 'Failed to generate annual report' }, 500);
  }
}

module.exports = {
  getMonthlyReport,
  getAnnualReport,
};