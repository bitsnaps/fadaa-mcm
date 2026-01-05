const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware, assistantMiddleware } = require('../middleware/auth');
const { handleRouteError } = require('../lib/errorHandler');

const withdrawalsApp = new Hono();

withdrawalsApp.use('*', authMiddleware, assistantMiddleware);

async function loadWithdrawalOr404(id) {
  return await models.Withdrawal.findByPk(id);
}

// GET /withdrawals - list all withdrawals (admin only)
withdrawalsApp.get('/', async (c) => {
  try {
    const { status, investment_id, profile_id } = c.req.query();

    const where = {};
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
    return handleRouteError(c, 'Error fetching withdrawals', error);
  }
});

// POST /withdrawals - create a new withdrawal (admin)
withdrawalsApp.post('/', async (c) => {
  try {
    const user = c.get('user');
    const {
      profile_id,
      investor_id,
      investment_id,
      amount,
      status,
      payment_method,
      notes,
      requested_at
    } = await c.req.json();

    const newWithdrawal = await models.Withdrawal.create({
      profile_id,
      investor_id,
      investment_id,
      amount,
      status: status || 'pending',
      payment_method,
      notes,
      requested_at: requested_at || new Date(),
      created_by: user.id
    });

    const finalWithdrawal = await models.Withdrawal.findByPk(newWithdrawal.id, {
      include: [{ model: models.Investment }, { model: models.Profile }, { model: models.User, as: 'investor' }]
    });

    return c.json({ success: true, message: 'Withdrawal created successfully', data: finalWithdrawal }, 201);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
        }, {});
        return c.json({ errors }, 422);
    }
    return handleRouteError(c, 'Error creating withdrawal', error);
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
      requested_at,
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
      requested_at,
      processed_by: user.id,
    };

    if (status === 'paid' && wd.status !== 'paid') {
      updateData.paid_at = new Date();
      updateData.approved_at = wd.approved_at || new Date();

      // Create Expense record for the withdrawal
      try {
        const investment = await models.Investment.findByPk(wd.investment_id);
        if (investment && investment.branch_id) {
          const [withdrawalCategory] = await models.ExpenseCategory.findOrCreate({
            where: { name: 'Withdrawal' },
            defaults: { description: 'Withdrawal of investment funds' }
          });

          await models.Expense.create({
            amount: amount !== undefined ? amount : wd.amount,
            description: `Withdrawal for investment #${wd.investment_id}`,
            transaction_date: new Date(),
            branch_id: investment.branch_id,
            registered_by: user.id,
            profile_id: wd.profile_id,
            category_id: withdrawalCategory.id
          });
        }
      } catch (expenseError) {
        console.error('Failed to create expense for withdrawal:', expenseError);
        // We log but don't fail the withdrawal update
      }
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
    if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
        }, {});
        return c.json({ errors }, 422);
    }
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