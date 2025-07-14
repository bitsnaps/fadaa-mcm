const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Branch = sequelize.define('Branch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    location: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'under_maintenance'),
      allowNull: false,
      defaultValue: 'active',
    },
  }, {
    tableName: 'branches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Branch;
};