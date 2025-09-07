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

module.exports = {
  getMonthlyReport,
  getAnnualReport,
  downloadMonthlyReport,
  downloadAnnualReport,
};