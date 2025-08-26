const calculateContractRevenue = (contracts, investment) => {
  let totalContractRevenue = 0;

  for (const contract of contracts) {
    const { start_date, end_date, monthly_rate } = contract;
    const investmentStart = new Date(investment.starting_date);
    const investmentEnd = new Date(investment.ending_date);

    let current = new Date(start_date);
    while (current <= new Date(end_date)) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      if (monthStart <= investmentEnd && monthEnd >= investmentStart) {
        totalContractRevenue += parseFloat(monthly_rate);
      }

      current.setMonth(current.getMonth() + 1);
    }
  }

  return totalContractRevenue;
};

module.exports = {
  calculateContractRevenue,
};