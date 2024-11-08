const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const VideoController = require('../controllers/videoController');
const upload = require('express-fileupload');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/upload', authMiddleware, upload(), VideoController.upload);
router.post('/trim', authMiddleware, VideoController.trim);
router.post('/merge', authMiddleware, VideoController.merge);
router.get('/all', authMiddleware, VideoController.fetchAllVideos);
router.post('/share', authMiddleware, VideoController.generateShareLink);
router.get('/share/:shareToken', VideoController.accessSharedVideo);

module.exports = router;
