const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      note: 'Primary contact first name',
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      note: 'Primary contact last name',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone_number: {
      type: DataTypes.STRING(50),
    },
    address: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Lead'),
      allowNull: false,
      defaultValue: 'Active',
    },
  }, {
    tableName: 'clients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Client;
};