const sequelize = require('../sequelize');
const User = require('./user');
const Drug = require('./drug');
const Order = require('./order');
const OrderDetail = require('./orderDetail');
const StockMovement = require('./stockMovement');

// A department user places many orders
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'requester' });

// A pharmacy user processes (approves/rejects/fulfills) many orders
User.hasMany(Order, { foreignKey: 'processedById', as: 'processedOrders' });
Order.belongsTo(User, { foreignKey: 'processedById', as: 'processedBy' });

// Order <-> Drug through OrderDetail
Order.hasMany(OrderDetail, { foreignKey: 'orderId', as: 'details', onDelete: 'CASCADE' });
OrderDetail.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Drug.hasMany(OrderDetail, { foreignKey: 'drugId', as: 'orderDetails' });
OrderDetail.belongsTo(Drug, { foreignKey: 'drugId', as: 'drug' });

// Stock ledger: every movement points at a drug and the user who caused it
Drug.hasMany(StockMovement, { foreignKey: 'drugId', as: 'movements' });
StockMovement.belongsTo(Drug, { foreignKey: 'drugId', as: 'drug' });

User.hasMany(StockMovement, { foreignKey: 'userId', as: 'stockMovements' });
StockMovement.belongsTo(User, { foreignKey: 'userId', as: 'recordedBy' });

module.exports = { sequelize, User, Drug, Order, OrderDetail, StockMovement };
