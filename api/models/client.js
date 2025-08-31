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
      allowNull: true,
      // unique: true,
    },
    phone_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Lead'),
      allowNull: false,
      defaultValue: 'Active',
    },
    client_type: {
      type: DataTypes.ENUM('Individual', 'Company'),
    },
    id_type: {
      type: DataTypes.STRING(100),
    },
    id_number: {
      type: DataTypes.STRING(100),
    },
    id_expiry_date: {
      type: DataTypes.DATE,
    },
    tax_id: { // NIF
      type: DataTypes.STRING(100),
    },
    nis: {
      type: DataTypes.STRING(100),
    },
    rc_number: {
      type: DataTypes.STRING(100),
    },
    contact_person_name: {
      type: DataTypes.STRING(255),
    },
    contact_person_email: {
      type: DataTypes.STRING(255),
    },
    contact_person_phone: {
      type: DataTypes.STRING(50),
    },
  }, {
    tableName: 'clients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Client;
};