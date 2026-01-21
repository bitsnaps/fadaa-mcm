const models = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const { calculateMonthlyReportMetrics, calculateAnnualReportMetrics } = require('../lib/calculations');

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
    const filters = c.req.query();
    const { revenue, expenses, profit, newClients, contractsSigned, occupancyRate } = await calculateAnnualReportMetrics(filters);

    const reportData = {
      revenue,
      expenses,
      profit,
      newClients,
      contractsSigned,
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
    const { revenue, expenses, profit, newClients, contractsSigned, occupancyRate } = await calculateAnnualReportMetrics(filters);

    const reportData = {
      'Total Revenue': revenue,
      'Total Expenses': expenses,
      'Net Profit': profit,
      'New Clients': newClients,
      'Contracts Signed': contractsSigned,
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

async function getFinancialSummary(c) {
    try {
        const {
            profile_id,
            period = 'this_month',
            startDate: startDateParam,
            endDate: endDateParam,
        } = c.req.query();

        if (!profile_id) {
            return c.json({ success: false, message: 'profile_id is required' }, 400);
        }

        const now = new Date();
        let startDate;
        let endDate;

        if (startDateParam && endDateParam) {
            // Explicit custom range (inclusive full days)
            startDate = new Date(startDateParam);
            endDate = new Date(endDateParam);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // Derived ranges based on period
            switch (period) {
                case 'yearly':
                case 'this_year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                    break;
                case 'quarterly':
                    // Last 3 full months including current month
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                    break;
                case 'last_30_days':
                    endDate = new Date();
                    endDate.setHours(23, 59, 59, 999);
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 30);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'this_month':
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;
            }
        }

        const incomeWhere = {
            profile_id,
            transaction_date: {
                [Op.between]: [startDate, endDate],
            },
        };

        const expenseWhere = {
            profile_id,
            transaction_date: {
                [Op.between]: [startDate, endDate],
            },
        };

        const incomes = await models.Income.findAll({
            where: incomeWhere,
            include: [{ model: models.IncomeCategory, as: 'category' }],
        });

        const expenses = await models.Expense.findAll({
            where: expenseWhere,
            include: [{ model: models.ExpenseCategory, as: 'category' }],
        });

        const evolution = {};
        const incomeByCategory = {};
        const incomeByMonthByCategory = {};

        incomes.forEach((inc) => {
            if (!inc.transaction_date) return;
            const month = inc.transaction_date.toISOString().slice(0, 7);
            const categoryName = inc.category ? inc.category.name : 'Uncategorized';
            const amount = Number(inc.amount) || 0;

            if (!evolution[month]) evolution[month] = { income: 0, expense: 0 };
            evolution[month].income += amount;

            if (!incomeByCategory[categoryName]) incomeByCategory[categoryName] = 0;
            incomeByCategory[categoryName] += amount;

            if (!incomeByMonthByCategory[month]) incomeByMonthByCategory[month] = {};
            if (!incomeByMonthByCategory[month][categoryName]) incomeByMonthByCategory[month][categoryName] = 0;
            incomeByMonthByCategory[month][categoryName] += amount;
        });

        const expenseByCategory = {};
        const expenseByMonthByCategory = {};

        expenses.forEach((exp) => {
            if (!exp.transaction_date) return;
            const month = exp.transaction_date.toISOString().slice(0, 7);
            const categoryName = exp.category ? exp.category.name : 'Uncategorized';
            const amount = Number(exp.amount) || 0;

            if (!evolution[month]) evolution[month] = { income: 0, expense: 0 };
            evolution[month].expense += amount;

            if (!expenseByCategory[categoryName]) expenseByCategory[categoryName] = 0;
            expenseByCategory[categoryName] += amount;

            if (!expenseByMonthByCategory[month]) expenseByMonthByCategory[month] = {};
            if (!expenseByMonthByCategory[month][categoryName]) expenseByMonthByCategory[month][categoryName] = 0;
            expenseByMonthByCategory[month][categoryName] += amount;
        });

        return c.json({
            success: true,
            data: {
                evolution,
                incomeByCategory,
                expenseByCategory,
                incomeByMonthByCategory,
                expenseByMonthByCategory,
            },
        });
    } catch (error) {
        console.error('Error generating financial summary:', error);
        return c.json({ success: false, message: 'Failed to generate financial summary' }, 500);
    }
}

module.exports = {
  getMonthlyReport,
  getAnnualReport,
  downloadMonthlyReport,
  downloadAnnualReport,
  getFinancialSummary,
};