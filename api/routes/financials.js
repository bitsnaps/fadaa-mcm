const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');
const { handleRouteError } = require('../lib/errorHandler');
const { calculateServiceRevenueExlcTax, calculateContractRevenueForPeriod, calculateCompanyBalance } = require('../lib/calculations');

const financialsApp = new Hono();

financialsApp.use('*', authMiddleware);

financialsApp.get('/revenue-summary', async (c) => {
    try {
        const { startDate, endDate, profile_id } = c.req.query();

        // Normalize provided dates to cover entire days
        let start = null;
        let end = null;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            // Ensure inclusive range across whole days
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        }

        // 1. Calculate revenue from Client Services
        const servicesRevenue = await calculateServiceRevenueExlcTax({
            startDate: start,
            endDate: end,
            profile_id,
            withTaxes: false // Per original logic, revenue is price before tax adjustment
        });

        // 2. Calculate revenue from Contracts (filter by explicit contract dates, not created_at)
        const contractWhere = {};
        if (profile_id) {
            contractWhere.profile_id = profile_id;
        }
        if (start && end) {
            // Count contracts active at any point within the range (overlap)
            contractWhere[Op.and] = [
                { start_date: { [Op.lte]: end } },
                { end_date: { [Op.gte]: start } }
            ];
        }
        const contracts = await models.Contract.findAll({
            where: contractWhere,
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

        // 3. Calculate revenue from other Incomes (filter by explicit transaction_date)
        const incomeWhere = {};
        if (start && end) {
            incomeWhere.transaction_date = { [Op.between]: [start, end] };
        }
        if (profile_id) {
            incomeWhere.profile_id = profile_id;
        }
        const incomes = await models.Income.findAll({ where: incomeWhere });
        const incomeRevenue = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);

        // 4. Calculate total Expenses (filter by explicit transaction_date)
        const expenseWhere = {};
        if (start && end) {
            expenseWhere.transaction_date = { [Op.between]: [start, end] };
        }
        if (profile_id) {
            expenseWhere.profile_id = profile_id;
        }
        const expenses = await models.Expense.findAll({ where: expenseWhere });
        const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

        // 5. Calculate Net Revenue and Net Profit
        const netRevenue = servicesRevenue + contractsRevenue + incomeRevenue;
        const netProfit = netRevenue - totalExpense;

        // --- Calculate Company Balance (Lifetime Accumulation) ---
        // Balance = (Total Revenue + Total Investments) - (Total Expenses + Total Paid Withdrawals)
        
        const balanceEndDate = end || new Date();
        
        // A. Lifetime Services Revenue
        const lifetimeServicesRevenue = await calculateServiceRevenueExlcTax({
            startDate: new Date(0), // From beginning
            endDate: balanceEndDate,
            profile_id,
            withTaxes: false
        });

        // B. Lifetime Contracts Revenue
        const lifetimeContractWhere = {
            start_date: { [Op.lte]: balanceEndDate }
        };
        if (profile_id) lifetimeContractWhere.profile_id = profile_id;
        
        const lifetimeContracts = await models.Contract.findAll({
            where: lifetimeContractWhere,
            include: [{ model: models.Tax, as: 'taxes', through: { model: models.ContractTax } }]
        });
        const lifetimeContractsRevenue = calculateContractRevenueForPeriod(lifetimeContracts, new Date(0), balanceEndDate);

        // C. Lifetime Incomes
        const lifetimeIncomeWhere = {
            transaction_date: { [Op.lte]: balanceEndDate }
        };
        if (profile_id) lifetimeIncomeWhere.profile_id = profile_id;
        const lifetimeIncomes = await models.Income.sum('amount', { where: lifetimeIncomeWhere }) || 0;

        // D. Lifetime Expenses
        const lifetimeExpenseWhere = {
            transaction_date: { [Op.lte]: balanceEndDate }
        };
        if (profile_id) lifetimeExpenseWhere.profile_id = profile_id;
        const lifetimeExpenses = await models.Expense.sum('amount', { where: lifetimeExpenseWhere }) || 0;

        // E. Lifetime Investments
        const lifetimeInvestmentWhere = {
            created_at: { [Op.lte]: balanceEndDate }
        };
        if (profile_id) lifetimeInvestmentWhere.profile_id = profile_id;
        const lifetimeInvestments = await models.Investment.sum('investment_amount', { where: lifetimeInvestmentWhere }) || 0;

        // F. Lifetime Withdrawals (Paid only)
        const lifetimeWithdrawalWhere = {
            status: 'paid',
            paid_at: { [Op.lte]: balanceEndDate }
        };
        if (profile_id) lifetimeWithdrawalWhere.profile_id = profile_id;
        const lifetimeWithdrawals = await models.Withdrawal.sum('amount', { where: lifetimeWithdrawalWhere }) || 0;

        const companyBalance = calculateCompanyBalance({
            lifetimeServicesRevenue,
            lifetimeContractsRevenue,
            lifetimeIncomes,
            lifetimeInvestments,
            lifetimeExpenses,
            lifetimeWithdrawals
        });

        // console.log('------------------------');
        // // For debugging purposes
        // console.log(`Net Revenue: ${netRevenue}`);
        // console.log(`Net Profit: ${netProfit}`);
        // console.log(`Total Expense: ${totalExpense}`);
        // console.log(`Services Revenue: ${servicesRevenue}`);
        // console.log(`Contracts Revenue: ${contractsRevenue}`);
        // console.log(`Income Revenue: ${incomeRevenue}`);
        // console.log('------------------------');

        return c.json({
            success: true,
            data: {
                netRevenue,
                netProfit,
                companyBalance,
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
    const { profile_id, startDate, endDate } = c.req.query();

    const start = new Date(startDate);
    const end = new Date(endDate);

    const labels = [];
    const netRevenue = [];
    const netProfit = [];
    const totalExpense = [];
    
    let current = new Date(start);
    while (current <= end) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);

      const whereCreated = { created_at: { [Op.between]: [monthStart, monthEnd] } };
      const whereTrans = { transaction_date: { [Op.between]: [monthStart, monthEnd] } };
      if (profile_id) {
        whereCreated.profile_id = profile_id;
        whereTrans.profile_id = profile_id;
      }

      // Client Services
      const servicesRevenue = await calculateServiceRevenueExlcTax({
          startDate: monthStart,
          endDate: monthEnd,
          profile_id,
          withTaxes: false
      });

      // Contracts (active within month by start/end date overlap)
      const contractWhere = {
        [Op.and]: [
          { start_date: { [Op.lte]: monthEnd } },
          { end_date: { [Op.gte]: monthStart } }
        ]
      };
      if (profile_id) contractWhere.profile_id = profile_id;
      const contracts = await models.Contract.findAll({ where: contractWhere, include: [{ model: models.Tax, as: 'taxes', through: { model: models.ContractTax } }] });
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
      const monthTotalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

      const monthNetRevenue = servicesRevenue + contractsRevenue + incomeRevenue;
      const monthNetProfit = monthNetRevenue - monthTotalExpense;
      
      netRevenue.push(monthNetRevenue);
      netProfit.push(monthNetProfit);
      totalExpense.push(monthTotalExpense);

      labels.push(monthStart);
      current.setMonth(current.getMonth() + 1);
    }

    return c.json({ success: true, data: { labels, netRevenue, netProfit, totalExpense } });
  } catch (error) {
    return handleRouteError(c, 'Error fetching revenue series', error);
  }
});


module.exports = financialsApp;