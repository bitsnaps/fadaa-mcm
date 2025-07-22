const { Hono } = require('hono');
const incomeController = require('../controllers/incomeController');
const { authMiddleware, adminOrAssistantMiddleware } = require('../middleware/auth'); // Assuming you have this middleware or will create it

const incomesApp = new Hono();

incomesApp.use('*', authMiddleware, adminOrAssistantMiddleware); // Apply middleware to all income routes

// GET all incomes
incomesApp.get('/', incomeController.getAllIncomes);

// GET income by ID
incomesApp.get('/:id', incomeController.getIncomeById);

// POST a new income
incomesApp.post('/', incomeController.createIncome);

// PUT (update) an income
incomesApp.put('/:id', incomeController.updateIncome);

// DELETE an income
incomesApp.delete('/:id', incomeController.deleteIncome);

module.exports = incomesApp;