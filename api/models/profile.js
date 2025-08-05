const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Profile = sequelize.define('Profile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'The name of the profile, e.g., "Real Values" or "Simulation Q1".'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if this is the globally active profile.'
    }
  }, {
    tableName: 'profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Profile;
};