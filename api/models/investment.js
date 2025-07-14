const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Investment = sequelize.define('Investment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    type: {
      type: DataTypes.STRING(100),
    },
    status: {
      type: DataTypes.ENUM('Active', 'Sold', 'Pending'),
      allowNull: false,
      defaultValue: 'Active',
    },
    initial_value: {
      type: DataTypes.DECIMAL(15, 2),
    },
    current_value: {
      type: DataTypes.DECIMAL(15, 2),
    },
  }, {
    tableName: 'investments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Investment;
};