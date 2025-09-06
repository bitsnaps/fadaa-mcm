const models = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const { calculateMonthlyReportMetrics } = require('../lib/calculations');

async function getMonthlyReport(c) {
  try {
    const filters = c.req.query();
    const { revenue, newClients, contractsSigned, occupancyRate } = await calculateMonthlyReportMetrics(filters);

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

async function downloadMonthlyReport(c) {
  try {
    const { format, ...filters } = await c.req.json();
    const { year, month } = filters;
    
    const { revenue, newClients, contractsSigned, occupancyRate } = await calculateMonthlyReportMetrics(filters);

    const reportData = [
      { metric: 'Revenue', value: revenue || 0 },
      { metric: 'New Clients', value: newClients || 0 },
      { metric: 'Contracts Signed', value: contractsSigned || 0 },
      { metric: 'Occupancy Rate', value: `${occupancyRate.toFixed(2)}%` },
    ];

    if (format === 'csv') {
      let csv = 'Metric,Value\n';
      reportData.forEach(item => {
        csv += `${item.metric},${item.value}\n`;
      });
      c.header('Content-Type', 'text/csv');
      c.header('Content-Disposition', `attachment; filename="monthly-report-${year}-${month}.csv"`);
      return c.body(csv);
    } else if (format === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Monthly Report');
        worksheet.columns = [
            { header: 'Metric', key: 'metric', width: 20 },
            { header: 'Value', key: 'value', width: 15 },
        ];
        worksheet.addRows(reportData);
        const buffer = await workbook.xlsx.writeBuffer();
        c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        c.header('Content-Disposition', `attachment; filename="monthly-report-${year}-${month}.xlsx"`);
        return c.body(buffer);
    }

    return c.json({ success: false, message: 'Unsupported format' }, 400);
  } catch (error) {
    console.error('Error downloading monthly report:', error);
    return c.json({ success: false, message: 'Failed to download monthly report' }, 500);
  }
}

async function downloadAnnualReport(c) {
  try {
    const { format, ...filters } = await c.req.json();
    const { year } = filters;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const where = {
      profile_id: filters.profile_id,
      transaction_date: {
        [Op.between]: [startDate, endDate],
      },
    };
    if (filters.branchId) where.branch_id = filters.branchId;

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
      'Total Revenue': revenue || 0,
      'Total Expenses': expenses || 0,
      'Net Profit': profit || 0,
      'New Clients': newClients || 0,
      'Contracts Signed': contractsSigned || 0,
      'Average Occupancy': `${occupancyRate.toFixed(2)}%`,
    };

    if (format === 'csv') {
      let csv = 'Metric,Value\n';
      for (const metric in reportData) {
        csv += `${metric},${reportData[metric]}\n`;
      }
      c.header('Content-Type', 'text/csv');
      c.header('Content-Disposition', `attachment; filename="annual-report-${year}.csv"`);
      return c.body(csv);
    } else if (format === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Annual Report');
        worksheet.columns = [
            { header: 'Metric', key: 'metric', width: 20 },
            { header: 'Value', key: 'value', width: 15 },
        ];
        for (const metric in reportData) {
            worksheet.addRow({ metric, value: reportData[metric] });
        }
        const buffer = await workbook.xlsx.writeBuffer();
        c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        c.header('Content-Disposition', `attachment; filename="annual-report-${year}.xlsx"`);
        return c.body(buffer);
    }
  } catch (error) {
    console.error('Error downloading annual report:', error);
    return c.json({ success: false, message: 'Failed to download annual report' }, 500);
  }
}

module.exports = {
  getMonthlyReport,
  getAnnualReport,
  downloadMonthlyReport,
  downloadAnnualReport,
};