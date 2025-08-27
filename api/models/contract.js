const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Contract = sequelize.define('Contract', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    monthly_rate: {
      type: DataTypes.DECIMAL(10, 2),
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Active', 'Expired', 'Terminated'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    document_url: {
      type: DataTypes.STRING(255),
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
   profile_id: {
     type: DataTypes.INTEGER,
     allowNull: false,
     references: {
       model: 'profiles',
       key: 'id'
     }
   }
  }, {
    tableName: 'contracts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      afterFind: (contracts, options) => {
        if (contracts) {
          if (Array.isArray(contracts)) {
            contracts.forEach(contract => {
              if (!contract.taxes) {
                contract.setDataValue('taxes', []);
              }
            });
          } else {
            if (!contracts.taxes) {
              contracts.setDataValue('taxes', []);
            }
          }
        }
      }
    }
  });

  return Contract;
};