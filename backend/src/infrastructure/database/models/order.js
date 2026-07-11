const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'fulfilled', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    note: { type: DataTypes.TEXT, allowNull: true },
    // Set by pharmacy when rejecting, explains the reason
    rejectionReason: { type: DataTypes.TEXT, allowNull: true },
    processedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'orders' }
);

module.exports = Order;
