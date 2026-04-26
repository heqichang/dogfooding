const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const wsManager = require('./websocketManager');
const userManager = require('./userManager');

class RoomManager {
  createRoom(name, type = 'group', creatorId = null) {
    return new Promise((resolve, reject) => {
      const roomId = uuidv4();
      const query = `
        INSERT INTO rooms (id, name, type)
        VALUES (?, ?, ?)
      `;
      
      db.run(query, [roomId, name, type], async function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`Room created in database: ${roomId} (${name})`);
          wsManager.createRoom(roomId, name, type);
          
          if (creatorId) {
            try {
              await RoomManager.addMember(roomId, creatorId);
              console.log(`Creator ${creatorId} added to room ${roomId}`);
            } catch (addErr) {
              console.error('Error adding creator to room:', addErr);
            }
          }
          
          resolve({
            id: roomId,
            name,
            type,
            createdAt: new Date().toISOString()
          });
        }
      });
    });
  }

  static addMember(roomId, userId) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR IGNORE INTO room_members (room_id, user_id)
        VALUES (?, ?)
      `;
      
      db.run(query, [roomId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`User ${userId} added to room ${roomId} in database`);
          
          db.get(`SELECT id, name, type FROM rooms WHERE id = ?`, [roomId], (roomErr, roomRow) => {
            if (roomErr) {
              console.error('Error getting room info:', roomErr);
            }
            wsManager.joinRoom(userId, roomId, roomRow);
          });
          
          resolve({
            roomId,
            userId,
            added: this.changes > 0
          });
        }
      });
    });
  }

  removeMember(roomId, userId) {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM room_members
        WHERE room_id = ? AND user_id = ?
      `;
      
      db.run(query, [roomId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          wsManager.leaveRoom(userId, roomId);
          resolve({
            roomId,
            userId,
            removed: this.changes > 0
          });
        }
      });
    });
  }

  getRoomById(roomId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          r.id,
          r.name,
          r.type,
          r.created_at as createdAt,
          COUNT(rm.user_id) as memberCount
        FROM rooms r
        LEFT JOIN room_members rm ON r.id = rm.room_id
        WHERE r.id = ?
        GROUP BY r.id
      `;
      
      db.get(query, [roomId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  getUserRooms(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          r.id,
          r.name,
          r.type,
          r.created_at as createdAt,
          MAX(m.created_at) as lastMessageAt
        FROM rooms r
        JOIN room_members rm ON r.id = rm.room_id
        LEFT JOIN messages m ON r.id = m.room_id
        WHERE rm.user_id = ?
        GROUP BY r.id
        ORDER BY lastMessageAt DESC NULLS LAST, r.created_at DESC
      `;
      
      console.log(`Getting rooms for user ${userId}`);
      
      db.all(query, [userId], (err, rows) => {
        if (err) {
          console.error('Error getting user rooms:', err);
          reject(err);
        } else {
          console.log(`Found ${rows.length} rooms for user ${userId}`);
          resolve(rows);
        }
      });
    });
  }

  getRoomMembers(roomId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          u.id,
          u.username,
          u.created_at as createdAt,
          rm.joined_at as joinedAt
        FROM users u
        JOIN room_members rm ON u.id = rm.user_id
        WHERE rm.room_id = ?
      `;
      
      db.all(query, [roomId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const onlineUsers = wsManager.getOnlineUsers();
          console.log(`Room ${roomId} members from DB: ${rows.length}, online users: ${onlineUsers.length}`);
          
          rows.forEach(member => {
            member.isOnline = onlineUsers.includes(member.id);
          });
          resolve(rows);
        }
      });
    });
  }

  createPrivateRoom(userId1, userId2) {
    return new Promise(async (resolve, reject) => {
      try {
        const existingRoom = await this.findPrivateRoom(userId1, userId2);
        
        if (existingRoom) {
          console.log(`Found existing private room: ${existingRoom.id}`);
          resolve(existingRoom);
          return;
        }
        
        const roomId = uuidv4();
        const roomName = `Private-${userId1}-${userId2}`;
        const query = `
          INSERT INTO rooms (id, name, type)
          VALUES (?, ?, 'private')
        `;
        
        db.run(query, [roomId, roomName], async function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`Private room created: ${roomId}`);
            wsManager.createRoom(roomId, roomName, 'private');
            
            await RoomManager.addMember(roomId, userId1);
            await RoomManager.addMember(roomId, userId2);
            
            resolve({
              id: roomId,
              name: roomName,
              type: 'private',
              createdAt: new Date().toISOString()
            });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  findPrivateRoom(userId1, userId2) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT r.*
        FROM rooms r
        WHERE r.type = 'private'
        AND EXISTS (SELECT 1 FROM room_members rm1 WHERE rm1.room_id = r.id AND rm1.user_id = ?)
        AND EXISTS (SELECT 1 FROM room_members rm2 WHERE rm2.room_id = r.id AND rm2.user_id = ?)
        AND NOT EXISTS (
          SELECT 1 FROM room_members rm3 
          WHERE rm3.room_id = r.id 
          AND rm3.user_id NOT IN (?, ?)
        )
      `;
      
      db.get(query, [userId1, userId2, userId1, userId2], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  isUserInRoom(userId, roomId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 1 FROM room_members
        WHERE user_id = ? AND room_id = ?
      `;
      
      db.get(query, [userId, roomId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }

  getAllPublicRooms(excludeUserId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          r.id,
          r.name,
          r.type,
          r.created_at as createdAt,
          COUNT(rm.user_id) as memberCount
        FROM rooms r
        LEFT JOIN room_members rm ON r.id = rm.room_id
        WHERE r.type = 'group'
      `;
      
      const params = [];
      
      if (excludeUserId) {
        query += `
          AND r.id NOT IN (
            SELECT room_id FROM room_members WHERE user_id = ?
          )
        `;
        params.push(excludeUserId);
      }
      
      query += `
        GROUP BY r.id
        ORDER BY r.created_at DESC
      `;
      
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error('Error getting public rooms:', err);
          reject(err);
        } else {
          console.log(`Found ${rows.length} public rooms`);
          resolve(rows);
        }
      });
    });
  }

  inviteUser(inviterId, inviteeId, roomId) {
    return new Promise(async (resolve, reject) => {
      try {
        const inviterInRoom = await this.isUserInRoom(inviterId, roomId);
        if (!inviterInRoom) {
          reject(new Error('Inviter is not in the room'));
          return;
        }

        const inviteeInRoom = await this.isUserInRoom(inviteeId, roomId);
        if (inviteeInRoom) {
          reject(new Error('User is already in the room'));
          return;
        }

        const userInfo = await userManager.getUserById(inviteeId);
        if (!userInfo) {
          reject(new Error('User not found'));
          return;
        }

        const roomInfo = await this.getRoomById(roomId);
        if (!roomInfo) {
          reject(new Error('Room not found'));
          return;
        }

        resolve({
          inviterId,
          inviteeId,
          roomId,
          roomName: roomInfo.name,
          inviteeName: userInfo.username
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new RoomManager();
