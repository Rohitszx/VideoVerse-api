const fs = require('fs');
const path = require('path');
const { Video } = require('../models/videoModel');
const videoHelper = require('../helpers/videoHelper');

const validateVideo = (videoFile, res) => {
  if (videoFile.size > config.VIDEO_MAX_SIZE * 1024 * 1024) {
    return res.status(400).json({ message: `Video exceeds the ${config.VIDEO_MAX_SIZE}MB size limit.` });
  }
  return videoHelper.getVideoDuration(videoFile.path).then((duration) => {
    if (duration < config.VIDEO_MIN_DURATION || duration > config.VIDEO_MAX_DURATION) {
      return res.status(400).json({ message: `Video duration must be between ${config.VIDEO_MIN_DURATION} and ${config.VIDEO_MAX_DURATION} seconds.` });
    }
    return duration;
  });
};

const uploadVideo = async (file) => {
  const uploadPath = path.join(__dirname, '..', 'uploads', file.filename);
  
  await validateVideo(file, uploadPath);
  
  const video = await Video.create({ 
    filename: file.filename, 
    path: uploadPath,
    duration: await videoHelper.getVideoDuration(uploadPath),
  });

  return video;
};


module.exports = { uploadVideo, trimVideo, mergeVideos, generateShareLink };
