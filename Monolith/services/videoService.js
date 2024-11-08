const fs = require('fs');
const path = require('path');
const { Video } = require('../models/Video');
const videoHelper = require('../helpers/videoHelper');

const uploadVideo = async (req, res, next) => {
    try {
      const { user } = req;
      const videoFile = req.files?.video;
  
      if (!videoFile) {
        return res.status(400).json({ message: 'No video file provided.' });
      }
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (videoFile.size > maxSize) {
        return res.status(400).json({ message: 'Video size exceeds the limit.' });
      }
  
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
  
      const videoRecord = await Video.create({
        userId: user.id,
        filename: videoFile.name,
      });
      const uploadPath = path.join(uploadDir, `${videoRecord.id}.mp4`);
      await videoFile.mv(uploadPath);
  
      res.status(201).json({
        message: 'Video uploaded successfully',
        videoId: videoRecord.id,
      });
    } catch (error) {
      next(error); 
    }
};

const trimVideo = async (req, res, next) => {
    try {
        const { user } = req;
        const { videoId, start, end } = req.body;
        const videoRecord = await Video.findByPk(videoId);
        if (!videoRecord) {
            return res.status(404).json({ message: 'Video not found' });
        }
        const trimmedVideo = await videoHelper.trimVideo(videoId, start, end);
        const newRecord = await Video.create({
            userId: user.id,
            filename: trimmedVideo.filename,
        });
        res.status(200).json({
            message: 'Video trimmed successfully',
            video: newRecord,
        });
    } catch (error) {
        next(error);
    }
};
module.exports = { uploadVideo, trimVideo};
