const request = require('supertest');
const express = require('express');
const upload = require('express-fileupload');
const authController = require('../src/controllers/authController');
const videoController = require('../src/controllers/videoController');
const authMiddleware = require('../src/middleware/authMiddleware');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(upload());

app.post('/signup', authController.signup);
app.post('/login', authController.login);
app.post('/upload', authMiddleware, videoController.upload);

jest.mock('../src/models/User'); 
jest.mock('jsonwebtoken'); 
jest.mock('../src/controllers/videoController', () => ({
  upload: (req, res) => {
    res.status(200).json({ message: 'Video uploaded successfully' });
  },
}));

describe('Complete Auth and Video Upload Flow', () => {
  let token;

  beforeAll(() => {
    User.create.mockResolvedValue({
      id: 1,
      username: 'testuser',
      password: 'hashedPassword123', 
    });

    User.findOne.mockResolvedValue({
      id: 1,
      username: 'testuser',
      password: 'password123', 
    });

    jwt.sign.mockReturnValue('mockedJwtToken');
    jwt.verify.mockImplementation((token, secret) => {
      if (token === 'invalidToken') {
        throw new Error('Invalid token');
      }
      return { id: 1 };  
    });
  });

  describe('Signup and Login Flow', () => {
    it('should sign up a new user successfully', async () => {
      const response = await request(app)
        .post('/signup')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      console.log('Signup Response:', response.body);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
    });

    it('should log in an existing user and return a token', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      console.log('Login Response:', response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      token = response.body.token; 
    });

    it('should not log in with incorrect credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword', 
        });

      console.log('Login Response for Incorrect Credentials:', response.body);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('Protected Routes and Token Validation', () => {
    it('should deny access to the upload route without a token', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('video', Buffer.from('fake video content'), 'testVideo.mp4');  

      console.log('No Token Response:', response.body);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided, authorization denied.');
    });

    it('should deny access to the upload route with an invalid token', async () => {
      const response = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer invalidToken') 
        .attach('video', Buffer.from('fake video content'), 'testVideo.mp4');  

      console.log('Invalid Token Response:', response.body);
      expect(response.status).toBe(401);  
      expect(response.body.message).toBe('Token is not valid.');  
    });

    it('should allow access to the upload route with a valid token', async () => {
      const response = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('video', Buffer.from('fake video content'), 'testVideo.mp4'); 

      console.log('Valid Token Upload Response:', response.body);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Video uploaded successfully');
    });
  });
});

