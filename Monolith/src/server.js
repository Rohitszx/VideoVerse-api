const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Routes = require('./routes/routes');
const Video = require('./models/Video');
const User = require('./models/User');
const dotenv = require('dotenv');
dotenv.config(); 

const app = express();
app.use(cors());
app.use(bodyParser.json()); 
app.use('/api/videoverse', Routes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  await Video.sync();
  await User.sync({ alter: true });  
  console.log(`Video service running on port ${PORT}`);
});
