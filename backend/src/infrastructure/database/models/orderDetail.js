const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const OrderDetail = sequelize.define(
  'OrderDetail',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
  },
  { tableName: 'order_details' }
);

module.exports = OrderDetail;
