const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Office = sequelize.define('Office', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      note: 'e.g., Office 101, Desk 12',
    },
    type: {
      type: DataTypes.ENUM('Private Suite', 'Coworking Desk', 'Virtual Office'),
      allowNull: false,
      note: 'e.g., Private Suite, Coworking Desk, Virtual Office',
    },
    capacity: {
      type: DataTypes.INTEGER,
    },
    status: {
      type: DataTypes.ENUM('Available', 'Occupied', 'Maintenance', 'Unavailable'),
      allowNull: false,
      defaultValue: 'Available',
    },
    floor_plan_object_id: {
      type: DataTypes.INTEGER,
      note: 'Link to the visual representation in Office Designer',
    },
  }, {
    tableName: 'offices',
    timestamps: false,
  });

  return Office;
};