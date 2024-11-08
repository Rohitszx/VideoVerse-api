const express = require('express');
const bodyParser = require('body-parser');
const videoRoutes = require('./routes/videoRoutes');
const Video = require('./models/Video');

const app = express();
app.use(bodyParser.json());
app.use('/videos', videoRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  await Video.sync(); 
  console.log(`Video service running on port ${PORT}`);
});