const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token || token !== process.env.API_TOKEN) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  next();
};

module.exports = authenticate;
