const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Drug = sequelize.define(
  'Drug',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false, defaultValue: 'General' },
    unit: { type: DataTypes.STRING, allowNull: false, defaultValue: 'tablet' },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    // Threshold below which the pharmacy UI flags the drug as low stock
    minStock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'drugs' }
);

module.exports = Drug;
