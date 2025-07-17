'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ContractTax extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ContractTax.init({
    contract_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'contracts',
        key: 'id'
      }
    },
    tax_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Taxes',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'ContractTax',
    tableName: 'contract_taxes',
    timestamps: false
  });
  return ContractTax;
};