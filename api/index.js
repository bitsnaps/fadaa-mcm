const { serve } = require('@hono/node-server');
const { Hono } = require('hono');
const { serveStatic } = require('@hono/node-server/serve-static');
const { cors } = require('hono/cors');

const taxApp = require('./routes/taxes');
const contractApp = require('./routes/contracts');
const userApp = require('./routes/users');
const notificationApp = require('./routes/notifications');
const miscApp = require('./routes/misc');
const branchesApp = require('./routes/branches');
const serviceCategoriesApp = require('./routes/serviceCategories');
const clientsApp = require('./routes/clients');
const officesApp = require('./routes/offices');
const authApp = require('./routes/auth');
const documentApp = require('./routes/documents');
const clientServicesApp = require('./routes/clientServices');
const investmentsApp = require('./routes/investments');
const incomesApp = require('./routes/incomes');
const expensesApp = require('./routes/expenses');
const activityLogsApp = require('./routes/activityLogs');
const financialsApp = require('./routes/financials');
const { hashPassword } = require('./lib/auth');
const models = require('./models');

if (process.env.NODE_ENV !== 'test') {
    require('./cron/scheduler');
}

const app = new Hono();

// Add CORS middleware (for Dev)
app.use('/*', cors({
    origin: ['https://www.fadaa.dz','http://localhost:5173', 'http://127.0.0.1:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    credentials: true
}));

// Route registration
app.route('/api', authApp);
app.route('/api/users', userApp);
app.route('/api/taxes', taxApp);
app.route('/api/contracts', contractApp);
app.route('/api/notifications', notificationApp);
app.route('/api/documents', documentApp);
app.route('/api/client-services', clientServicesApp);
app.route('/api/branches', branchesApp);
app.route('/api/service-categories', serviceCategoriesApp);
app.route('/api/clients', clientsApp);
app.route('/api/offices', officesApp);
app.route('/api/misc', miscApp);
app.route('/api/investments', investmentsApp);
app.route('/api/incomes', incomesApp);
app.route('/api/expenses', expensesApp);
app.route('/api/activity-logs', activityLogsApp);
app.route('/api/financials', financialsApp);

// --- Static File Serving ---
// Serve the uploaded contract files
app.use('/uploads/contracts/*', serveStatic({ root: './public' }));
app.use('/uploads/documents/*', serveStatic({ root: './public' }));

/**
 * Create the first user (admin)
 */
//curl -X POST http://localhost:3000/api/create-user -H "Content-Type: application/json" -d '{ "first_name": "Admin", "last_name": "User", "email": "admin@fadaa.dz", "password": "...", "role_id": 1, "branch_id": 1, "is_active": true }'
app.post('/api/create-user', async (c) => {
  try {
      const { first_name, last_name, email, password, role_id, branch_id, is_active, preferences } = await c.req.json();

      if (!email || !password || !first_name || !last_name || !role_id) {
          return c.json({ success: false, message: 'Missing required fields' }, 400);
      }

      const existingUser = await models.User.findOne({ where: { email } });
      if (existingUser) {
          return c.json({ success: false, message: 'User already exists' }, 409);
      }

      const newUser = await models.User.create({
          first_name,
          last_name,
          email,
          password_hash: hashPassword(password),
          role_id,
          branch_id,
          is_active,
          preferences
      });

      console.log('User created:', email);
      return c.json({ success: true, message: 'User created successfully', userId: newUser.id });
  } catch (error) {
      console.error('User creation error:', error);
      return c.json({ success: false, message: 'An error occurred during user creation' }, 500);
  }
});

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});