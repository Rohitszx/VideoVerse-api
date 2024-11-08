# VideoVerse API

VideoVerse is a video processing platform that provides various functionalities like user authentication, video uploading, trimming, merging, and sharing. This project is powered by Node.js and utilizes FFmpeg for video processing tasks.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Setting Up FFmpeg](#setting-up-ffmpeg)
4. [Environment Variables](#environment-variables)
5. [API Endpoints](#api-endpoints)
6. [Running the Project](#running-the-project)
7. [Testing with Postman](#testing-with-postman)

## Prerequisites

Make sure you have the following installed:

- **Node.js** (Version 14.x or higher)
- **FFmpeg** (Required for video processing)
- **Postman** (Optional, for testing the API)

## Installation

1. Clone the repository to your local machine:
   **git clone <repository-url>**
   **cd <project-directory>**
2. Install dependencies using npm:
      **npm install**
3. Set up a .env file to store sensitive information like the database URL, JWT secret, etc.

## Setting Up FFmpeg
FFmpeg is a powerful multimedia framework used for video processing. This project uses FFmpeg for tasks like video trimming, merging, and more. Follow these steps to ensure FFmpeg is installed correctly:

# For Linux/MacOS:
   sudo apt update
   sudo apt install ffmpeg
# For Windows:
   Download FFmpeg from here **[https://ffmpeg.org/download.html]**
   Extract the ZIP file to a directory (e.g., C:\ffmpeg).
   Add the bin folder (e.g., C:\ffmpeg\bin) to your system's PATH environment variable.
   Once installed, verify FFmpeg by running the following command:
   **ffmpeg -version**
   If FFmpeg is correctly installed, you should see its version and configuration details.

# Environment Variables
   Make sure to create a .env file in the root of the project with the following variables:
      PORT=4000
      JWT_SECRET=<Your JWT Secret>

## API Endpoints
   Here are the key API endpoints in the VideoVerse API:

# 1. Sign Up
Method: POST
Endpoint: /api/videoverse/signup
Body:
**{
  "username": "your-username",
  "password": "your-password"
}**
2. Login and Store Token
Method: POST
Endpoint: /api/videoverse/login
Body:
**{
  "username": "your-username",
  "password": "your-password"
}**
The response will include a JWT token that you will need for authentication in other API requests.

# 3. Upload Video
   Method: POST
   Endpoint: /api/videoverse/upload
   Headers: Authorization: Bearer <JWT_Token>
   Body (Form-data):
   video: File upload input
# 4. Trim Video
   Method: POST
   Endpoint: /api/videoverse/trim
   Headers:
   Authorization: Bearer <JWT_Token>
   Body:
   **{
     "videoId": <video-id>,
     "start": <start-time>,
     "end": <end-time>
   }**
# 5. Merge Videos
Method: POST
Endpoint: /api/videoverse/merge
Headers:
Authorization: Bearer <JWT_Token>
Body:
      **{
      "videoIds": ["<video-id-1>", "<video-id-2>"]
      }**
# 6. Generate Share Link
Method: POST
Endpoint: /api/videoverse/share
Headers:
Authorization: Bearer <JWT_Token>
Body:
**{
  "videoId": "<video-id>"
}**

# 7. Fetch Generated Share Link
Method: GET
Endpoint: /api/videoverse/share/:videoId

# 8. Fetch All Videos
Method: GET
Endpoint: /api/videoverse/all


# Running the Project
To start the project locally, run the following command:
**npm start**
This will start the server on http://localhost:4000.

# Testing with Postman
   Import the Postman Collection:
   Download the Postman collection file from the project.
   Open Postman, go to File -> Import and select the collection file.
   Set up the environment:
   Create a new environment in Postman with the name "VideoVerse".
   Add a new variable called authToken to store the authentication token that will be used for making authenticated requests.

# Test the APIs:
   First, send the "Sign Up" request to create a new user.
   Then, send the "Login" request to get the authentication token.
   Use the "Login" token to make authenticated requests to the other endpoints like "Upload Video", "Trim Video", and so on.
