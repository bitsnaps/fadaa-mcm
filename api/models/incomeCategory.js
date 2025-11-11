const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const IncomeCategory = sequelize.define('IncomeCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'income_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return IncomeCategory;
};