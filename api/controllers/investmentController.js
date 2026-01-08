const models = require('../models');
const { Op } = require('sequelize');
const { calculateContractRevenueForPeriod, calculateServiceRevenue } = require('../lib/calculations');

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

    // Fix: Filter services by branch via Contract -> Office -> Branch
    const serviceInclude = [];
    if (branch_id) {
      serviceInclude.push({
        model: models.Contract,
        required: true,
        include: [{
          model: models.Office,
          where: { branch_id: branch_id },
          required: true
        }]
      });
    }

    const serviceWhereClause = {
      profile_id,
      transaction_date: {
        [Op.gte]: starting_date,
        [Op.lte]: ending_date,
      },
    };

    // Include Tax model to calculate net revenue
    const serviceIncludeWithTax = [
      ...serviceInclude,
      { model: models.Tax, attributes: ['rate', 'bearer'] }
    ];

    const clientServices = await models.ClientService.findAll({
      where: serviceWhereClause,
      include: serviceIncludeWithTax
    });

    const serviceRevenue = calculateServiceRevenue({ clientServices, withTaxes: true });

    const contractWhere = {
      profile_id,
      [Op.and]: [
        { start_date: { [Op.lte]: new Date(ending_date) } },
        { end_date: { [Op.gte]: new Date(starting_date) } }
      ]
    };

    // Fix: Filter contracts by branch via Office -> Branch
    const contractInclude = [];
    if (branch_id) {
      contractInclude.push({
        model: models.Office,
        where: { branch_id: branch_id },
        required: true
      });
    }
    
    // Include taxes for contracts
    contractInclude.push({
      model: models.Tax,
      as: 'taxes',
      // Removed where: { bearer: 'Client' } to include all taxes (Company taxes need to be deducted from revenue)
      required: false
    });

    const contracts = await models.Contract.findAll({ 
      where: contractWhere,
      include: contractInclude 
    });
    const contractRevenue = calculateContractRevenueForPeriod(contracts, new Date(investment.starting_date), new Date(investment.ending_date), { excludePreExisting: true }) || 0;

    const incomeAmount = await models.Income.sum('amount', { where: whereClause }) || 0;

    const totalIncome = (parseFloat(incomeAmount) || 0) + (parseFloat(serviceRevenue) || 0) + (parseFloat(contractRevenue) || 0);
    const totalExpense = await models.Expense.sum('amount', { where: whereClause }) || 0;

    const totalNetProfit = totalIncome - (parseFloat(totalExpense) || 0);
    const grossProfitShare = totalNetProfit * (parseFloat(percentage) / 100);

    // Extract unique applicable taxes from the contracts
    const uniqueTaxesMap = new Map();
    contracts.forEach(contract => {
      if (contract.taxes) {
        contract.taxes.forEach(tax => {
          if (!uniqueTaxesMap.has(tax.id)) {
            uniqueTaxesMap.set(tax.id, tax);
          }
        });
      }
    });
    // Filter out Company taxes from the "Taxes" deduction step because they are already deducted from the Revenue
    // Only taxes that are specifically applied to the Share/Dividend should be here,
    // OR if there are Client taxes that for some reason reduce the share (unlikely).
    // For now, we exclude Company taxes to prevent double deduction.
    const applicableTaxes = Array.from(uniqueTaxesMap.values()).filter(t => t.bearer !== 'Company');

    const appliedTaxes = applicableTaxes.map(tax => ({
      name: tax.name,
      rate: parseFloat(tax.rate),
      amount: grossProfitShare * (parseFloat(tax.rate) / 100)
    }));
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);

    // console.log('\n**** calculateComprehensiveProfits (for investment.id =', investment.id, '):\n');  
    // console.log('incomeAmount = ', incomeAmount);
    // console.log('serviceRevenue = ', serviceRevenue);
    // console.log('contractRevenue = ', contractRevenue);
    // console.log('totalIncome = [incomeAmount] + [serviceRevenue] + [contractRevenue] =', totalIncome);
    // console.log('totalExpense = ', totalExpense);
    // console.log(`totalNetProfit = [totalIncome] - [totalExpense] = ${totalIncome} - ${totalExpense} =`, totalNetProfit);
    // console.log('totalTaxAmount = ', totalTaxAmount);
    // console.log(`grossProfitShare = [totalNetProfit] * [percentage] = ${totalNetProfit} * ${percentage}% = `, grossProfitShare);
    
    const netProfitShare = grossProfitShare - totalTaxAmount;

    calculations[id] = {
      branchNetProfitSelectedPeriod: totalNetProfit,
      yourProfitShareSelectedPeriod: netProfitShare,
      details: {
        incomeAmount: parseFloat(incomeAmount) || 0,
        serviceRevenue: parseFloat(serviceRevenue) || 0,
        contractRevenue: parseFloat(contractRevenue) || 0,
        totalIncome: parseFloat(totalIncome) || 0,
        totalExpense: parseFloat(totalExpense) || 0,
        totalNetProfit: parseFloat(totalNetProfit) || 0,
        grossProfitShare: parseFloat(grossProfitShare) || 0,
        totalTaxAmount: parseFloat(totalTaxAmount) || 0,
        appliedTaxes: appliedTaxes,
        netProfitShare: parseFloat(netProfitShare) || 0
      }
    };
  }

  // console.log('\n**** calculateComprehensiveProfits (global):\n');  
  // Object.keys(calculations).forEach( key => {
  //   console.log(`calculations[${key}]:\n`);
  //   console.log(`[branchNetProfitSelectedPeriod] = [totalIncome] - [totalExpense] = `, calculations[key]['branchNetProfitSelectedPeriod']);
  //   console.log(`[yourProfitShareSelectedPeriod] = [grossProfitShare] - [totalTaxAmount] = `, calculations[key]['yourProfitShareSelectedPeriod']);
  // });

  return calculations;
};

const calculateContractualProfits = async (investments) => {
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

    const contractWhere = {
      profile_id,
      [Op.and]: [
        { start_date: { [Op.lte]: new Date(ending_date) } },
        { end_date: { [Op.gte]: new Date(starting_date) } }
      ]
    };

    // Fix: Filter contracts by branch via Office -> Branch
    const contractInclude = [];
    if (branch_id) {
      contractInclude.push({
        model: models.Office,
        where: { branch_id: branch_id },
        required: true
      });
    }

    // Include taxes for contracts
    contractInclude.push({
      model: models.Tax,
      as: 'taxes',
      // Removed where: { bearer: 'Client' } to include all taxes
      required: false
    });

    const contracts = await models.Contract.findAll({ 
      where: contractWhere,
      include: contractInclude
    });
    const contractRevenue = calculateContractRevenueForPeriod(contracts, new Date(investment.starting_date), new Date(investment.ending_date), { excludePreExisting: true }) || 0;

    const totalNetProfit = parseFloat(contractRevenue) || 0; // For contractual, profit is just the revenue
    const grossProfitShare = totalNetProfit * (parseFloat(percentage) / 100);

    // Extract unique applicable taxes from the contracts
    const uniqueTaxesMap = new Map();
    contracts.forEach(contract => {
      if (contract.taxes) {
        contract.taxes.forEach(tax => {
          if (!uniqueTaxesMap.has(tax.id)) {
            uniqueTaxesMap.set(tax.id, tax);
          }
        });
      }
    });
    // Filter out Company taxes from "Taxes" deduction to avoid double counting (already deducted from Revenue)
    const applicableTaxes = Array.from(uniqueTaxesMap.values()).filter(t => t.bearer !== 'Company');

    const appliedTaxes = applicableTaxes.map(tax => ({
      name: tax.name,
      rate: parseFloat(tax.rate || 0),
      amount: grossProfitShare * (parseFloat(tax.rate || 0) / 100)
    }));
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);

    const netProfitShare = grossProfitShare - totalTaxAmount;

    calculations[id] = {
      branchNetProfitSelectedPeriod: totalNetProfit,
      yourProfitShareSelectedPeriod: netProfitShare,
      details: {
        contractRevenue: parseFloat(contractRevenue) || 0,
        totalNetProfit: parseFloat(totalNetProfit) || 0,
        grossProfitShare: parseFloat(grossProfitShare) || 0,
        totalTaxAmount: parseFloat(totalTaxAmount) || 0,
        appliedTaxes: appliedTaxes,
        netProfitShare: parseFloat(netProfitShare) || 0
      }
    };
  }

  return calculations;
};

const calculationStrategies = {
  Comprehensive: calculateComprehensiveProfits,
  Contractual: calculateContractualProfits,
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