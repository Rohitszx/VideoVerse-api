const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = new Sequelize('sqlite::memory:');  

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = User;
