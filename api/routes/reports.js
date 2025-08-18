const { Hono } = require('hono');
const { jsPDF } = require("jspdf");
const autoTable = require('jspdf-autotable').default; // note .default
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { handleRouteError } = require('../lib/errorHandler');
const { getMonthlyReport, getAnnualReport, downloadMonthlyReport, downloadAnnualReport } = require('../controllers/reportController');

const reportsApp = new Hono();

reportsApp.use('*', authMiddleware);

reportsApp.get('/monthly', getMonthlyReport);
reportsApp.get('/annual', getAnnualReport);
reportsApp.post('/monthly/download', downloadMonthlyReport);
reportsApp.post('/annual/download', downloadAnnualReport);

// A helper function to fetch financial data
async function getFinancialData(profile_id, startDate, endDate) {
  const whereClause = {
    profile_id,
    ...(startDate && endDate && {
      transaction_date: {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      },
    }),
  };

  const incomes = await models.Income.findAll({ where: whereClause, raw: true });
  const expenses = await models.Expense.findAll({ where: whereClause, raw: true });

  const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
  const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const netProfit = totalIncome - totalExpense;

  return { incomes, expenses, totalIncome, totalExpense, netProfit };
}

reportsApp.post('/generate', async (c) => {
  try {
    const { type, format, profile_id, startDate, endDate } = await c.req.json();
    const { incomes, expenses, totalIncome, totalExpense, netProfit } = await getFinancialData(profile_id, startDate, endDate);

    const profile = await models.Profile.findByPk(profile_id);
    if (!profile) {
      return c.json({ success: false, message: 'Profile not found' }, 404);
    }

    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(`Financial Report for ${profile.name}`, 14, 16);
      doc.text(`Period: ${startDate} to ${endDate}`, 14, 22);
      
      autoTable(doc, {
        startY: 30,
        head: [['Summary', 'Amount']],
        body: [
          ['Total Income', totalIncome.toFixed(2)],
          ['Total Expense', totalExpense.toFixed(2)],
          ['Net Profit', netProfit.toFixed(2)],
        ],
      });
      
      if (incomes.length > 0) {
        doc.text('Income Details', 14, doc.lastAutoTable.finalY + 10);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 15,
          head: [['Date', 'Description', 'Amount']],
          body: incomes.map(i => [
            i.transaction_date.toISOString().split('T')[0],
            i.description,
            i.amount.toFixed(2),
          ]),
        });
      }
      
      if (expenses.length > 0) {
        doc.text('Expense Details', 14, doc.lastAutoTable.finalY + 10);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 15,
          head: [['Date', 'Description', 'Category', 'Amount']],
          body: expenses.map(e => [
            e.transaction_date.toISOString().split('T')[0],
            e.description,
            e.category,
            e.amount.toFixed(2),
          ]),
        });
      }
      
      const pdfBuffer = doc.output('arraybuffer');
      c.header('Content-Type', 'application/pdf');
      return c.body(pdfBuffer);
    } else if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 20 },
        { header: 'Amount', key: 'amount', width: 15 },
      ];
      summarySheet.addRow({ metric: 'Total Income', amount: totalIncome });
      summarySheet.addRow({ metric: 'Total Expense', amount: totalExpense });
      summarySheet.addRow({ metric: 'Net Profit', amount: netProfit });

      if (incomes.length > 0) {
        const incomeSheet = workbook.addWorksheet('Incomes');
        incomeSheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Amount', key: 'amount', width: 15 },
        ];
        incomes.forEach(i => incomeSheet.addRow({date: i.transaction_date, description: i.description, amount: i.amount}));
      }

      if (expenses.length > 0) {
        const expenseSheet = workbook.addWorksheet('Expenses');
        expenseSheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Amount', key: 'amount', width: 15 },
        ];
        expenses.forEach(e => expenseSheet.addRow({date: e.transaction_date, description: e.description, category: e.category, amount: e.amount}));
      }

      const buffer = await workbook.xlsx.writeBuffer();
      c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return c.body(buffer);
    } else if (format === 'csv') {
        let csv = 'Metric,Amount\n';
        csv += `Total Income,${totalIncome}\n`;
        csv += `Total Expense,${totalExpense}\n`;
        csv += `Net Profit,${netProfit}\n\n`;

        if (incomes.length > 0) {
            csv += 'Income Details\n';
            csv += 'Date,Description,Amount\n';
            incomes.forEach(i => {
                csv += `${i.transaction_date.toISOString().split('T')[0]},"${i.description}",${i.amount}\n`;
            });
            csv += '\n';
        }

        if (expenses.length > 0) {
            csv += 'Expense Details\n';
            csv += 'Date,Description,Category,Amount\n';
            expenses.forEach(e => {
                csv += `${e.transaction_date.toISOString().split('T')[0]},"${e.description}",${e.category},${e.amount}\n`;
            });
        }
        
        c.header('Content-Type', 'text/csv');
        return c.body(csv);
    }

    return c.json({ success: false, message: 'Unsupported format' }, 400);

  } catch (error) {
    return handleRouteError(c, 'Error generating report', error);
  }
});

module.exports = reportsApp;