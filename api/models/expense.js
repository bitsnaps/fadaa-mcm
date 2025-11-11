const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define('Expense', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    branch_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'branches',
        key: 'id'
      },
      allowNull: false,
    },
    registered_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      allowNull: false,
    },
    profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'expense_categories',
        key: 'id'
      }
    },
  }, {
    tableName: 'expenses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Expense;
};