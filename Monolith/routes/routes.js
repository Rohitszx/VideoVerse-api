const express = require('express');
const upload = require('express-fileupload');
const authenticate = require('../middlewares/authMiddleware');
const videoService = require('../services/videoService');
const authService = require('../services/authService');

const router = express.Router();
router.post('/signup', authService.signup);
router.post('/login', authService.login);
router.post('/upload', authenticate, upload() , videoService.uploadVideo);
router.post('/trim', authenticate, videoService.trimVideo);


module.exports = router;
