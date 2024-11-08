const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const generateToken = (user) => {
  console.log('JWT ',  process.env.JWT_SECRET);
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', { expiresIn: '1h' });
};

const signup = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  try {
    const user = await User.create({ username: username.toLowerCase(), password });
    const token = generateToken(user);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error signing up user', error: error.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  try {
    const user = await User.findOne({ where: { username: username.toLowerCase() } });
    console.log('Fetched user from DB:', user);
    if (user && user.password === password) {
      const token = generateToken(user);
      return res.status(200).json({ token });
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in user', error: error.message });
  }
};


module.exports = { signup, login };
