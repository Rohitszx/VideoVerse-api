const request = require('supertest');
const express = require('express');
const authMiddleware = require('../src/middleware/authMiddleware');
const authController = require('../src/controllers/authController'); 
const app = express();

app.use(express.json()); 
app.post('/signup', authController.signup); 
app.post('/login', authController.login); 
app.use(authMiddleware); 

app.get('/protected', (req, res) => {
  res.status(200).json({ message: 'Access granted' });
});

describe('Auth Middleware', () => {
    let token;
  
    beforeAll(async () => {
      await request(app)
        .post('/signup')
        .send({
          username: 'testuser1', 
          password: 'password1234',
        });
  
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser1', 
          password: 'password1234',
        });
  
      console.log('Login Response:', response.body);  
      token = response.body.token; 
    });
  
    it('should deny access if no token is provided', async () => {
      const response = await request(app).get('/protected');
      expect(response.status).toBe(401);
    });
  
    it('should grant access with a valid token', async () => {
      console.log('TOKEN:', token);  // Log the token to ensure it's correctly assigned
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`); 
      expect(response.status).toBe(200);
    });
  });
  
