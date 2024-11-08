const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const User = require('../models/User');
const Video = require('../models/Video');
const ShareLink  = require('../models/ShareLink');

const { trimVideo, mergeVideos } = require('./helper');
const ffmpeg = require('fluent-ffmpeg');

// Upload video handler
exports.upload = async (req, res, next) => {
  try {
    const { user } = req;
    const videoFile = req.files?.video;

    if (!videoFile) {
      return res.status(400).json({ message: 'No video file provided.' });
    }

    // Define video size and duration limits
    const maxSize = 25 * 1024 * 1024; 
    const minDuration = 5; 
    const maxDuration = 25;

    // Check if video size exceeds limit
    if (videoFile.size > maxSize) {
      return res.status(400).json({ message: 'Video size exceeds the limit.' });
    }

    const uploadDir = path.join(__dirname, '../../videos');
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const uploadPath = path.join(uploadDir, videoFile.name);
    console.log("uploadPath", uploadPath);
    
    const fileExists = await fs.promises.access(uploadPath).then(() => true).catch(() => false);
    if (fileExists) {
      return res.status(400).json({ message: 'File already exists with the same name.' });
    }

    await videoFile.mv(uploadPath);

    // Read video metadata to check duration
    ffmpeg.ffprobe(uploadPath, async (err, metadata) => {
      if (err) {
        console.error('Error reading video metadata:', err);
        return res.status(500).json({ message: 'Error processing video file.' });
      }
      const duration = metadata.format.duration;

      // Check if video duration is within allowed limits
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

// Trim video handler
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

// Merge videos handler
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
      userId: user.id,
      filename: mergedVideo.filename,
      size: mergedVideo.size,
      duration: mergedVideo.duration
    });

    res.status(200).json({
      message: 'Videos merged successfully',
      video: newRecord,
    });
  } catch (error) {
    next(error);
  }
};

// Fetch all uploaded videos
exports.fetchAllVideos = async (req, res, next) => {
  try {
    const videos = await Video.findAll();
    res.status(200).json(videos);
  } catch (error) {
    next(error);
  }
};

// Generate a share link for a video
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
    const expiry = moment().add(24, 'hours').toDate();

    const shareLink = await ShareLink.create({
      shareToken,
      expiry,
      videoId: videoRecord.id,
      userId: user.id,
    });

    // Generate the shareable URL
    const shareUrl = `${req.protocol}://${req.get('host')}/api/videoverse/share/${shareToken}`;

    res.status(200).json({
      message: 'Share link generated successfully',
      shareLink: shareUrl,
      expiresAt: shareLink.expiry,
    });
  } catch (error) {
    next(error);
  }
};

// Access shared video via share link
exports.accessSharedVideo = async (req, res, next) => {
  try {
    const { shareToken } = req.params;

    // Fetch the share link by token
    const shareLink = await ShareLink.findOne({
      where: { shareToken },
    });

    // Check if the share link is valid and not expired
    if (!shareLink) {
      return res.status(404).json({ message: 'Invalid or expired link' });
    }
    const currentTime = new Date();
    if (currentTime > shareLink.expiry) {
      return res.status(410).json({ message: 'Link has expired' });
    }

    // Fetch the video associated with the share link
    const video = await Video.findOne({
      where: { id: shareLink.videoId },
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    const videoPath = path.join(__dirname, '../../videos', `${video.filename}`);

    res.status(200).json({
      message: 'Access granted',
      video: {
        id: video.id,
        filename: video.filename,
        sharedByUserId: video.user ? video.user.id : null, 
        videoUrl: videoPath,
      },
    });
  } catch (error) {
    next(error);
  }
};
