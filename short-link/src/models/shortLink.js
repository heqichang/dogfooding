const db = require('../database/database');

class ShortLink {
  static async create(shortCode, originalUrl, expiresAt = null) {
    await db.read();
    
    const now = new Date().toISOString();
    const shortLink = {
      id: db.data.nextId++,
      shortCode,
      originalUrl,
      expiresAt,
      visitCount: 0,
      createdAt: now,
      updatedAt: now
    };

    db.data.shortLinks.push(shortLink);
    await db.write();

    return shortLink;
  }

  static async findByShortCode(shortCode) {
    await db.read();
    const shortLink = db.data.shortLinks.find(link => link.shortCode === shortCode);
    return shortLink || null;
  }

  static async incrementVisitCount(shortCode) {
    await db.read();
    const index = db.data.shortLinks.findIndex(link => link.shortCode === shortCode);
    
    if (index === -1) {
      return false;
    }

    db.data.shortLinks[index].visitCount++;
    db.data.shortLinks[index].updatedAt = new Date().toISOString();
    await db.write();

    return true;
  }

  static async findAll() {
    await db.read();
    return [...db.data.shortLinks].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  static async deleteByShortCode(shortCode) {
    await db.read();
    const index = db.data.shortLinks.findIndex(link => link.shortCode === shortCode);
    
    if (index === -1) {
      return false;
    }

    db.data.shortLinks.splice(index, 1);
    await db.write();

    return true;
  }

  static isExpired(shortLink) {
    if (!shortLink.expiresAt) return false;
    return new Date() > new Date(shortLink.expiresAt);
  }
}

module.exports = ShortLink;
