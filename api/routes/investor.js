const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, investorMiddleware } = require('../middleware/auth');
const { getInvestmentCalculations } = require('../controllers/investmentController');

const Op = models.Sequelize.Op;

const investorApp = new Hono();

// Protect all endpoints: authenticated investors only
investorApp.use('*', authMiddleware, investorMiddleware);

// Helper to compute accrued profit share to date for an investment
async function computeAccruedProfitShareToDate(investmentInstance) {
  const inv = investmentInstance.toJSON ? investmentInstance.toJSON() : investmentInstance;
  const calcInput = { ...inv, ending_date: new Date() };
  const calculations = await getInvestmentCalculations(calcInput);
  return calculations?.yourProfitShareSelectedPeriod || 0;
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
    const investments = await models.Investment.findAll({
      where: { investor_id: user.id },
      include: [{ model: models.Branch }, { model: models.Profile }],
      order: [['created_at', 'DESC']],
    });

    const data = await Promise.all(
      investments.map(async (inv) => {
        const accruedShare = await computeAccruedProfitShareToDate(inv);
        const committed = await sumCommittedWithdrawals(inv.id);
        const available = Math.max(accruedShare - committed, 0);
        // Also compute branch net profit if useful to UI
        const calcInput = { ...(inv.toJSON ? inv.toJSON() : inv), ending_date: new Date() };
        const calc = await getInvestmentCalculations(calcInput);

        return {
          ...inv.toJSON(),
          yourProfitShareSelectedPeriod: accruedShare,
          branchNetProfitSelectedPeriod: calc?.branchNetProfitSelectedPeriod || 0,
          withdrawalsCommitted: committed,
          availableForWithdrawal: available,
        };
      })
    );

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching investor investments:', error);
    return c.json({ success: false, message: 'Failed to fetch investments' }, 500);
  }
});

// GET /investor/withdrawals - list current investor withdrawals (optional filters: status, investment_id)
investorApp.get('/withdrawals', async (c) => {
  try {
    const user = c.get('user');
    const { status, investment_id } = c.req.query();

    const where = { investor_id: user.id };
    if (status) where.status = status;
    if (investment_id) where.investment_id = investment_id;

    const withdrawals = await models.Withdrawal.findAll({
      where,
      include: [{ model: models.Investment }, { model: models.Profile }],
      order: [['requested_at', 'DESC'], ['created_at', 'DESC']],
    });

    return c.json({ success: true, data: withdrawals });
  } catch (error) {
    console.error('Error fetching investor withdrawals:', error);
    return c.json({ success: false, message: 'Failed to fetch withdrawals' }, 500);
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
    console.error('Error computing available withdrawal:', error);
    return c.json({ success: false, message: 'Failed to compute available withdrawal' }, 500);
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
    console.error('Error creating withdrawal:', error);
    return c.json({ success: false, message: 'Failed to create withdrawal' }, 500);
  }
});

module.exports = investorApp;