const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClientAttachment = sequelize.define('ClientAttachment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    uploaded_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
  }, {
    tableName: 'client_attachments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return ClientAttachment;
};