'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tax extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Tax.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    bearer: {
        type: DataTypes.ENUM('Client', 'Company'),
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
    }
  }, {
    sequelize,
    modelName: 'Tax',
    paranoid: true, // Enable soft deletes
  });
  return Tax;
};