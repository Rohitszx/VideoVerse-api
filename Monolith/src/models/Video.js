const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:'); 

const Video = sequelize.define('Video', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  shareToken: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  shareExpiry: {
    type: DataTypes.DATE,
    allowNull: true, 
  },
});

module.exports = Video;