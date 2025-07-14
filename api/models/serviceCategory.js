const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ServiceCategory = sequelize.define('ServiceCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'service_categories',
    timestamps: false,
  });

  return ServiceCategory;
};