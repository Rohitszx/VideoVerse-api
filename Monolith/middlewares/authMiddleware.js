const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token || token !== config.API_TOKEN) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  next();
};

module.exports = authenticate;
