const { serve } = require('@hono/node-server');
const { Hono } = require('hono');
const { serveStatic } = require('@hono/node-server/serve-static');
const { cors } = require('hono/cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = new Hono();

app.get('/api', async (c) => {
    return c.json({message: 'ok'});
})

app.post('/api/signup', async (c) => {
    try {
        const { email, password, first_name, last_name } = await c.req.json();

        if (!email || !password) {
            return c.json({ success: false, message: 'Email and password are required' }, 400);
        }

        const existingUser = await models.User.findOne({ where: { email } });
        if (existingUser) {
            return c.json({ success: false, message: 'User already exists' }, 409);
        }

        const newUser = await models.User.create({
            email,
            passwordHash: hashPassword(password),
            first_name: first_name,
            last_name: last_name,
            isAdmin: false,
            isVerified: false
        });
        console.log('User signed up:', email);
        return c.json({ success: true, message: 'Signup successful', userId: newUser.id });
    } catch (error) {
        console.error('Signup error:', error);
        return c.json({ success: false, message: 'An error occurred during signup' }, 500);
        // return c.json({ success: false, message: error.message }, 500);
    }
});

app.post('/api/login', async (c) => {
  try {
      const { email, password } = await c.req.json();

      if (!email || !password) {
          return c.json({ success: false, message: 'Email and password are required' }, 400);
      }

      const user = await models.User.findOne({ where: { email } });

      if (!user) {
          return c.json({ success: false, message: 'Invalid username or password' }, 401);
      }

      if (!verifyPassword(password, user.passwordHash)) {
          return c.json({ success: false, message: 'Invalid username or password' }, 401);
      }

      if (!user.isAdmin){
        // Check if the user's email is verified
        if (!user.isVerified) {
          return c.json({ success: false, message: 'Please verify your email before logging in.', errorCode: 'EMAIL_NOT_VERIFIED' }, 403);
        }
      }

      // Generate JWT
      const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      console.log('User logged in:', email);
      return c.json({
        success: true,
        message: 'Login successful',
        token: token,
        user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            isVerified: user.isVerified,
            isAdmin: user.isAdmin,
            isActive: user.isActive
        }
    });
  } catch (error) {
      console.error('Login error:', error);
      return c.json({ success: false, message: 'An error occurred during login' }, 500);
  }
});


serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`) // Listening on http://localhost:3000
})