const { Hono } = require('hono');
const expenseController = require('../controllers/expenseController');
const { authMiddleware, adminOrAssistantMiddleware } = require('../middleware/auth');

const expensesApp = new Hono();

expensesApp.use('*', authMiddleware, adminOrAssistantMiddleware);

// GET all expenses
expensesApp.get('/', expenseController.getAllExpenses);

// GET expense by ID
expensesApp.get('/:id', expenseController.getExpenseById);

// POST a new expense
expensesApp.post('/', expenseController.createExpense);

// PUT (update) an expense
expensesApp.put('/:id', expenseController.updateExpense);

// DELETE an expense
expensesApp.delete('/:id', expenseController.deleteExpense);

module.exports = expensesApp;