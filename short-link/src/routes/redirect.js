const express = require('express');
const router = express.Router();
const ShortLinkService = require('../services/shortLinkService');

router.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    if (shortCode.startsWith('api/')) {
      return res.status(404).json({
        error: 'Not found'
      });
    }

    const originalUrl = await ShortLinkService.getOriginalUrl(shortCode);

    if (!originalUrl) {
      return res.status(404).json({
        error: 'Short link not found or has expired'
      });
    }

    res.redirect(301, originalUrl);
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
