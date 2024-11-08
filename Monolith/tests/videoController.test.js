// const request = require('supertest');
// const express = require('express');
// const upload = require('express-fileupload');
// const authMiddleware = require('../src/middleware/authMiddleware');
// const authController = require('../src/controllers/authController');
// const VideoController = require('../src/controllers/videoController');
// const User = require('../src/models/User');

// const app = express();

// app.use(express.json());
// app.use(upload());
// app.post('/signup', authController.signup);
// app.post('/login', authController.login);
// app.post('/upload', authMiddleware, VideoController.upload);
// app.get('/all', authMiddleware, VideoController.fetchAllVideos);

// jest.mock('../src/models/User');

// describe('Video Controller E2E Tests', () => {
//   let authToken;
//   beforeAll(async () => {
//     User.create.mockResolvedValue({
//       id: 1,
//       username: 'testuser',
//       password: 'password123',
//     });
//     await request(app)
//       .post('/signup')
//       .send({
//         username: 'testuser',
//         password: 'password123',
//       });
//     const response = await request(app)
//       .post('/login')
//       .send({
//         username: 'testuser',
//         password: 'password123',
//       });
//     authToken = response.body.token;
//   });

//   it('should upload a video successfully', async () => {
//     const response = await request(app)
//       .post('/upload')
//       .set('Authorization', `Bearer ${authToken}`) 
//       .attach('video', 'C:/Users/rs200/Downloads/3764259-hd_1280_720_60fps.mp4'); 

//     expect(response.status).toBe(200);
//     expect(response.body.message).toBe('Video uploaded successfully');
//   });

//   it('should fetch all videos successfully', async () => {
//     const response = await request(app)
//       .get('/all')
//       .set('Authorization', `Bearer ${authToken}`); 

//     expect(response.status).toBe(200);
//     expect(Array.isArray(response.body.videos)).toBe(true); 
//   });
// });
