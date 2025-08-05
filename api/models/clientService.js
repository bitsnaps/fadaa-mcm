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
      type: DataTypes.STRING,
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
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    service_category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'service_categories',
        key: 'id'
      }
   },
   profile_id: {
     type: DataTypes.INTEGER,
     allowNull: true,
     references: {
       model: 'profiles',
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
    ClientService.belongsTo(models.Client, { foreignKey: 'client_id' });
    ClientService.belongsTo(models.ServiceCategory, { foreignKey: 'service_category_id' });
    ClientService.belongsTo(models.Profile, { foreignKey: 'profile_id' });
  };

  return ClientService;
};