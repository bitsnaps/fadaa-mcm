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

// --- Static File Serving ---
// Serve the uploaded contract files
app.use('/uploads/contracts/*', serveStatic({ root: './public' }));
app.use('/uploads/documents/*', serveStatic({ root: './public' }));

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});