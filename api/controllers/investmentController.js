const models = require('../models');
const { Op } = require('sequelize');

const getInvestmentCalculations = async (investment) => {
  const { branch_id, percentage, investment_amount, starting_date, ending_date } = investment;

  // 1. Find relevant financial reports for the branch within the investment period
  const financialReports = await models.FinancialReport.findAll({
    where: {
      // This logic assumes reports are generated for periods that an investment might span.
      // A more complex real-world scenario might require more specific date matching.
      start_date: { [Op.lte]: ending_date },
      end_date: { [Op.gte]: starting_date },
    },
    order: [['end_date', 'DESC']],
  });

  // 2. Calculate total net profit for the period from the reports' content
  const totalNetProfit = financialReports.reduce((sum, report) => {
    // Assuming 'content' has a 'netProfit' field. This needs to be robust.
    return sum + (report.content && report.content.netProfit ? report.content.netProfit : 0);
  }, 0);

  // 3. Calculate the investor's gross share
  const grossProfitShare = totalNetProfit * (percentage / 100);

  // 4. Find applicable taxes where the bearer is the 'Client'
  const applicableTaxes = await models.Tax.findAll({
    where: {
      bearer: 'Client',
    },
  });

  // 5. Calculate the total tax amount to be deducted
  const totalTaxAmount = applicableTaxes.reduce((sum, tax) => {
    return sum + (grossProfitShare * (tax.rate / 100));
  }, 0);

  // 6. Calculate the final net profit share for the investor
  const netProfitShare = grossProfitShare - totalTaxAmount;

  return {
    branchNetProfitSelectedPeriod: totalNetProfit,
    yourProfitShareSelectedPeriod: netProfitShare,
  };
};

module.exports = {
  getInvestmentCalculations,
};