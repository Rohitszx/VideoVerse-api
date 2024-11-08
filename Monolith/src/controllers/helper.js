const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const Video = require('../models/Video');
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const constructFilePath = (filename) => path.join(__dirname, '../../videos', filename);

const trimVideo = async (videoId, start, end) => {
  const inputFilePath = constructFilePath(`${videoId}`);
  const outputFilePath = constructFilePath(`trimmed_${videoId}`);
  if (!(await fileExists(inputFilePath))) {
    const errorMsg = `Input file does not exist: ${inputFilePath}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (start < 0 || end <= start) {
    const errorMsg = 'Invalid start or end time for video trimming.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const metadata = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputFilePath, (err, metadata) => {
      if (err) {
        console.error('Error fetching metadata:', err.message);
        return reject(new Error(`Error fetching metadata: ${err.message}`));
      }
      resolve(metadata);
    });
  });

  const duration = metadata.format.duration;
  if (end > duration) {
    const errorMsg = 'End time exceeds video duration.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  await new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .setStartTime(start)
      .setDuration(end - start)
      .output(outputFilePath)
      .on('end', () => {
        console.log(`Video trimmed successfully: ${outputFilePath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg Error during trimming:', err.message);
        reject(new Error(`Error during video trimming: ${err.message}`));
      })
      .run();
  });

  return { filename: `trimmed_${videoId}.mp4` };
};


const mergeVideos = async (videoIds) => {
  const inputFiles = videoIds.map(id => constructFilePath(`${id}`));
  const outputFilePath = constructFilePath(`merged_${Date.now()}.mp4`);

  for (const file of inputFiles) {
    if (!(await fileExists(file))) {
      const errorMsg = `File not found: ${file}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  return new Promise((resolve, reject) => {
    const command = ffmpeg();

    inputFiles.forEach(file => {
      command.input(file);
    });

    command
      .on('end', () => {
        console.log(`Videos merged successfully: ${outputFilePath}`);
        resolve({ filename: path.basename(outputFilePath) });
      })
      .on('error', (err) => {
        console.error('FFmpeg Error during merging:', err.message);
        reject(new Error(`Error during video merging: ${err.message}`));
      })
      .mergeToFile(outputFilePath);
  });
};

module.exports = { trimVideo, mergeVideos };
