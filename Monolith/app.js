const express = require('express');
const bodyParser = require('body-parser');
const videoRoutes = require('./routes/routes');
const Video = require('./models/Video');
const User = require('./models/User');
const app = express();
app.use(bodyParser.json());
app.use('/api/videos', videoRoutes);

const PORT = process.env.PORT || 4004;

app.listen(PORT, async () => {
  await Video.sync(); 
  await User.sync();
  console.log(`Video service running on port ${PORT}`);
});