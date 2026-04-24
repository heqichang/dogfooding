const pool = require('../database/database');

class ShortLink {
  static async create(shortCode, originalUrl, expiresAt = null) {
    const query = `
      INSERT INTO short_links (short_code, original_url, expires_at) 
      VALUES ($1, $2, $3)
      RETURNING id, short_code, original_url, expires_at, visit_count, created_at, updated_at
    `;
    const values = [shortCode, originalUrl, expiresAt];
    const result = await pool.query(query, values);
    
    return this.mapRowToModel(result.rows[0]);
  }

  static async findByShortCode(shortCode) {
    const query = `
      SELECT * FROM short_links WHERE short_code = $1
    `;
    const values = [shortCode];
    const result = await pool.query(query, values);
    
    return result.rows.length > 0 ? this.mapRowToModel(result.rows[0]) : null;
  }

  static async incrementVisitCount(shortCode) {
    const query = `
      UPDATE short_links 
      SET visit_count = visit_count + 1, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE short_code = $1
    `;
    const values = [shortCode];
    const result = await pool.query(query, values);
    
    return result.rowCount > 0;
  }

  static async findAll() {
    const query = `
      SELECT * FROM short_links ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    
    return result.rows.map(row => this.mapRowToModel(row));
  }

  static async deleteByShortCode(shortCode) {
    const query = `
      DELETE FROM short_links WHERE short_code = $1
    `;
    const values = [shortCode];
    const result = await pool.query(query, values);
    
    return result.rowCount > 0;
  }

  static isExpired(shortLink) {
    if (!shortLink.expiresAt) return false;
    return new Date() > new Date(shortLink.expiresAt);
  }

  static mapRowToModel(row) {
    return {
      id: row.id,
      shortCode: row.short_code,
      originalUrl: row.original_url,
      expiresAt: row.expires_at,
      visitCount: row.visit_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = ShortLink;
