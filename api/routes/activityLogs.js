const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { handleRouteError } = require('../lib/errorHandler');

const activityLogsApp = new Hono();

activityLogsApp.use('*', authMiddleware);

// GET all activity logs
activityLogsApp.get('/', async (c) => {
    try {
      const { context, limit = 20 } = c.req.query();
      const whereClause = {};
      if (context) {
        whereClause.context = context;
      }

      const logs = await models.ActivityLog.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit, 10),
      });
      return c.json({ success: true, data: logs });
    } catch (error) {
      return handleRouteError(c, 'Error fetching activity logs', error);
    }
});

// GET activity log by ID
activityLogsApp.get('/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const log = await models.ActivityLog.findByPk(id);
      if (!log) {
        return c.json({ success: false, message: 'Activity log not found' }, 404);
      }
      return c.json({ success: true, data: log });
    } catch (error) {
      return handleRouteError(c, `Error fetching activity log ${c.req.param('id')}` , error);
    }
});

// POST a new activity log
activityLogsApp.post('/', async (c) => {
    try {
      const logData = await c.req.json();
      const newLog = await models.ActivityLog.create(logData);
      return c.json({ success: true, message: 'Activity log created successfully', data: newLog }, 201);
    } catch (error) {
      return handleRouteError(c, 'Error creating activity log', error);
    }
});

// PUT (update) an activity log
activityLogsApp.put('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const logData = await c.req.json();
        const log = await models.ActivityLog.findByPk(id);

        if (!log) {
            return c.json({ success: false, message: 'Activity log not found' }, 404);
        }

        await log.update(logData);
        return c.json({ success: true, message: 'Activity log updated successfully', data: log });
    } catch (error) {
        return handleRouteError(c, `Error updating activity log ${c.req.param('id')}`, error);
    }
});

// DELETE an activity log
activityLogsApp.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const log = await models.ActivityLog.findByPk(id);

        if (!log) {
            return c.json({ success: false, message: 'Activity log not found' }, 404);
        }

        await log.destroy();
        return c.json({ success: true, message: 'Activity log deleted successfully' });
    } catch (error) {
        return handleRouteError(c, `Error deleting activity log ${c.req.param('id')}`, error);
    }
});

module.exports = activityLogsApp;