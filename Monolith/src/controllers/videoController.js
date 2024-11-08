const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Video = require('../models/Video');
const { trimVideo, mergeVideos } = require('./helper');
const ffmpeg = require('fluent-ffmpeg');

exports.upload = async (req, res, next) => {
  try {
    const { user } = req;
    const videoFile = req.files?.video;

    if (!videoFile) {
      return res.status(400).json({ message: 'No video file provided.' });
    }

    const maxSize = 25 * 1024 * 1024; // 25 MB
    const minDuration = 5; // seconds
    const maxDuration = 25; // seconds

    if (videoFile.size > maxSize) {
      return res.status(400).json({ message: 'Video size exceeds the limit.' });
    }

    const uploadDir = path.join(__dirname, '../../videos');
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const uploadPath = path.join(uploadDir, videoFile.name);
    console.log("uploadPath",uploadPath);
    
    const fileExists = await fs.promises.access(uploadPath).then(() => true).catch(() => false);
    if (fileExists) {
      return res.status(400).json({ message: 'File already exists with the same name.' });
    }

    await videoFile.mv(uploadPath);

    ffmpeg.ffprobe(uploadPath, async (err, metadata) => {
      if (err) {
        console.error('Error reading video metadata:', err);
        return res.status(500).json({ message: 'Error processing video file.' });
      }
      const duration = metadata.format.duration;
      if (duration < minDuration || duration > maxDuration) {
        await fs.promises.unlink(uploadPath);
        return res.status(400).json({
          message: `Video duration must be between ${minDuration} and ${maxDuration} seconds.`,
        });
      }

      const videoRecord = await Video.create({
        userId: user.id,
        filename: videoFile.name,
        size: videoFile.size,
        duration: Math.floor(duration),
      });

      res.status(201).json({
        message: 'Video uploaded successfully',
        videoId: videoRecord.id,
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.trim = async (req, res, next) => {
  try {
    const { user } = req;
    const { videoId, start, end } = req.body;

    const videoRecord = await Video.findByPk(videoId);
    if (!videoRecord) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const trimmedVideo = await trimVideo(videoRecord.filename, start, end); 

    const newRecord = await Video.create({
      userId: user.id,
      filename: `trimmed_${videoRecord.filename}`, 
      size: trimmedVideo.size, 
      duration: trimmedVideo.duration, 
    });

    res.status(200).json({
      message: 'Video trimmed successfully',
      video: newRecord,
    });
  } catch (error) {
    next(error);
  }
};

exports.merge = async (req, res, next) => {
  try {
    const { user } = req;
    const { videoIds } = req.body;

    if (!Array.isArray(videoIds) || videoIds.length < 2) {
      return res.status(400).json({
        message: 'Provide at least two video IDs to merge.',
      });
    }
    const videoRecords = await Video.findAll({
      where: {
        id: videoIds,
      },
    });

    if (videoRecords.length !== videoIds.length) {
      return res.status(404).json({ message: 'One or more videos not found.' });
    }
    const videoPaths = videoRecords.map(record => record.filename);
    const mergedVideo = await mergeVideos(videoPaths);
    const newRecord = await Video.create({
      userId: user .id,
      filename: mergedVideo.filename,
    });

    res.status(200).json({
      message: 'Videos merged successfully',
      video: newRecord,
    });
  } catch (error) {
    next(error);
  }
};

exports.fetchAllVideos = async (req, res, next) => {
  try {
    const videos = await Video.findAll();
    res.status(200).json(videos);
  } catch (error) {
    next(error);
  }
};

exports.generateShareLink = async (req, res, next) => {
  try {
    const { videoId } = req.body;
    const { user } = req;

    const videoRecord = await Video.findByPk(videoId);
    if (!videoRecord) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (videoRecord.userId !== user.id) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const shareToken = uuidv4();
    videoRecord.shareToken = shareToken;
    videoRecord.shareExpiry = moment().add(24, 'hours').toDate();
    await videoRecord.save();

    const shareLink = `${req.protocol}://${req.get('host')}/api/videoverse/share/${shareToken}`;
    res.status(200).json({
      message: 'Share link generated successfully',
      shareLink,
      expiresAt: videoRecord.shareExpiry,
    });
  } catch (error) {
    next(error);
  }
};

exports.accessSharedVideo = async (req, res, next) => {
  try {
    const { shareToken } = req.params;
    const videoRecord = await Video.findOne({ where: { shareToken } });

    if (!videoRecord) {
      return res.status(404).json({ message: 'Invalid or expired link' });
    }

    const currentTime = new Date();
    if (currentTime > videoRecord.shareExpiry) {
      return res.status(410).json({ message: 'Link has expired' });
    }
    const videoPath = path.join(__dirname, '../../videos', `${videoRecord.filename}.mp4`);

    res.status(200).json({
      message: 'Access granted',
      video: {
        id: videoRecord.id,
        filename: videoRecord.filename,
        sharedByUserId: videoRecord.userId,
        videoUrl: videoPath,
      },
    });
  } catch (error) {
    next(error);
  }
};
