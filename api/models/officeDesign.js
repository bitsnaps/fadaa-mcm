const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OfficeDesign = sequelize.define('OfficeDesign', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    design_data: {
      type: DataTypes.TEXT,
      allowNull: false,
      note: 'Stores the entire design including floors and objects as a JSON blob',
      get() {
        const value = this.getDataValue('design_data');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('design_data', value ? JSON.stringify(value) : null);
      },
    },
  }, {
    tableName: 'office_designs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return OfficeDesign;
};