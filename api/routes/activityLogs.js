const { Hono } = require('hono');
const models = require('../models');
const { authMiddleware } = require('../middleware/auth');

const activityLogsApp = new Hono();

activityLogsApp.use('*', authMiddleware);

// GET all activity logs
activityLogsApp.get('/', async (c) => {
    try {
      const logs = await models.ActivityLog.findAll({
        order: [['created_at', 'DESC']],
        limit: 10, // Limit to recent activities
      });
      return c.json({ success: true, data: logs });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return c.json({ success: false, message: 'Failed to fetch activity logs' }, 500);
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
      console.error(`Error fetching activity log ${id}:`, error);
      return c.json({ success: false, message: 'Failed to fetch activity log' }, 500);
    }
});

// POST a new activity log
activityLogsApp.post('/', async (c) => {
    try {
      const logData = await c.req.json();
      const newLog = await models.ActivityLog.create(logData);
      return c.json({ success: true, message: 'Activity log created successfully', data: newLog }, 201);
    } catch (error) {
      console.error('Error creating activity log:', error);
      return c.json({ success: false, message: 'Failed to create activity log' }, 500);
    }
});

module.exports = activityLogsApp;