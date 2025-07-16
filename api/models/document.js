const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Contract', 'Report', 'Identification', 'Other'),
      allowNull: false,
   },
   client_id: {
     type: DataTypes.INTEGER,
     allowNull: false,
     references: {
       model: 'clients',
       key: 'id'
     }
   },
  investment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'investments',
      key: 'id'
    }
  },
  uploaded_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
 }, {
    tableName: 'documents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Document;
};