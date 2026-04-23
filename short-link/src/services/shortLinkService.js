const { nanoid } = require('nanoid');
const ShortLink = require('../models/shortLink');
const dotenv = require('dotenv');

dotenv.config();

const SHORT_CODE_LENGTH = parseInt(process.env.SHORT_CODE_LENGTH) || 6;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

class ShortLinkService {
  static async generateShortCode() {
    let shortCode;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortCode = nanoid(SHORT_CODE_LENGTH);
      const existing = await ShortLink.findByShortCode(shortCode);
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique short code after multiple attempts');
    }

    return shortCode;
  }

  static async createShortLink(originalUrl, options = {}) {
    const { customShortCode, expiresInDays } = options;

    if (!this.isValidUrl(originalUrl)) {
      throw new Error('Invalid URL format');
    }

    let shortCode;
    let isCustom = false;

    if (customShortCode) {
      if (!this.isValidShortCode(customShortCode)) {
        throw new Error('Invalid custom short code. Only alphanumeric characters, hyphens, and underscores are allowed.');
      }

      const existing = await ShortLink.findByShortCode(customShortCode);
      if (existing) {
        throw new Error('Custom short code already exists');
      }

      shortCode = customShortCode;
      isCustom = true;
    } else {
      shortCode = await this.generateShortCode();
    }

    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      expiresAt = expiresAt.toISOString();
    }

    const shortLink = await ShortLink.create(shortCode, originalUrl, expiresAt);

    return {
      ...shortLink,
      shortUrl: `${BASE_URL}/${shortCode}`,
      isCustom
    };
  }

  static async getOriginalUrl(shortCode) {
    const shortLink = await ShortLink.findByShortCode(shortCode);

    if (!shortLink) {
      return null;
    }

    if (ShortLink.isExpired(shortLink)) {
      return null;
    }

    await ShortLink.incrementVisitCount(shortCode);

    return shortLink.originalUrl;
  }

  static async getShortLinkInfo(shortCode) {
    const shortLink = await ShortLink.findByShortCode(shortCode);

    if (!shortLink) {
      return null;
    }

    return {
      ...shortLink,
      shortUrl: `${BASE_URL}/${shortCode}`,
      isExpired: ShortLink.isExpired(shortLink)
    };
  }

  static async getAllShortLinks() {
    const shortLinks = await ShortLink.findAll();
    return shortLinks.map(link => ({
      ...link,
      shortUrl: `${BASE_URL}/${link.shortCode}`,
      isExpired: ShortLink.isExpired(link)
    }));
  }

  static async deleteShortLink(shortCode) {
    return await ShortLink.deleteByShortCode(shortCode);
  }

  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidShortCode(shortCode) {
    const regex = /^[a-zA-Z0-9_-]+$/;
    return regex.test(shortCode) && shortCode.length >= 2 && shortCode.length <= 20;
  }
}

module.exports = ShortLinkService;
