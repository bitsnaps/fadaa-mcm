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
     taxId: {
       type: DataTypes.INTEGER,
       allowNull: true,
       references: {
           model: 'Taxes',
           key: 'id'
       }
     }
  }, {
    tableName: 'contracts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Contract.associate = (models) => {
   Contract.belongsTo(models.Tax, { foreignKey: 'taxId' });
  };

  return Contract;
};