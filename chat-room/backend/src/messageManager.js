const { v4: uuidv4 } = require('uuid');
const db = require('./database');

class MessageManager {
  createMessage(roomId, senderId, content, type = 'text') {
    return new Promise((resolve, reject) => {
      const messageId = uuidv4();
      const query = `
        INSERT INTO messages (id, room_id, sender_id, content, type)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.run(query, [messageId, roomId, senderId, content, type], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: messageId,
            roomId,
            senderId,
            content,
            type,
            createdAt: new Date().toISOString()
          });
        }
      });
    });
  }

  getMessages(roomId, limit = 50, before = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          m.id,
          m.room_id as roomId,
          m.sender_id as senderId,
          m.content,
          m.type,
          m.created_at as createdAt,
          u.username as senderName
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.room_id = ?
      `;
      
      const params = [roomId];
      
      if (before) {
        query += ' AND m.created_at < ?';
        params.push(before);
      }
      
      query += ' ORDER BY m.created_at DESC LIMIT ?';
      params.push(limit);
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const messages = rows.reverse();
          
          const messageIds = messages.map(m => m.id);
          if (messageIds.length === 0) {
            resolve({ messages, hasMore: false });
            return;
          }
          
          const placeholders = messageIds.map(() => '?').join(',');
          const readQuery = `
            SELECT message_id, user_id, read_at
            FROM read_receipts
            WHERE message_id IN (${placeholders})
          `;
          
          db.all(readQuery, messageIds, (readErr, readRows) => {
            if (readErr) {
              console.error('Error getting read receipts:', readErr);
            } else {
              const readReceipts = new Map();
              readRows.forEach(row => {
                if (!readReceipts.has(row.message_id)) {
                  readReceipts.set(row.message_id, []);
                }
                readReceipts.get(row.message_id).push({
                  userId: row.user_id,
                  readAt: row.read_at
                });
              });
              
              messages.forEach(msg => {
                msg.readReceipts = readReceipts.get(msg.id) || [];
              });
            }
            
            const hasMore = rows.length === limit;
            resolve({ messages, hasMore });
          });
        }
      });
    });
  }

  markAsRead(messageId, userId) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR IGNORE INTO read_receipts (message_id, user_id)
        VALUES (?, ?)
      `;
      
      db.run(query, [messageId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            messageId,
            userId,
            readAt: new Date().toISOString()
          });
        }
      });
    });
  }

  markAllMessagesAsRead(roomId, userId) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR IGNORE INTO read_receipts (message_id, user_id)
        SELECT m.id, ?
        FROM messages m
        WHERE m.room_id = ? AND m.sender_id != ?
        AND NOT EXISTS (
          SELECT 1 FROM read_receipts rr 
          WHERE rr.message_id = m.id AND rr.user_id = ?
        )
      `;
      
      db.run(query, [userId, roomId, userId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            roomId,
            userId,
            count: this.changes
          });
        }
      });
    });
  }

  getUnreadCount(roomId, userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count
        FROM messages m
        LEFT JOIN read_receipts rr ON m.id = rr.message_id AND rr.user_id = ?
        WHERE m.room_id = ? AND m.sender_id != ? AND rr.id IS NULL
      `;
      
      db.get(query, [userId, roomId, userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row?.count || 0);
        }
      });
    });
  }

  getMessageById(messageId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          m.id,
          m.room_id as roomId,
          m.sender_id as senderId,
          m.content,
          m.type,
          m.created_at as createdAt,
          u.username as senderName
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `;
      
      db.get(query, [messageId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

module.exports = new MessageManager();
