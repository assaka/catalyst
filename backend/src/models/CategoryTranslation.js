const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CategoryTranslation = sequelize.define('CategoryTranslation', {
  category_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    references: { model: 'categories', key: 'id' }
  },
  language_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    primaryKey: true,
    references: { model: 'languages', key: 'code' }
  },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'category_translations',
  underscored: true
});

module.exports = CategoryTranslation;
