const { Hono } = require('hono');
const models = require('../models');
const { createNotification } = require('../services/notificationService');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');
const { handleRouteError } = require('../lib/errorHandler');

const notificationApp = new Hono();

notificationApp.use('*', authMiddleware);

notificationApp.get('/', async (c) => {
  const user = c.get('user');
  const { page = 1, limit = 10, search = '', sort = 'created_at', order = 'DESC' } = c.req.query();
  const offset = (page - 1) * limit;

        const whereClause = search ? {
            [Op.and]: [
                { message: { [Op.like]: `%${search}%` } },
                // { user_id: user.id }
            ]
        } : {user_id: user.id};

  // const whereClause = {
  //     user_id: user.id,
  // };
  // if (search) {
  //     whereClause.message = { [Op.iLike]: `%${search}%` };
  // }

  try {
    const { count, rows: notifications } = await models.Notification.findAndCountAll({
      where: whereClause,
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    return c.json({
      success: true,
      notifications,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    return handleRouteError(c, 'Error fetching notifications', error);
  }
});

notificationApp.post('/', async (c) => {
  const user = c.get('user');
  const { type, message, relatedEntityType, relatedEntityId } = await c.req.json();
  if (!type || !message) {
    return c.json({ success: false, message: 'Missing required fields: type, message' }, 400);
  }
  try {
    await createNotification({
      userId: user.id,
      type,
      message,
      relatedEntityType,
      relatedEntityId,
    });
    return c.json({ success: true, message: 'Notification created successfully' }, 201);
  } catch (error) {
    return handleRouteError(c, 'Error creating notification', error);
  }
});
notificationApp.post('/mark-read', async (c) => {
  const user = c.get('user');
  try {
    const { notificationIds } = await c.req.json();
    await models.Notification.update({ is_read: true }, {
      where: {
        id: notificationIds,
        user_id: user.id
      }
    });
    return c.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    return handleRouteError(c, 'Error marking notifications as read', error);
  }
});

notificationApp.put('/:id', async (c) => {
  const { id } = c.req.param();
  const { message, type } = await c.req.json();
  try {
    const notification = await models.Notification.findByPk(id);
    if (!notification) {
      return c.json({ success: false, message: 'Notification not found' }, 404);
    }
    await notification.update({ message, type });
    return c.json({ success: true, message: 'Notification updated successfully' });
  } catch (error) {
    return handleRouteError(c, `Error updating notification ${id}`, error);
  }
});

notificationApp.delete('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    const notification = await models.Notification.findByPk(id);
    if (!notification) {
      return c.json({ success: false, message: 'Notification not found' }, 404);
    }
    await notification.destroy();
    return c.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    return handleRouteError(c, `Error deleting notification ${id}`, error);
  }
});

module.exports = notificationApp;