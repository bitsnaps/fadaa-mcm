const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');
const { handleRouteError } = require('../lib/errorHandler');

const financialsApp = new Hono();

financialsApp.use('*', authMiddleware);

financialsApp.get('/revenue-summary', async (c) => {
    try {
        const { startDate, endDate, profile_id } = c.req.query();

        const whereClause = {};
        if (startDate && endDate) {
            whereClause.created_at = {
                [Op.between]: [new Date(startDate), new Date(endDate)],
            };
        }

        if (profile_id) {
            whereClause.profile_id = profile_id;
        }

        // 1. Calculate revenue from Client Services
        const clientServices = await models.ClientService.findAll({
            where: whereClause,
            include: [{ model: models.Tax }]
        });

        let servicesRevenue = 0;
        clientServices.forEach(service => {
            let serviceRevenue = parseFloat(service.price);
            if (service.Tax && service.Tax.bearer === 'Company') {
                const taxAmount = serviceRevenue * (parseFloat(service.Tax.rate) / 100);
                serviceRevenue -= taxAmount;
            }
            servicesRevenue += serviceRevenue;
        });

        // 2. Calculate revenue from Contracts
        const contracts = await models.Contract.findAll({
            where: whereClause,
            include: [{ model: models.Tax, as: 'taxes', through: { model: models.ContractTax } }]
        });

        let contractsRevenue = 0;
        contracts.forEach(contract => {
            let contractRevenue = parseFloat(contract.monthly_rate);
            if (contract.Taxes) {
                contract.Taxes.forEach(tax => {
                    if (tax.bearer === 'Company') {
                        const taxAmount = contractRevenue * (parseFloat(tax.rate) / 100);
                        contractRevenue -= taxAmount;
                    }
                });
            }
            contractsRevenue += contractRevenue;
        });

        // 3. Calculate revenue from other Incomes
        const incomeWhere = { transaction_date: whereClause.created_at };
        if (profile_id) {
            incomeWhere.profile_id = profile_id;
        }
        const incomes = await models.Income.findAll({ where: incomeWhere });
        const incomeRevenue = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);

        // 4. Calculate total Expenses
        const expenseWhere = { transaction_date: whereClause.created_at };
        if (profile_id) {
            expenseWhere.profile_id = profile_id;
        }
        const expenses = await models.Expense.findAll({ where: expenseWhere });
        const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

        // 5. Calculate Net Revenue and Net Profit
        const netRevenue = servicesRevenue + contractsRevenue + incomeRevenue;
        const netProfit = netRevenue - totalExpense;


        return c.json({
            success: true,
            data: {
                netRevenue,
                netProfit,
                totalExpense,
                servicesRevenue,
                contractsRevenue,
                incomeRevenue
            }
        });

    } catch (error) {
        return handleRouteError(c, 'Error fetching revenue summary', error);
    }
});

// Revenue and profit time series by month for a given year
financialsApp.get('/revenue-series', async (c) => {
  try {
    const { profile_id, year } = c.req.query();
    const yearNum = parseInt(year, 10) || new Date().getFullYear();

    const labels = Array.from({ length: 12 }, (_, i) => i); // 0..11 month indexes
    const netRevenue = [];
    const netProfit = [];

    for (let month = 0; month < 12; month++) {
      const start = new Date(yearNum, month, 1);
      const end = new Date(yearNum, month + 1, 0, 23, 59, 59, 999);

      const whereCreated = { created_at: { [Op.between]: [start, end] } };
      const whereTrans = { transaction_date: { [Op.between]: [start, end] } };
      if (profile_id) {
        whereCreated.profile_id = profile_id;
        whereTrans.profile_id = profile_id;
      }

      // Client Services
      const clientServices = await models.ClientService.findAll({ where: whereCreated, include: [{ model: models.Tax }] });
      let servicesRevenue = 0;
      clientServices.forEach((service) => {
        let serviceRevenue = parseFloat(service.price);
        if (service.Tax && service.Tax.bearer === 'Company') {
          const taxAmount = serviceRevenue * (parseFloat(service.Tax.rate) / 100);
          serviceRevenue -= taxAmount;
        }
        servicesRevenue += serviceRevenue;
      });

      // Contracts
      const contracts = await models.Contract.findAll({ where: whereCreated, include: [{ model: models.Tax, as: 'taxes', through: { model: models.ContractTax } }] });
      let contractsRevenue = 0;
      contracts.forEach((contract) => {
        let contractRevenue = parseFloat(contract.monthly_rate);
        if (contract.Taxes) {
          contract.Taxes.forEach((tax) => {
            if (tax.bearer === 'Company') {
              const taxAmount = contractRevenue * (parseFloat(tax.rate) / 100);
              contractRevenue -= taxAmount;
            }
          });
        }
        contractsRevenue += contractRevenue;
      });

      // Incomes
      const incomes = await models.Income.findAll({ where: whereTrans });
      const incomeRevenue = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);

      // Expenses
      const expenses = await models.Expense.findAll({ where: whereTrans });
      const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

      const monthNetRevenue = servicesRevenue + contractsRevenue + incomeRevenue;
      const monthNetProfit = monthNetRevenue - totalExpense;
      netRevenue.push(monthNetRevenue);
      netProfit.push(monthNetProfit);
    }

    return c.json({ success: true, data: { labels, netRevenue, netProfit } });
  } catch (error) {
    return handleRouteError(c, 'Error fetching revenue series', error);
  }
});


module.exports = financialsApp;