require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const fs = require('fs');
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const apiRoutes = require('./routes/api');
const redirectRoutes = require('./routes/redirect');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);
app.use('/', redirectRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'Short Link Service',
    version: '1.0.0',
    description: 'A RESTful API for creating and managing short links',
    endpoints: {
      'POST /api/short-links': 'Create a new short link',
      'GET /api/short-links': 'Get all short links',
      'GET /api/short-links/:shortCode': 'Get details of a specific short link',
      'DELETE /api/short-links/:shortCode': 'Delete a specific short link',
      'GET /:shortCode': 'Redirect to the original URL'
    },
    example: {
      request: {
        method: 'POST',
        url: '/api/short-links',
        body: {
          originalUrl: 'https://example.com',
          customShortCode: 'my-link',
          expiresInDays: 30
        }
      },
      response: {
        shortCode: 'my-link',
        originalUrl: 'https://example.com',
        shortUrl: 'http://localhost:3000/my-link',
        expiresAt: '2024-05-23T10:30:00.000Z',
        visitCount: 0
      }
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Short Link Service is running on http://localhost:${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}`);
});
