const { User, Role } = require('../models');

const branchRestriction = (model) => async (c, next) => {
  if (!c.req.user) {
    return next();
  }

  try {
    const user = c.get('user');

    if (user && user.role && !user.isAdmin() && user.branch_id) {
      c.req.branch_id = user.branch_id;
    }

    await next();
  } catch (error) {
    console.error('Error in branchRestriction middleware:', error);
    c.res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = branchRestriction;