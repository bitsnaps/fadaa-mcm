const models = require('../models');
const { Op } = require('sequelize');

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

    const totalIncome = await models.Income.sum('amount', { where: whereClause });
    const totalExpense = await models.Expense.sum('amount', { where: whereClause });

    const totalNetProfit = totalIncome - totalExpense;
    const grossProfitShare = totalNetProfit * (percentage / 100);

    const applicableTaxes = await models.Tax.findAll({ where: { bearer: 'Client' } });
    const totalTaxAmount = applicableTaxes.reduce((sum, tax) => {
      return sum + (grossProfitShare * (tax.rate / 100));
    }, 0);

    const netProfitShare = grossProfitShare - totalTaxAmount;

    calculations[id] = {
      branchNetProfitSelectedPeriod: totalNetProfit,
      yourProfitShareSelectedPeriod: netProfitShare,
    };
  }

  return calculations;
};

const calculateContractualProfits = async (investments) => {
  const calculations = {};

  for (const investment of investments) {
    const { percentage, starting_date, ending_date, profile_id, id } = investment;

    if (!profile_id) {
      calculations[id] = {
        branchNetProfitSelectedPeriod: 0,
        yourProfitShareSelectedPeriod: 0,
      };
      continue;
    }

    const whereClause = {
      profile_id,
      created_at: {
        [Op.between]: [new Date(starting_date), new Date(ending_date)],
      },
    };

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

    const totalNetProfit = servicesRevenue + contractsRevenue;
    const netProfitShare = totalNetProfit * (percentage / 100);

    calculations[id] = {
      branchNetProfitSelectedPeriod: totalNetProfit,
      yourProfitShareSelectedPeriod: netProfitShare,
    };
  }

  return calculations;
};

// A registry of calculation functions based on investment type.
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