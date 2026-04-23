const express = require('express');
const router = express.Router();
const ShortLinkService = require('../services/shortLinkService');

router.post('/short-links', async (req, res) => {
  try {
    const { originalUrl, customShortCode, expiresInDays } = req.body;

    if (!originalUrl) {
      return res.status(400).json({
        error: 'originalUrl is required'
      });
    }

    const result = await ShortLinkService.createShortLink(originalUrl, {
      customShortCode,
      expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating short link:', error);
    res.status(400).json({
      error: error.message
    });
  }
});

router.get('/short-links', async (req, res) => {
  try {
    const shortLinks = await ShortLinkService.getAllShortLinks();
    res.json(shortLinks);
  } catch (error) {
    console.error('Error getting short links:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

router.get('/short-links/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const shortLink = await ShortLinkService.getShortLinkInfo(shortCode);

    if (!shortLink) {
      return res.status(404).json({
        error: 'Short link not found'
      });
    }

    res.json(shortLink);
  } catch (error) {
    console.error('Error getting short link:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

router.delete('/short-links/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const deleted = await ShortLinkService.deleteShortLink(shortCode);

    if (!deleted) {
      return res.status(404).json({
        error: 'Short link not found'
      });
    }

    res.json({
      message: 'Short link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting short link:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
