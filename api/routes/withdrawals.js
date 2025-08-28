const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, adminOrAssistantMiddleware } = require('../middleware/auth');
const { handleRouteError } = require('../lib/errorHandler');

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
    return handleRouteError(c, 'Error fetching withdrawals', error);
  }
});

// Helper to load a withdrawal with safety checks
async function loadWithdrawalOr404(id) {
  const wd = await models.Withdrawal.findByPk(id);
  return wd;
}


// GET /withdrawals/:id - get a single withdrawal by its ID
withdrawalsApp.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const withdrawal = await models.Withdrawal.findByPk(id, {
      include: [
        { model: models.Investment },
        { model: models.Profile },
        { model: models.User, as: 'investor', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: models.User, as: 'processed_by_user', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
    });

    if (!withdrawal) {
      return c.json({ success: false, message: 'Withdrawal not found' }, 404);
    }

    return c.json({ success: true, data: withdrawal });
  } catch (error) {
    return handleRouteError(c, `Error fetching withdrawal ${c.req.param('id')}`, error);
  }
});


// POST /withdrawals - create a new withdrawal
withdrawalsApp.post('/', async (c) => {
  try {
    const user = c.get('user');
    const {
      investment_id,
      investor_id,
      profile_id,
      amount,
      status = 'pending',
      payment_method,
      notes,
    } = await c.req.json();

    if (!investment_id || !investor_id || !profile_id || !amount) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    const newWithdrawal = await models.Withdrawal.create({
      investment_id,
      investor_id,
      profile_id,
      amount,
      status,
      payment_method,
      notes,
      requested_at: new Date(),
      processed_by: user.id,
    });

    return c.json({ success: true, message: 'Withdrawal created successfully', data: newWithdrawal }, 201);
  } catch (error) {
    return handleRouteError(c, 'Error creating new withdrawal', error);
  }
});

// PUT /withdrawals/:id - update an existing withdrawal
withdrawalsApp.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const {
      amount,
      status,
      payment_method,
      notes,
    } = await c.req.json();

    const wd = await loadWithdrawalOr404(id);
    if (!wd) {
      return c.json({ success: false, message: 'Withdrawal not found' }, 404);
    }

    const updateData = {
      amount,
      status,
      payment_method,
      notes,
      processed_by: user.id,
    };

    if (status === 'paid' && wd.status !== 'paid') {
      updateData.paid_at = new Date();
      updateData.approved_at = wd.approved_at || new Date();
    }

    await wd.update(updateData);

    const finalWithdrawal = await models.Withdrawal.findByPk(wd.id, {
      include: [
        { model: models.Investment },
        { model: models.Profile },
        { model: models.User, as: 'investor', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: models.User, as: 'processed_by_user', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
    });

    return c.json({ success: true, message: 'Withdrawal updated successfully', data: finalWithdrawal });
  } catch (error) {
    return handleRouteError(c, `Error updating withdrawal ${c.req.param('id')}`, error);
  }
});

// DELETE /withdrawals/:id - delete a withdrawal
withdrawalsApp.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const wd = await loadWithdrawalOr404(id);
    if (!wd) {
      return c.json({ success: false, message: 'Withdrawal not found' }, 404);
    }

    if (wd.status === 'paid') {
       return c.json({ success: false, message: `Cannot delete a withdrawal with status: ${wd.status}` }, 400);
    }

    await wd.destroy();
    return c.json({ success: true, message: 'Withdrawal deleted successfully' });
  } catch (error) {
    return handleRouteError(c, `Error deleting withdrawal ${c.req.param('id')}`, error);
  }
});


module.exports = withdrawalsApp;