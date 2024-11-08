const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:');  
const User = require('../models/User');
const Video = require('../models/Video');
const ShareLink = sequelize.define('ShareLink', {
  shareToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,  
  },
  expiry: {
    type: DataTypes.DATE,
    allowNull: false,  
  },
  videoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});


module.exports = ShareLink;
