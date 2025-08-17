const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    profile_picture: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    preferences: {
      type: DataTypes.TEXT,
      allowNull: true,
      note: 'Stores user-specific settings like theme, language, etc.',
      get() {
        const value = this.getDataValue('preferences');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('preferences', value ? JSON.stringify(value) : null);
      },
    },
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    // Add this to prevent timezone conversion (store raw UTC):
    // dialectOptions: {
    //   useUTC: true, // For UTC dates (recommended)
    // },    
  });

  return User;
};