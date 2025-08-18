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

module.exports = financialsApp;