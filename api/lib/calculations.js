const { Op } = require('sequelize');
const models = require('../models');

// --- Pure Calculation Functions ---

function calculateContractRevenueForPeriod(contracts, startDate, endDate) {
  let totalRevenue = 0;

  for (const contract of contracts) {
    const contractStart = new Date(contract.start_date);
    const contractEnd = new Date(contract.end_date);

    // For investment calculations, ignore contracts that started before the investment period.
    if (contractStart < startDate) {
      continue;
    }
    
    // Iterate through each month of the contract
    let current = new Date(contractStart);
    while (current < contractEnd) {
      // Check if the current month is within the specified period
      if (current >= startDate && current <= endDate) {
        totalRevenue += parseFloat(contract.monthly_rate);
        
      }
      current.setMonth(current.getMonth() + 1);
    }
  }

  return totalRevenue;
}

function calculateTotalRevenue(incomeRevenue, serviceRevenue, contractsRevenue) {
  return (incomeRevenue || 0) + (serviceRevenue || 0) + (contractsRevenue || 0);
}

function calculateProfit(totalRevenue, expenses) {
  return totalRevenue - (expenses || 0);
}

function calculateOccupancyRate(occupiedOffices, totalOffices) {
  return totalOffices > 0 ? (occupiedOffices / totalOffices) * 100 : 0;
}


// --- Data Fetching Function ---

async function getAnnualReportData(filters) {
  const { year, branchId, profile_id } = filters;
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  const where = {
    profile_id,
    transaction_date: { [Op.between]: [startDate, endDate] },
  };
  if (branchId) where.branch_id = branchId;

  const creationWhere = { created_at: { [Op.between]: [startDate, endDate] } };
  
  const contractWhere = {
    profile_id,
    [Op.and]: [{ start_date: { [Op.lte]: endDate } }, { end_date: { [Op.gte]: startDate } }]
  };
  const includeOptions = [];
  if (branchId) {
    includeOptions.push({
      model: models.Office,
      where: { branch_id: branchId },
      required: true,
    });
  }

  const contractsSignedWhere = { ...creationWhere };
  
  const occupiedOfficesWhere = {
    profile_id,
    [Op.and]: [{ start_date: { [Op.lte]: endDate } }, { end_date: { [Op.gte]: startDate } }]
  };
  const totalOfficesWhere = {};
  if (branchId) totalOfficesWhere.branch_id = branchId;

  // Fetch all data in parallel
  const [
    incomeRevenue,
    serviceRevenue,
    expenses,
    contracts,
    newClients,
    contractsSigned,
    occupiedOffices,
    totalOffices
  ] = await Promise.all([
    models.Income.sum('amount', { where }),
    calculateServiceRevenueExlcTax({ startDate, endDate, profile_id }),
    models.Expense.sum('amount', { where }),
    models.Contract.findAll({ where: contractWhere, include: includeOptions }),
    models.Client.count({ where: creationWhere }),
    models.Contract.count({ where: contractsSignedWhere, include: includeOptions.length ? includeOptions : undefined }),
    models.Contract.count({ where: occupiedOfficesWhere, include: includeOptions.length ? includeOptions : undefined, distinct: true, col: 'office_id' }),
    models.Office.count({ where: totalOfficesWhere })
  ]);

  return {
    incomeRevenue,
    serviceRevenue,
    expenses,
    contracts,
    newClients,
    contractsSigned,
    occupiedOffices,
    totalOffices,
    startDate,
    endDate
  };
}


// --- Main Orchestration Function ---

async function calculateAnnualReportMetrics(filters) {
  const {
    incomeRevenue,
    serviceRevenue,
    expenses,
    contracts,
    newClients,
    contractsSigned,
    occupiedOffices,
    totalOffices,
    startDate,
    endDate
  } = await getAnnualReportData(filters);

  const contractsRevenue = calculateContractRevenueForPeriod(contracts, startDate, endDate);
  const totalRevenue = calculateTotalRevenue(incomeRevenue, serviceRevenue, contractsRevenue);
  const profit = calculateProfit(totalRevenue, expenses);
  const occupancyRate = calculateOccupancyRate(occupiedOffices, totalOffices);

  return {
    revenue: totalRevenue,
    expenses: expenses || 0,
    profit,
    newClients,
    contractsSigned,
    occupancyRate,
  };
}


// --- Other existing functions ---

async function calculateServiceRevenueExlcTax({ startDate, endDate, profile_id, withTaxes = false }) {
    const where = {};
    if (startDate && endDate) {
        where.transaction_date = { [Op.between]: [startDate, endDate] };
    }
    if (profile_id) {
        where.profile_id = profile_id;
    }

    const clientServices = await models.ClientService.findAll({
        where,
        include: [{ model: models.Tax, attributes: ['rate', 'bearer'] }]
    });

    return calculateServiceRevenue({ clientServices, withTaxes });
}

function calculateServiceRevenue({ clientServices, withTaxes = false }) {
    let totalRevenue = 0;
    clientServices.forEach(service => {
        let serviceRevenue = parseFloat(service.price) || 0;
        if (withTaxes && service.Tax && service.Tax.bearer === 'Company') {
            const taxAmount = serviceRevenue * (parseFloat(service.Tax.rate) / 100);
            serviceRevenue -= taxAmount;
        }
        totalRevenue += serviceRevenue;
    });
    return totalRevenue;
}

// ... keep other functions like calculateMonthlyReportMetrics if they exist ...
async function calculateMonthlyReportMetrics(filters) {
  const { year, month, clientId, branchId, profile_id } = filters;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const where = {
    profile_id,
    transaction_date: {
      [Op.between]: [startDate, endDate],
    },
  };

  const creationWhere = {
    profile_id,
    created_at: {
      [Op.between]: [startDate, endDate],
    },
  }

  if (branchId) {
    where.branch_id = branchId;
  }
  
  if (clientId) {
    where.client_id = clientId;
    creationWhere.id = clientId;
  }

  // Revenue Calculation
  const incomeWhere = { ...where };
  delete incomeWhere.client_id;
  const incomeRevenue = await models.Income.sum('amount', { where: incomeWhere });

  const serviceRevenue = await calculateServiceRevenueExlcTax({
    startDate,
    endDate,
    profile_id,
  });

  const contractWhere = {
    profile_id,
    [Op.and]: [
      { start_date: { [Op.lte]: endDate } },
      { end_date: { [Op.gte]: startDate } }
    ]
  };
  if (clientId) contractWhere.client_id = clientId;

  const includeOptions = [];
  if (branchId) {
    includeOptions.push({
      model: models.Office,
      where: { branch_id: branchId },
      required: true,
    });
  }
  
  const contracts = await models.Contract.findAll({
    where: contractWhere,
    include: includeOptions,
  });
  let contractsRevenue = 0;
  contracts.forEach(contract => {
    contractsRevenue += parseFloat(contract.monthly_rate);
  });

  const totalRevenue = (incomeRevenue || 0) + (serviceRevenue || 0) + (contractsRevenue || 0);

  // New Clients
  const newClientsWhere = {
    created_at: {
      [Op.between]: [startDate, endDate],
    },
  };
  if (clientId) newClientsWhere.id = clientId;
  const newClients = await models.Client.count({ where: newClientsWhere });

  // Contracts Signed
  const contractsSignedWhere = { ...creationWhere };
  let contractsSigned;
  if (branchId) {
    contractsSigned = await models.Contract.count({
      where: contractsSignedWhere,
      include: [{
        model: models.Office,
        where: { branch_id: branchId },
        required: true
      }]
    });
  } else {
    contractsSigned = await models.Contract.count({ where: contractsSignedWhere });
  }

  // Occupancy Rate
  const occupiedOfficesWhere = {
    profile_id,
    [Op.and]: [
      { start_date: { [Op.lte]: endDate } },
      { end_date: { [Op.gte]: startDate } }
    ]
  };
  const occupiedOfficesInclude = [];
  if (branchId) {
    occupiedOfficesInclude.push({
      model: models.Office,
      where: { branch_id: branchId },
      required: true,
    });
  }

  const occupiedOffices = await models.Contract.count({
    where: occupiedOfficesWhere,
    include: occupiedOfficesInclude,
    distinct: true,
    col: 'office_id'
  });

  const totalOfficesWhere = {};
  if (branchId) totalOfficesWhere.branch_id = branchId;
  const totalOffices = await models.Office.count({ where: totalOfficesWhere });
  const occupancyRate = totalOffices > 0 ? (occupiedOffices / totalOffices) * 100 : 0;

  return {
    revenue: totalRevenue,
    newClients,
    contractsSigned,
    occupancyRate,
  };
}


module.exports = {
  calculateContractRevenueForPeriod,
  calculateTotalRevenue,
  calculateProfit,
  calculateOccupancyRate,
  getAnnualReportData,
  calculateAnnualReportMetrics,
  calculateServiceRevenueExlcTax,
  calculateServiceRevenue,
  calculateMonthlyReportMetrics,
};
