const models = require('../models');
const { Op } = require('sequelize');
const { calculateContractRevenue } = require('../lib/revenueCalculator');

const calculateComprehensiveProfits = async (investments) => {
  const calculations = {};

  for (const investment of investments) {
    const { branch_id, percentage, starting_date, ending_date, profile_id, id } = investment;

    if (!profile_id) {
      calculations[id] = {
        branchNetProfitSelectedPeriod: 0,
        yourProfitShareSelectedPeriod: 0,
      };
      continue;
    }

    const whereClause = {
      profile_id,
      transaction_date: {
        [Op.gte]: starting_date,
        [Op.lte]: ending_date,
      },
    };

    if (branch_id) {
      whereClause.branch_id = branch_id;
    }

    const serviceWhereClause = {
      profile_id,
      transaction_date: {
        [Op.gte]: starting_date,
        [Op.lte]: ending_date,
      },
    };

    const serviceRevenue = await models.ClientService.sum('price', { where: serviceWhereClause });

    const contractWhere = {
      profile_id,
      [Op.and]: [
        { start_date: { [Op.lte]: new Date(ending_date) } },
        { end_date: { [Op.gte]: new Date(starting_date) } }
      ]
    };
    const contracts = await models.Contract.findAll({ where: contractWhere });
    const contractRevenue = calculateContractRevenue(contracts, investment);

    const incomeAmount = await models.Income.sum('amount', { where: whereClause });

    const totalIncome = incomeAmount + serviceRevenue + contractRevenue;
    const totalExpense = await models.Expense.sum('amount', { where: whereClause });

    const totalNetProfit = totalIncome - totalExpense;
    const grossProfitShare = totalNetProfit * (percentage / 100);

    const applicableTaxes = await models.Tax.findAll({ where: { bearer: 'Client' } });
    const totalTaxAmount = applicableTaxes.reduce((sum, tax) => {
      return sum + (grossProfitShare * (tax.rate / 100));
    }, 0);

    // console.log('totalIncome = [incomeAmount] + [serviceRevenue] + [contractRevenue] =', totalIncome);
    // console.log('totalExpense = ', totalExpense);
    // console.log(`totalNetProfit = [totalIncome] - [totalExpense] = ${totalIncome} - ${totalExpense} =`, totalNetProfit);
    // console.log('totalTaxAmount = ', totalTaxAmount);
    // console.log(`grossProfitShare = [totalNetProfit] * [percentage] = ${totalNetProfit} * ${percentage}% = `, grossProfitShare);
    
    const netProfitShare = grossProfitShare - totalTaxAmount;

    calculations[id] = {
      branchNetProfitSelectedPeriod: totalNetProfit,
      yourProfitShareSelectedPeriod: netProfitShare,
    };
  }

  console.log('\n**** calculateComprehensiveProfits:\n');  
  Object.keys(calculations).forEach( key => {
    console.log(`calculations[${key}]:\n`);
    console.log(`[branchNetProfitSelectedPeriod] = [totalIncome] - [totalExpense] = `, calculations[key]['branchNetProfitSelectedPeriod']);
    console.log(`[yourProfitShareSelectedPeriod] = [grossProfitShare] - [totalTaxAmount] = `, calculations[key]['yourProfitShareSelectedPeriod']);
  });

  return calculations;
};

const calculationStrategies = {
  Comprehensive: calculateComprehensiveProfits,
  Contractual: calculateComprehensiveProfits,
};

const getInvestmentCalculations = async (investments) => {
  // Group investments by type
  const groupedInvestments = investments.reduce((acc, investment) => {
    const { type } = investment;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(investment);
    return acc;
  }, {});

  let allCalculations = {};

  // Dynamically call the calculation function for each type
  for (const type in groupedInvestments) {
    if (calculationStrategies[type]) {
      const group = groupedInvestments[type];
      const calculations = await calculationStrategies[type](group);
      allCalculations = { ...allCalculations, ...calculations };
    }
  }

  return allCalculations;
};

module.exports = {
  getInvestmentCalculations,
};