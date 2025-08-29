const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, adminOrInvestorMiddleware } = require('../middleware/auth');
const { getInvestmentCalculations } = require('../controllers/investmentController');
const { handleRouteError } = require('../lib/errorHandler');

const Op = models.Sequelize.Op;

const investorApp = new Hono();

// Protect all endpoints: authenticated investors only
investorApp.use('*', authMiddleware, adminOrInvestorMiddleware);

// Helper to compute accrued profit share to date for an investment
async function computeAccruedProfitShareToDate(investmentInstance) {
  const inv = investmentInstance.toJSON ? investmentInstance.toJSON() : investmentInstance;
  const calcInput = { ...inv, ending_date: new Date() };
  // getInvestmentCalculations expects an array and returns a map keyed by investment id
  const calculations = await getInvestmentCalculations([calcInput]);
  return calculations?.[inv.id]?.yourProfitShareSelectedPeriod || 0;
}

// Helper to sum committed withdrawals (pending + approved + paid)
async function sumCommittedWithdrawals(investmentId) {
  const sum = await models.Withdrawal.sum('amount', {
    where: {
      investment_id: investmentId,
      status: { [Op.in]: ['pending', 'approved', 'paid'] },
    },
  });
  return sum || 0;
}

// GET /investor/investments - current investor's investments with accrued share and available
investorApp.get('/investments', async (c) => {
  try {
    const user = c.get('user');
    const { profile_id } = c.req.query();
    const where = { investor_id: user.id };
    if (profile_id) where.profile_id = profile_id;

    const investments = await models.Investment.findAll({
      where,
      include: [{ model: models.Branch }, { model: models.Profile }],
      order: [['created_at', 'DESC']],
    });

    const data = await Promise.all(
      investments.map(async (inv) => {
        const accruedShare = await computeAccruedProfitShareToDate(inv);
        const committed = await sumCommittedWithdrawals(inv.id);
        const available = Math.max(accruedShare - committed, 0);
        const calcInput = { ...(inv.toJSON ? inv.toJSON() : inv), ending_date: new Date() };
        const calcMap = await getInvestmentCalculations([calcInput]);
        const calc = calcMap?.[inv.id] || {};

        return {
          ...inv.toJSON(),
          yourProfitShareSelectedPeriod: accruedShare,
          branchNetProfitSelectedPeriod: calc.branchNetProfitSelectedPeriod || 0,
          withdrawalsCommitted: committed,
          availableForWithdrawal: available,
        };
      })
    );

    return c.json({ success: true, data });
  } catch (error) {
    return handleRouteError(c, 'Error fetching investor investments', error);
  }
});

// GET /investor/withdrawals - list current investor withdrawals (optional filters: status, investment_id)
investorApp.get('/withdrawals', async (c) => {
  try {
    const user = c.get('user');
    const { status, investment_id, profile_id } = c.req.query();

    const where = { investor_id: user.id };
    if (status) where.status = status;
    if (investment_id) where.investment_id = investment_id;
    if (profile_id) where.profile_id = profile_id;

    const withdrawals = await models.Withdrawal.findAll({
      where,
      include: [{ model: models.Investment }, { model: models.Profile }],
      order: [['requested_at', 'DESC'], ['created_at', 'DESC']],
    });

    return c.json({ success: true, data: withdrawals });
  } catch (error) {
    return handleRouteError(c, 'Error fetching investor withdrawals', error);
  }
});

// GET /investor/documents - list current investor documents (optional filter: profile_id)
investorApp.get('/documents', async (c) => {
  try {
    const user = c.get('user');
    const { profile_id } = c.req.query();

    const where = {};
    const include = [
      {
        model: models.Investment,
        attributes: ['id', 'name', 'profile_id', 'investor_id'],
        where: { investor_id: user.id, ...(profile_id ? { profile_id } : {}) },
        required: true,
      },
    ];

    const documents = await models.Document.findAll({ where, include, order: [['created_at', 'DESC']] });

    // Normalize shape for frontend
    const data = documents.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      file_path: d.file_path,
      investment_id: d.investment_id,
      created_at: d.created_at,
    }));

    return c.json({ success: true, data });
  } catch (error) {
    return handleRouteError(c, 'Error fetching investor documents', error);
  }
});


// GET /investor/profit-share-series - get profit share time series data for charts
investorApp.get('/profit-share-series', async (c) => {
  try {
    const user = c.get('user');
    const { profile_id, year, startDate, endDate } = c.req.query();
    
    const isAdmin = user.isAdmin();

    const where = {};
    if (!isAdmin) {
      where.investor_id = user.id;
    }
    if (profile_id) {
      where.profile_id = profile_id;
    }

    const investments = await models.Investment.findAll({
      where,
      include: [
        { model: models.Branch, attributes: ['name'] },
        { model: models.Profile, attributes: ['name'] },
      ],
    });

    const emptyResp = (labels) => c.json({ success: true, data: { labels, profitShare: labels.map(() => 0), branchBreakdown: [] } });

    
    if (investments.length === 0) {
      const labels = startDate && endDate
        ? (() => {
            const rangeStart = new Date(startDate);
            const rangeEnd = new Date(endDate);
            const l = [];
            let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
            const endMarker = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
            while (cur <= endMarker) {
              l.push(cur.toLocaleString('en', { month: 'short' }));
              cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
            }
            return l;
          })()
        : Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('en', { month: 'short' }));
      return emptyResp(labels);
    }
    
    const { rangeStart, rangeEnd } = (() => {
      if (startDate && endDate) {
        return { rangeStart: new Date(startDate), rangeEnd: new Date(endDate) };
      }
      const yearNum = parseInt(year, 10) || new Date().getFullYear();
      return {
        rangeStart: new Date(yearNum, 0, 1),
        rangeEnd: new Date(yearNum, 11, 31),
      };
    })();

    const labels = [];
    const profitShare = [];
    const branchData = {};

    let currentMonth = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    const endMarker = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);

    while (currentMonth <= endMarker) {
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);

      const effectiveStart = monthStart < rangeStart ? rangeStart : monthStart;
      const effectiveEnd = monthEnd > rangeEnd ? rangeEnd : monthEnd;

      let monthlyProfitShare = 0;

      for (const investment of investments) {
        const invStart = new Date(investment.starting_date);
        const invEnd = new Date(investment.ending_date);

        if (invStart <= effectiveEnd && invEnd >= effectiveStart) {
          const calcInput = {
            ...investment.toJSON(),
            starting_date: effectiveStart > invStart ? effectiveStart : invStart,
            ending_date: effectiveEnd < invEnd ? effectiveEnd : invEnd,
          };
          
          const calculations = await getInvestmentCalculations([calcInput]);
          const calc = calculations?.[investment.id] || {};
          const investmentProfitShare = calc.yourProfitShareSelectedPeriod || 0;
          monthlyProfitShare += investmentProfitShare;

          const branchName = investment.Branch?.name || 'N/A';
          if (!branchData[branchName]) {
            branchData[branchName] = 0;
          }
          branchData[branchName] += investmentProfitShare;
        }
      }
      
      labels.push(currentMonth.toLocaleString('en', { month: 'short' }));
      profitShare.push(monthlyProfitShare);
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }

    const branchBreakdown = Object.entries(branchData).map(([branchName, totalProfit]) => ({
      branchName,
      totalProfit,
    }));

    return c.json({ success: true, data: { labels, profitShare, branchBreakdown } });
  } catch (error) {
    return handleRouteError(c, 'Error fetching profit share series', error);
  }
});

// GET /investor/withdrawals/available/:investmentId - compute available amount for an investment
investorApp.get('/withdrawals/available/:investmentId', async (c) => {
  try {
    const user = c.get('user');
    const { investmentId } = c.req.param();

    const investment = await models.Investment.findOne({
      where: { id: investmentId, investor_id: user.id },
      include: [{ model: models.Profile }],
    });

    if (!investment) {
      return c.json({ success: false, message: 'Investment not found' }, 404);
    }

    const accruedShare = await computeAccruedProfitShareToDate(investment);
    const committed = await sumCommittedWithdrawals(investment.id);
    const available = Math.max(accruedShare - committed, 0);

    return c.json({
      success: true,
      data: {
        investment_id: investment.id,
        accruedProfitShareToDate: accruedShare,
        committedWithdrawals: committed,
        availableForWithdrawal: available,
      },
    });
  } catch (error) {
    return handleRouteError(c, `Error computing available withdrawal for investment ${c.req.param('investmentId')}`, error);
  }
});

// POST /investor/withdrawals - create a new withdrawal request
investorApp.post('/withdrawals', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { investment_id, amount, payment_method, notes } = body || {};

    if (!investment_id || !amount || Number(amount) <= 0) {
      return c.json({ success: false, message: 'investment_id and positive amount are required' }, 400);
    }

    const investment = await models.Investment.findOne({
      where: { id: investment_id, investor_id: user.id },
    });

    if (!investment) {
      return c.json({ success: false, message: 'Investment not found or not owned by user' }, 404);
    }

    const profileId = investment.profile_id;
    if (!profileId) {
      return c.json({ success: false, message: 'Investment profile missing' }, 400);
    }

    const accruedShare = await computeAccruedProfitShareToDate(investment);
    const committed = await sumCommittedWithdrawals(investment.id);
    const available = Math.max(accruedShare - committed, 0);

    if (Number(amount) > available) {
      return c.json({ success: false, message: 'Requested amount exceeds available balance' }, 400);
    }

    const newWithdrawal = await models.Withdrawal.create({
      investment_id,
      profile_id: profileId,
      investor_id: user.id,
      amount: Number(amount),
      status: 'pending',
      payment_method: payment_method || null,
      notes: notes || null,
      requested_at: new Date(),
    });

    // Activity log
    try {
      await models.ActivityLog.create({
        action: 'withdrawal_create',
        target_entity_type: 'withdrawal',
        target_entity_id: newWithdrawal.id,
        details: {
          investment_id,
          profile_id: profileId,
          amount: Number(amount),
          status_before: null,
          status_after: 'pending',
          payment_method: payment_method || null,
        },
        user_id: user.id,
      });
    } catch (logErr) {
      console.warn('Activity log failed on withdrawal create:', logErr.message);
    }

    const finalWithdrawal = await models.Withdrawal.findByPk(newWithdrawal.id, {
      include: [{ model: models.Investment }, { model: models.Profile }],
    });

    return c.json({ success: true, message: 'Withdrawal request created', data: finalWithdrawal }, 201);
  } catch (error) {
    return handleRouteError(c, 'Error creating withdrawal', error);
  }
});

module.exports = investorApp;