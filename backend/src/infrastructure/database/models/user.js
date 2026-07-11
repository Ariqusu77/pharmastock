const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('department', 'pharmacy'),
      allowNull: false,
      defaultValue: 'department',
    },
    // Which hospital department this user belongs to (null for pharmacy staff)
    departmentName: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: 'users',
    defaultScope: { attributes: { exclude: ['password'] } },
    scopes: { withPassword: { attributes: { include: ['password'] } } },
  }
);

module.exports = User;
