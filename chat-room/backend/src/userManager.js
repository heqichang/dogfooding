const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const wsManager = require('./websocketManager');

class UserManager {
  createUser(username) {
    return new Promise((resolve, reject) => {
      const userId = uuidv4();
      const query = `
        INSERT INTO users (id, username)
        VALUES (?, ?)
      `;
      
      db.run(query, [userId, username], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            reject(new Error('Username already exists'));
          } else {
            reject(err);
          }
        } else {
          resolve({
            id: userId,
            username,
            createdAt: new Date().toISOString()
          });
        }
      });
    });
  }

  getUserById(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id,
          username,
          created_at as createdAt
        FROM users
        WHERE id = ?
      `;
      
      db.get(query, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id,
          username,
          created_at as createdAt
        FROM users
        WHERE username = ?
      `;
      
      db.get(query, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  getAllUsers() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id,
          username,
          created_at as createdAt
        FROM users
        ORDER BY username
      `;
      
      db.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const onlineUsers = wsManager.getOnlineUsers();
          rows.forEach(user => {
            user.isOnline = onlineUsers.includes(user.id);
          });
          resolve(rows);
        }
      });
    });
  }

  async getOrCreateUser(username) {
    let user = await this.getUserByUsername(username);
    let isNewUser = false;
    
    if (!user) {
      user = await this.createUser(username);
      isNewUser = true;
    }
    
    return { user, isNewUser };
  }

  searchUsers(query, limit = 10) {
    return new Promise((resolve, reject) => {
      const searchQuery = `
        SELECT 
          id,
          username,
          created_at as createdAt
        FROM users
        WHERE username LIKE ?
        ORDER BY username
        LIMIT ?
      `;
      
      db.all(searchQuery, [`%${query}%`, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const onlineUsers = wsManager.getOnlineUsers();
          rows.forEach(user => {
            user.isOnline = onlineUsers.includes(user.id);
          });
          resolve(rows);
        }
      });
    });
  }
}

module.exports = new UserManager();
