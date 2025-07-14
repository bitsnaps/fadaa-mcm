const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      note: 'e.g., Admin, Assistant, Investor, Client',
    },
    description: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'roles',
    timestamps: false,
  });

  return Role;
};