const ffmpeg = require('fluent-ffmpeg');

const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      resolve(metadata.format.duration);
    });
  });
};

module.exports = { getVideoDuration, trimVideo, mergeVideos };
