const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Video = require('../models/Video');
const { trimVideo, mergeVideos } = require('./helper');

exports.upload = async (req, res, next) => {
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

    const uploadDir = path.join(__dirname, '../../videos');
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

exports.trim = async (req, res, next) => {
  try {
    const { user } = req;
    const { videoId, start, end } = req.body;

    const videoRecord = await Video.findByPk(videoId);
    if (!videoRecord) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const trimmedVideo = await trimVideo(videoId, start, end);
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

exports.merge = async (req, res, next) => {
  try {
    const { user } = req;
    const { videoIds } = req.body;

    if (!Array.isArray(videoIds) || videoIds.length < 2) {
      return res.status(400).json({
        message: 'Provide at least two video IDs to merge.',
      });
    }

    const mergedVideo = await mergeVideos(videoIds);
    const newRecord = await Video.create({
      userId: user.id,
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
    const videoPath = path.join(__dirname, '../../videos', `${videoRecord.id}.mp4`);

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
