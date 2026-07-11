const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

// Ledger of every stock change: 'in' when the pharmacy receives drugs,
// 'out' when an approved order deducts them.
const StockMovement = sequelize.define(
  'StockMovement',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.ENUM('in', 'out'), allowNull: false },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    // Stock level of the drug right after this movement was applied
    balanceAfter: { type: DataTypes.INTEGER, allowNull: false },
    // Free-form origin: supplier / invoice number for 'in', order number for 'out'
    reference: { type: DataTypes.STRING, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'stock_movements' }
);

module.exports = StockMovement;
