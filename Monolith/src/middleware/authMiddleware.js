const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    req.user = decoded;  
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is not valid.' });
  }
};

module.exports = authMiddleware;