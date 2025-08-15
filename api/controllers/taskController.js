const { Task } = require('../models');

// @desc    Get all tasks, with optional filtering by category
// @route   GET /api/tasks
// @access  Private
const getTasks = async (c) => {
  try {
    const { category } = c.req.query();
    const whereClause = {};

    if (category) {
      whereClause.category = category;
    }

    const tasks = await Task.findAll({ where: whereClause, order: [['due_date', 'ASC']] });
    return c.json(tasks);
  } catch (error) {
    return c.json({ message: 'Error fetching tasks', error: error.message }, 500);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (c) => {
  try {
    const { title, description, category, status, priority, due_date } = await c.req.json();
    if (!title || !priority || !due_date) {
      return c.json({ message: 'Title, priority, and due date are required.' }, 400);
    }
    const newTask = await Task.create({ title, description, category, status, priority, due_date });
    return c.json(newTask, 201);
  } catch (error) {
    return c.json({ message: 'Error creating task', error: error.message }, 500);
  }
};

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (c) => {
  try {
    const { id } = c.req.param();
    const task = await Task.findByPk(id);
    if (!task) {
      return c.json({ message: 'Task not found' }, 404);
    }
    return c.json(task);
  } catch (error) {
    return c.json({ message: 'Error fetching task', error: error.message }, 500);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (c) => {
  try {
    const { id } = c.req.param();
    const { title, description, category, status, priority, due_date, completed_at } = await c.req.json();
    const task = await Task.findByPk(id);

    if (!task) {
      return c.json({ message: 'Task not found' }, 404);
    }

    await task.update({ title, description, category, status, priority, due_date, completed_at });
    return c.json(task);
  } catch (error) {
    return c.json({ message: 'Error updating task', error: error.message }, 500);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (c) => {
  try {
    const { id } = c.req.param();
    const task = await Task.findByPk(id);

    if (!task) {
      return c.json({ message: 'Task not found' }, 404);
    }

    await task.destroy();
    return c.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return c.json({ message: 'Error deleting task', error: error.message }, 500);
  }
};

module.exports = {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
};