const request = require('supertest');
const express = require('express');
const authController = require('../src/controllers/authController'); 
const User = require('../src/models/User'); 

const app = express();
app.use(express.json()); 

app.post('/signup', authController.signup);
app.post('/login', authController.login);

jest.mock('../src/models/User'); 

describe('Auth Controller', () => {
  it('should sign up a new user', async () => {
    User.create.mockResolvedValue({ id: 1, username: 'testuser' }); 

    const response = await request(app)
      .post('/signup')
      .send({
        username: 'testuser',
        password: 'password123',
      });

    expect(response.status).toBe(201);
  });

  it('should log in an existing user', async () => {
    User.findOne.mockResolvedValue({
      id: 1,
      username: 'testuser',
      password: 'password123', 
    });

    const response = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'password123',
      });

    expect(response.status).toBe(200);
  });
});
