const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Income = sequelize.define('Income', {
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
      allowNull: true,
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
      allowNull: true,
      references: {
        model: 'profiles',
        key: 'id'
      }
    },
  }, {
    tableName: 'incomes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Income;
};