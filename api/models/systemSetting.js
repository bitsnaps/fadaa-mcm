const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    key: {
      type: DataTypes.STRING(255),
      primaryKey: true,
    },
    value: {
      type: DataTypes.TEXT,
    },
    description: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'system_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return SystemSetting;
};