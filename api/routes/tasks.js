const { Hono } = require('hono');
const {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const branchRestriction = require('../middleware/branchRestriction');

const taskApp = new Hono();

// Middleware for all task routes
taskApp.use('*', authMiddleware);
taskApp.use('/', branchRestriction());

// Routes
taskApp.get('/', getTasks);
taskApp.post('/', createTask);
taskApp.get('/:id', getTaskById);
taskApp.put('/:id', updateTask);
taskApp.delete('/:id', deleteTask);

module.exports = taskApp;