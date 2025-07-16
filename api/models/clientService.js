const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClientService = sequelize.define('ClientService', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    payment_type: {
      type: DataTypes.ENUM('Monthly', 'Quarterly', 'Annually', 'OneTime'),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Active',
    },
    notes: {
      type: DataTypes.TEXT,
    },
    taxId: {
       type: DataTypes.INTEGER,
       allowNull: true,
       references: {
           model: 'Taxes',
           key: 'id'
       }
    }
  }, {
    tableName: 'client_services',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  ClientService.associate = (models) => {
   ClientService.belongsTo(models.Tax, { foreignKey: 'taxId' });
  };

  return ClientService;
};