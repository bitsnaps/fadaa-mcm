const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
      allowNull: false,
      defaultValue: 'Medium',
    },
    due_date: {
      type: DataTypes.DATE,
    },
    completed_at: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Task;
};