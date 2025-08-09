const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, adminOrAssistantMiddleware } = require('../middleware/auth');

const withdrawalsApp = new Hono();
const Op = models.Sequelize.Op;

// Protect all endpoints: authenticated admin or assistant only
withdrawalsApp.use('*', authMiddleware, adminOrAssistantMiddleware);

// GET /withdrawals - list and filter withdrawals
// Optional query params: status, investor_id, investment_id, profile_id
withdrawalsApp.get('/', async (c) => {
  try {
    const { status, investor_id, investment_id, profile_id } = c.req.query();

    const where = {};
    if (status) where.status = status;
    if (investor_id) where.investor_id = investor_id;
    if (investment_id) where.investment_id = investment_id;
    if (profile_id) where.profile_id = profile_id;

    const withdrawals = await models.Withdrawal.findAll({
      where,
      include: [
        { model: models.Investment },
        { model: models.Profile },
        { model: models.User, as: 'investor', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: models.User, as: 'processed_by_user', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
      order: [['requested_at', 'DESC'], ['created_at', 'DESC']],
    });

    return c.json({ success: true, data: withdrawals });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return c.json({ success: false, message: 'Failed to fetch withdrawals' }, 500);
  }
});

// Helper to load a withdrawal with safety checks
async function loadWithdrawalOr404(id) {
  const wd = await models.Withdrawal.findByPk(id);
  return wd;
}

// PUT /withdrawals/:id/approve - transition to approved from pending
withdrawalsApp.put('/:id/approve', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const wd = await loadWithdrawalOr404(id);
    if (!wd) {
      return c.json({ success: false, message: 'Withdrawal not found' }, 404);
    }

    if (wd.status !== 'pending') {
      return c.json({ success: false, message: 'Only pending withdrawals can be approved' }, 400);
    }

    const statusBefore = wd.status;
    await wd.update({
      status: 'approved',
      approved_at: new Date(),
      processed_by: user.id,
    });

    // Activity log
    try {
      await models.ActivityLog.create({
        action: 'withdrawal_approve',
        target_entity_type: 'withdrawal',
        target_entity_id: wd.id,
        details: {
          investment_id: wd.investment_id,
          amount: wd.amount,
          status_before: statusBefore,
          status_after: 'approved',
        },
        user_id: user.id,
      });
    } catch (logErr) {
      console.warn('Activity log failed on withdrawal approve:', logErr.message);
    }

    const finalWithdrawal = await models.Withdrawal.findByPk(wd.id, {
      include: [
        { model: models.Investment },
        { model: models.Profile },
        { model: models.User, as: 'investor', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: models.User, as: 'processed_by_user', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
    });

    return c.json({ success: true, message: 'Withdrawal approved', data: finalWithdrawal });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return c.json({ success: false, message: 'Failed to approve withdrawal' }, 500);
  }
});

// PUT /withdrawals/:id/reject - transition to rejected from pending
withdrawalsApp.put('/:id/reject', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const wd = await loadWithdrawalOr404(id);
    if (!wd) {
      return c.json({ success: false, message: 'Withdrawal not found' }, 404);
    }

    if (['approved', 'paid', 'rejected'].includes(wd.status)) {
      return c.json({ success: false, message: 'Only pending withdrawals can be rejected' }, 400);
    }

    const statusBefore = wd.status;
    await wd.update({
      status: 'rejected',
      processed_by: user.id,
    });

    // Activity log
    try {
      await models.ActivityLog.create({
        action: 'withdrawal_reject',
        target_entity_type: 'withdrawal',
        target_entity_id: wd.id,
        details: {
          investment_id: wd.investment_id,
          amount: wd.amount,
          status_before: statusBefore,
          status_after: 'rejected',
        },
        user_id: user.id,
      });
    } catch (logErr) {
      console.warn('Activity log failed on withdrawal reject:', logErr.message);
    }

    const finalWithdrawal = await models.Withdrawal.findByPk(wd.id, {
      include: [
        { model: models.Investment },
        { model: models.Profile },
        { model: models.User, as: 'investor', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: models.User, as: 'processed_by_user', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
    });

    return c.json({ success: true, message: 'Withdrawal rejected', data: finalWithdrawal });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    return c.json({ success: false, message: 'Failed to reject withdrawal' }, 500);
  }
});

// PUT /withdrawals/:id/mark-paid - transition to paid from approved
withdrawalsApp.put('/:id/mark-paid', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const wd = await loadWithdrawalOr404(id);
    if (!wd) {
      return c.json({ success: false, message: 'Withdrawal not found' }, 404);
    }

    if (wd.status !== 'approved') {
      return c.json({ success: false, message: 'Only approved withdrawals can be marked as paid' }, 400);
    }

    const statusBefore = wd.status;
    await wd.update({
      status: 'paid',
      paid_at: new Date(),
      processed_by: user.id, // keep the payer as processor
    });

    // Activity log
    try {
      await models.ActivityLog.create({
        action: 'withdrawal_paid',
        target_entity_type: 'withdrawal',
        target_entity_id: wd.id,
        details: {
          investment_id: wd.investment_id,
          amount: wd.amount,
          status_before: statusBefore,
          status_after: 'paid',
        },
        user_id: user.id,
      });
    } catch (logErr) {
      console.warn('Activity log failed on withdrawal paid:', logErr.message);
    }

    const finalWithdrawal = await models.Withdrawal.findByPk(wd.id, {
      include: [
        { model: models.Investment },
        { model: models.Profile },
        { model: models.User, as: 'investor', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: models.User, as: 'processed_by_user', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
    });

    return c.json({ success: true, message: 'Withdrawal marked as paid', data: finalWithdrawal });
  } catch (error) {
    console.error('Error marking withdrawal as paid:', error);
    return c.json({ success: false, message: 'Failed to mark withdrawal as paid' }, 500);
  }
});

module.exports = withdrawalsApp;