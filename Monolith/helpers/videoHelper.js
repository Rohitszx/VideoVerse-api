const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const constructFilePath = (filename) => path.join(__dirname, '../uploads', filename);

const trimVideo = async (videoId, start, end) => {
  const inputFilePath = constructFilePath(`${videoId}.mp4`);
  const outputFilePath = constructFilePath(`trimmed_${videoId}.mp4`);

  console.log('Trim video - Input Path:', inputFilePath);
  console.log('Trim video - Output Path:', outputFilePath);

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
      console.log('Video Metadata:', metadata);
      resolve(metadata);
    });
  });

  const duration = metadata.format.duration;
  console.log('Video Duration:', duration);

  // Ensure the 'end' time is within the video's duration
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

module.exports = { trimVideo };
