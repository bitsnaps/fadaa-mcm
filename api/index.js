const { serve } = require('@hono/node-server');
const { Hono } = require('hono');
const { serveStatic } = require('@hono/node-server/serve-static');
const { cors } = require('hono/cors');
const crypto = require('crypto');
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
const profilesApp = require('./routes/profiles');
const investorApp = require('./routes/investor');
const withdrawalsApp = require('./routes/withdrawals');
const reportsApp = require('./routes/reports');
const taskApp = require('./routes/tasks');
const clientAttachmentsApp = require('./routes/clientAttachments');
const { hashPassword } = require('./lib/auth');
const models = require('./models');

if (process.env.NODE_ENV !== 'test') {
    require('./cron/scheduler');
}

const app = new Hono();

// Add CORS middleware (for Dev)
app.use('/*', cors({
    origin: ['https://www.app.fadaa.dz','http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173'],
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
app.route('/api/profiles', profilesApp);
app.route('/api/investor', investorApp);
app.route('/api/withdrawals', withdrawalsApp);
app.route('/api/reports', reportsApp);
app.route('/api/tasks', taskApp);
app.route('/api/client-attachments', clientAttachmentsApp);


// --- Static File Serving ---
// Serve the uploaded contract files
app.use('/uploads/contracts/*', serveStatic({ root: './public' }));
app.use('/uploads/documents/*', serveStatic({ root: './public' }));
app.use('/uploads/*', serveStatic({ root: './public' }));

app.get('/api/csrf', async (c) => {
    const ts = c.req.query('ts');
    if (!ts){
        return c.json({ secret: '', stamp: 0, }, 400);
    }
    const token = crypto.createHash('sha256').update(ts).digest('hex');
    return c.json({
        secret: token,
        stamp: Date.now()-parseInt(ts),
    });
});

// 1- Should be executed with:
// curl -X POST /api/install
app.post('/api/install', async (c) => {
  // Only allow in debug mode
  if (process.env.NODE_ENV === 'production') {
    return c.json({ error: 'Install endpoint is only available in debug mode' }, 403);
  }

  try {
    const tableStatus = {};
    
    // Test connection
    await models.sequelize.authenticate();
    
    // Check each model's table existence
    for (const [modelName, model] of Object.entries(models)) {
      if (model.tableName) { // Only check actual models, not sequelize/Op
        try {
          await model.describe(); // This will throw if table doesn't exist
          tableStatus[modelName] = 'exists';
        } catch (err) {
          tableStatus[modelName] = 'missing';
        }
      }
    }

    // Create missing tables
    await models.sequelize.sync({ alter: false }); // Don't alter existing tables
    
    // Verify all tables after sync
    const finalStatus = {};
    for (const [modelName, model] of Object.entries(models)) {
      if (model.tableName) {
        try {
          const tableInfo = await model.describe();
          finalStatus[modelName] = {
            status: 'ready',
            columns: Object.keys(tableInfo).length
          };
        } catch (err) {
          finalStatus[modelName] = {
            status: 'error',
            error: err.message
          };
        }
      }
    }

    return c.json({
      success: (Object.keys(finalStatus).length == Object.keys(tableStatus).length),
      message: `Database installation completed`,
      details: {
        initialStatus: tableStatus,
        finalStatus: finalStatus
      }
    });

  } catch (error) {
    console.error('Installation error:', error);
    return c.json({
      success: false,
      error: error.message,
      details: error.stack
    }, 500);
  }
});

// Create the first user (admin)
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

      return c.json({ success: true, message: 'User created successfully', userId: newUser.id });
  } catch (error) {
      console.error('User creation error:', error);
      return c.json({ success: false, message: 'An error occurred during user creation' }, 500);
  }
});

// Create a new role
// curl -X POST http://localhost:3000/api/create-role -H "Content-Type: application/json" -d '{ "name": "Test", "description": "Test role" }'
app.post('/api/create-role', async (c) => {
  try {
    const { name, description } = await c.req.json();

    if (!name) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    const existingRole = await models.Role.findOne({ where: { name } });
    if (existingRole) {
      return c.json({ success: false, message: 'Role already exists' }, 409);
    }

    const newRole = await models.Role.create({
      name,
      description,
    });

    return c.json({ success: true, message: 'Role created successfully', roleId: newRole.id });
  } catch (error){
    return c.json({ success: false, message: 'Role creation error.' }, 500);
  }
});

// Create a new branch
// curl -X POST http://localhost:3000/api/create-branch -H "Content-Type: application/json" -d '{ "name": "Main Branch", "location": "Headquarters", "status": "active" }'
app.post('/api/create-branch', async (c) => {
    try {
        const { name, location, status } = await c.req.json();

        if (!name || !location) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        const existingBranch = await models.Branch.findOne({ where: { name } });
        if (existingBranch) {
            return c.json({ success: false, message: 'Branch already exists' }, 409);
        }

        const newBranch = await models.Branch.create({
            name,
            location,
            status
        });

        return c.json({ success: true, message: 'Branch created successfully', branchId: newBranch.id });
    } catch (error) {
      return c.json({ success: false, message: 'Branch creation error.' }, 500);
  }
});

// Create a new office
// curl -X POST http://localhost:3000/api/create-office -H "Content-Type: application/json" -d '{ "name": "Big Room", "type": "Coworking Desk", "capacity": 30, "status": "Available", "amenities": "Wi-Fi, Coffee", "branch_id": 1 }'
app.post('/api/create-office', async (c) => {
    try {
        const { name, type, capacity, status, amenities, branch_id } = await c.req.json();

        if (!name || !type || !branch_id) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        const existingOffice = await models.Office.findOne({ where: { name, branch_id } });
        if (existingOffice) {
            return c.json({ success: false, message: 'Office already exists in this branch' }, 409);
        }

        const newOffice = await models.Office.create({
            name,
            type,
            capacity,
            status,
            amenities,
            branch_id
        });

        return c.json({ success: true, message: 'New office created successfully', officeId: newOffice.id });
      } catch (error) {
        return c.json({ success: false, message: 'Tax creation error.' }, 500);
      }
});

// Create a new service category
// curl -X POST http://localhost:3000/api/create-service-category -H "Content-Type: application/json" -d '{ "name": "Rental Equipement", "description": "Rental of any type of equipements." }'
app.post('/api/create-service-category', async (c) => {
    try {
        const { name, description } = await c.req.json();

        if (!name) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        const existingServiceCategory = await models.ServiceCategory.findOne({ where: { name } });
        if (existingServiceCategory) {
            return c.json({ success: false, message: 'Service category already exists' }, 409);
        }

        const newServiceCategory = await models.ServiceCategory.create({
            name,
            description
        });

        return c.json({ success: true, message: 'Service category created successfully', serviceCategoryId: newServiceCategory.id });
    } catch (error) {
      return c.json({ success: false, message: 'Service category creation error.' }, 500);
      }
});
            
// Create a new tax
// curl -X POST http://localhost:3000/api/create-tax -H "Content-Type: application/json" -d '{ "name": "VAT", "rate": "19.00", "description": "Value added tax", "bearer": "Client" }'
app.post('/api/create-tax', async (c) => {
    try {
        const { name, rate, description, bearer } = await c.req.json();

        if (!name || !rate) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        const existingTax = await models.Tax.findOne({ where: { name } });
        if (existingTax) {
            return c.json({ success: false, message: 'Tax already exists' }, 409);
        }

        const newTax = await models.Tax.create({
            name,
            rate,
            description,
            bearer
        });

        return c.json({ success: true, message: 'Tax created successfully', taxId: newTax.id });
      } catch (error) {
        return c.json({ success: false, message: 'Tax creation error.' }, 500);
      }
  });

// Create a new profile
// curl -X POST http://localhost:3000/api/create-profile -H "Content-Type: application/json" -d '{ "name": "Real Values", "description": "Default active profile for real operations", "is_active": true }'
app.post('/api/create-profile', async (c) => {
    try {
        const { name, description, is_active } = await c.req.json();

        if (!name) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        const existingProfile = await models.Profile.findOne({ where: { name } });
        if (existingProfile) {
            return c.json({ success: false, message: 'Profile already exists' }, 409);
        }

        const newProfile = await models.Profile.create({
            name,
            description,
            is_active
        });

        return c.json({ success: true, message: 'Profile created successfully', profileId: newProfile.id });
    } catch (error) {
      return c.json({ success: false, message: 'Profile creation error.' }, 500);
    }
});

// Create a new client
// curl -X POST http://localhost:3000/api/create-client -H "Content-Type: application/json" -d '{ "phone_number": "+1234567890", "company_name": "Main Client", "first_name": "Main", "last_name": "Client", "managed_by_user_id": 1, "status": "active" }'
app.post('/api/create-client', async (c) => {
    try {
        const { email, phone_number, company_name, first_name, last_name, managed_by_user_id, status } = await c.req.json();

        if (!phone_number || !company_name || !first_name || !last_name || !managed_by_user_id) {
            return c.json({ success: false, message: 'Missing required fields' }, 400);
        }

        // Check for existing client by email only if email is provided
        if (email) {
            const existingClient = await models.Client.findOne({ where: { email } });
            if (existingClient) {
                return c.json({ success: false, message: 'Client with this email already exists' }, 409);
            }
        }

        const newClient = await models.Client.create({
            email,
            phone_number,
            company_name,
            first_name,
            last_name,
            managed_by_user_id,
            status
        });

        return c.json({ success: true, message: 'Client created successfully', clientId: newClient.id });
    } catch (error) {
        console.error('Client creation error:', error);
        return c.json({ success: false, message: 'An error occurred during client creation' }, 500);
    }
});

serve(app, (info) => {
  //console.log(`Listening on http://localhost:${info.port}`);
});