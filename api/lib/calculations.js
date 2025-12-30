const { Op } = require('sequelize');
const models = require('../models');
const { getContractDurationInMonths } = require('./dateUtils');

// --- Pure Calculation Functions ---

function calculateContractRevenueForPeriod(contracts, startDate, endDate, options = {}) {
  if (!startDate || isNaN(new Date(startDate).getTime())) startDate = new Date(0);
  if (!endDate || isNaN(new Date(endDate).getTime())) endDate = new Date();

  const periodStart = new Date(startDate);
  const periodEnd = new Date(endDate);
  let totalRevenue = 0;

  for (const contract of contracts) {
    const contractStart = new Date(contract.start_date);
    const contractEnd = new Date(contract.end_date);

    if (isNaN(contractStart.getTime()) || isNaN(contractEnd.getTime())) {
      continue;
    }

    // For specific calculations (like investment ROI), we might want to ignore contracts
    // that started before the period began.
    if (options.excludePreExisting && contractStart < periodStart) {
        continue;
    }

    // Calculate net monthly rate if taxes are present and borne by company
    let netMonthlyRate = parseFloat(contract.monthly_rate) || 0;
    if (contract.taxes && Array.isArray(contract.taxes)) {
      contract.taxes.forEach(tax => {
        if (tax.bearer === 'Company') {
          const taxAmount = netMonthlyRate * (parseFloat(tax.rate) / 100);
          netMonthlyRate -= taxAmount;
        }
      });
    }

    // Calculate total contract revenue based on duration in months
    const durationInMonths = getContractDurationInMonths(contractStart, contractEnd);
    const totalContractRevenue = netMonthlyRate * durationInMonths;

    // Calculate daily rate based on total contract duration in days
    const totalContractDurationMs = contractEnd - contractStart;
    const totalContractDays = totalContractDurationMs / (1000 * 60 * 60 * 24);

    if (totalContractDays <= 0) continue;

    const dailyRevenue = totalContractRevenue / totalContractDays;

    // Calculate overlap between contract and period
    const overlapStart = new Date(Math.max(contractStart, periodStart));
    const overlapEnd = new Date(Math.min(contractEnd, periodEnd));

    const overlapMs = overlapEnd - overlapStart;

    if (overlapMs > 0) {
      const overlapDays = overlapMs / (1000 * 60 * 60 * 24);
      totalRevenue += dailyRevenue * overlapDays;
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
  const includeOptions = [
    { model: models.Tax, as: 'taxes', through: { attributes: [] } }
  ];
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

async function calculateServiceRevenueExlcTax({ startDate, endDate, profile_id, withTaxes = true }) {
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

function calculateServiceRevenue({ clientServices, withTaxes = true }) {
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

  const includeOptions = [
    { model: models.Tax, as: 'taxes', through: { attributes: [] } }
  ];
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
