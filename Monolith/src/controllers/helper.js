const ffmpeg = require('fluent-ffmpeg');  
const path = require('path');  
const fs = require('fs').promises;  
const Video = require('../models/Video');  

// Check if a file exists
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);  
    return true;
  } catch {
    return false;
  }
};
 
const constructFilePath = (filename) => path.join(__dirname, '../../videos', filename);

// Trim video from start to end time
const trimVideo = async (videoId, start, end) => {
  const inputFilePath = constructFilePath(`${videoId}`);
  const outputFilePath = constructFilePath(`trimmed_${videoId}`);

  // Ensure input video exists
  if (!(await fileExists(inputFilePath))) {
    const errorMsg = `Input file does not exist: ${inputFilePath}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Validate start and end times
  if (start < 0 || end <= start) {
    const errorMsg = 'Invalid start or end time for video trimming.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Fetch metadata (duration) for input video
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

  // Trim video using ffmpeg
  await new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .setStartTime(start)
      .setDuration(end - start)
      .output(outputFilePath)
      .on('end', () => resolve())  
      .on('error', (err) => reject(new Error(`Error during video trimming: ${err.message}`)))
      .run();
  });

  // Fetch metadata for the trimmed video
  const trimmedMetadata = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(outputFilePath, (err, metadata) => {
      if (err) {
        console.error('Error fetching metadata for trimmed video:', err.message);
        return reject(new Error(`Error fetching metadata for trimmed video: ${err.message}`));
      }
      resolve(metadata);
    });
  });

  const trimmedDuration = trimmedMetadata.format.duration;
  const trimmedSize = trimmedMetadata.format.size;

  return { 
    filename: `trimmed_${videoId}.mp4`, 
    duration: trimmedDuration, 
    size: trimmedSize
  };
};

// Merge multiple videos into one
const mergeVideos = async (videoIds) => {
  const inputFiles = videoIds.map(id => constructFilePath(`${id}`));
  const outputFilePath = constructFilePath(`merged_${Date.now()}.mp4`);

  // Ensure all input files exist
  for (const file of inputFiles) {
    if (!(await fileExists(file))) {
      const errorMsg = `File not found: ${file}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  // Merge videos using ffmpeg
  await new Promise((resolve, reject) => {
    const command = ffmpeg();
    inputFiles.forEach(file => command.input(file));  

    command
      .on('end', () => resolve())  
      .on('error', (err) => reject(new Error(`Error during video merging: ${err.message}`)))
      .mergeToFile(outputFilePath); 
  });

  // Fetch metadata for the merged video
  const metadata = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(outputFilePath, (err, metadata) => {
      if (err) {
        console.error('Error fetching metadata for merged video:', err.message);
        return reject(new Error(`Error fetching metadata for merged video: ${err.message}`));
      }
      resolve(metadata);
    });
  });

  const mergedDuration = metadata.format.duration;
  const mergedSize = metadata.format.size;

  return { 
    filename: `merged_${Date.now()}.mp4`, 
    duration: mergedDuration, 
    size: mergedSize
  };
};

module.exports = { trimVideo, mergeVideos }; // Export functions for use elsewhere
