const { User, Role } = require('../models');

const reportAuth = async (c, next) => {
  if (!c.req.user) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  try {
    const user = await User.findByPk(c.req.user.id, { include: { model: Role, as: 'role' } });

    if (user && user.role && (user.role.name.toLowerCase() === 'admin' || user.role.name.toLowerCase() === 'manager')) {
      await next();
    } else {
      return c.json({ success: false, message: 'Forbidden' }, 403);
    }
  } catch (error) {
    console.error('Error in reportAuth middleware:', error);
    return c.json({ success: false, message: 'Internal Server Error' }, 500);
  }
};

module.exports = reportAuth;