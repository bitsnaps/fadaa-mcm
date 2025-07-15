const { Hono } = require('hono');
const models = require('../models');

const notificationApp = new Hono();

notificationApp.get('/', async (c) => {
  try {
    const notifications = await models.Notification.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });
    return c.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ success: false, message: 'An error occurred while fetching notifications' }, 500);
  }
});

notificationApp.post('/mark-read', async (c) => {
  try {
    const { notificationIds } = await c.req.json();
    await models.Notification.update({ is_read: true }, {
      where: {
        id: notificationIds
      }
    });
    return c.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return c.json({ success: false, message: 'An error occurred while marking notifications as read' }, 500);
  }
});

module.exports = notificationApp;