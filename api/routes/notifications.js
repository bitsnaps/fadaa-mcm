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

  // Check if user is admin
  const userRole = await models.Role.findOne({ where: { id: user.role_id } });
  const isAdmin = userRole && userRole.name.toLowerCase() === 'admin';

  // Admin can see all notifications, others only see their own
  let whereClause;
  if (isAdmin) {
    whereClause = search ? {
      message: { [Op.like]: `%${search}%` }
    } : {};
  } else {
    whereClause = search ? {
      [Op.and]: [
        { message: { [Op.like]: `%${search}%` } },
        { user_id: user.id }
      ]
    } : { user_id: user.id };
  }

  try {
    const { count, rows: notifications } = await models.Notification.findAndCountAll({
      where: whereClause,
      include: isAdmin ? [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          include: [
            {
              model: models.Role,
              as: 'role',
              attributes: ['name']
            }
          ]
        }
      ] : [],
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
  const { type, message, relatedEntityType, relatedEntityId, user_id } = await c.req.json();
  if (!type || !message) {
    return c.json({ success: false, message: 'Missing required fields: type, message' }, 400);
  }

  // Check if user is admin
  const userRole = await models.Role.findOne({ where: { id: user.role_id } });
  const isAdmin = userRole && userRole.name.toLowerCase() === 'admin';

  // Determine target user ID
  let targetUserId = user.id; // Default to current user
  if (isAdmin && user_id) {
    // Admin can assign notification to any user
    targetUserId = user_id;
  }

  try {
    await createNotification({
      userId: targetUserId,
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
notificationApp.get('/unread', async (c) => {
  const user = c.get('user');
  try {
    const where = { user_id: user.id, is_read: false };

    const unreadCount = await models.Notification.count({ where });

    const latestUnread = await models.Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 5,
    });

    return c.json({
      success: true,
      unreadCount,
      latestUnread,
    });
  } catch (error) {
    return handleRouteError(c, 'Error fetching unread notifications', error);
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
  const user = c.get('user');
  const { message, type, user_id } = await c.req.json();

  try {
    const notification = await models.Notification.findByPk(id);
    if (!notification) {
      return c.json({ success: false, message: 'Notification not found' }, 404);
    }

    // Check if user is admin
    const userRole = await models.Role.findOne({ where: { id: user.role_id } });
    const isAdmin = userRole && userRole.name.toLowerCase() === 'admin';

    // Prepare update data
    const updateData = { message, type };

    // Admin can change user assignment
    if (isAdmin && user_id !== undefined) {
      updateData.user_id = user_id;
    }

    await notification.update(updateData);
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