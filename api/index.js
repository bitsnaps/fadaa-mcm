const { serve } = require('@hono/node-server');
const { Hono } = require('hono');
const { serveStatic } = require('@hono/node-server/serve-static');
const { cors } = require('hono/cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const models = require('./models');

const app = new Hono();

// Add CORS middleware (for Dev)
app.use('/*', cors({
    origin: ['https://www.fadaa.dz','http://localhost:5173', 'http://127.0.0.1:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    // This means the browser will expose these headers when it makes requests to your API
    credentials: true
  }));

// Password hashing function
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

// Password verification function
const verifyPassword = (password, storedHash) => {
    if (!storedHash) {
        return false;
    }
    const [salt, hash] = storedHash.split(':');
    const hashToVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === hashToVerify;
};

app.get('/api', async (c) => {
    return c.json({message: 'ready'});
});

//curl -X POST http://localhost:3000/api/users \
// -H "Content-Type: application/json" \
// -d '{ "first_name": "Admin", "last_name": "User", "email": "admin@fadaa.dz", "password": "...", "role_id": 1, "branch_id": 1, "is_active": true }'
app.post('/api/users', async (c) => {
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

app.post('/api/login', async (c) => {
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
      
      console.log('User logged in:', email);
      return c.json({
        success: true,
        message: 'Login successful',
        token: token,
        user: user
    });
  } catch (error) {
      console.error('Login error:', error);
      return c.json({ success: false, message: 'An error occurred during login' }, 500);
  }
});




serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`) // Listening on http://localhost:3000
})