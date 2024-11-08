const express = require('express');
const multer = require('multer');
const authenticate = require('../middlewares/authMiddleware');
const videoService = require('../services/videoService');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Upload video
router.post('/upload', authenticate, upload.single('video'), async (req, res) => {
  try {
    const video = await videoService.uploadVideo(req.file);
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Trim video
router.post('/trim/:videoId', authenticate, async (req, res) => {
  try {
    const { start, end } = req.body;
    const video = await videoService.trimVideo(req.params.videoId, start, end);
    res.status(200).json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Merge videos
router.post('/merge', authenticate, async (req, res) => {
  try {
    const videoIds = req.body.videoIds;
    const mergedVideo = await videoService.mergeVideos(videoIds);
    res.status(200).json(mergedVideo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate share link
router.get('/share/:videoId', authenticate, async (req, res) => {
  try {
    const { link, expiry } = await videoService.generateShareLink(req.params.videoId);
    res.status(200).json({ link, expiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
