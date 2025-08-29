const { Hono } = require('hono');
const jwt = require('jsonwebtoken');
const models = require('../models');
const { verifyPassword } = require('../lib/auth');
const { handleRouteError } = require('../lib/errorHandler');

const authApp = new Hono();

authApp.post('/login', async (c) => {
  try {
      const { email, password } = await c.req.json();

      if (!email || !password) {
          return c.json({ success: false, message: 'Email and password are required' }, 400);
      }

      const user = await models.User.findOne({
          where: { email },
          include: [{ model: models.Role, as: 'role' }]
      });

      if (!user) {
          return c.json({ success: false, message: 'Invalid username or password' }, 401);
      }

      if (!verifyPassword(password, user.password_hash)) {
          return c.json({ success: false, message: 'Invalid username or password' }, 401);
      }

      // Generate JWT
      const token = jwt.sign({ id: user.id, email: user.email, role_id: user.role_id, branch_id: user.branch_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      return c.json({
        success: true,
        message: 'Login successful',
        token: token,
        user: user
    });
  } catch (error) {
      return handleRouteError(c, 'Login error', error);
  }
});

module.exports = authApp;