const { v4: uuidv4 } = require('uuid');

class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.users = new Map();
    this.rooms = new Map();
    this.typingUsers = new Map();
  }

  addConnection(ws, userId) {
    const connectionId = uuidv4();
    this.connections.set(connectionId, { ws, userId });
    
    if (!this.users.has(userId)) {
      this.users.set(userId, new Set());
    }
    this.users.get(userId).add(connectionId);
    
    console.log(`User ${userId} connected with connection ${connectionId}`);
    
    return connectionId;
  }

  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { userId } = connection;
    
    console.log(`User ${userId} disconnected connection ${connectionId}`);
    
    if (this.users.has(userId)) {
      const userConnections = this.users.get(userId);
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        console.log(`User ${userId} has no more connections, removing from online users`);
        this.users.delete(userId);
        
        this.rooms.forEach((room, roomId) => {
          if (room.members.has(userId)) {
            room.members.delete(userId);
            this.broadcastToRoom(roomId, {
              type: 'user_left',
              roomId,
              userId,
              timestamp: Date.now()
            }, userId);
          }
        });
      }
    }

    this.connections.delete(connectionId);
  }

  getUserConnections(userId) {
    const connectionIds = this.users.get(userId);
    if (!connectionIds) return [];
    return Array.from(connectionIds)
      .map(id => this.connections.get(id)?.ws)
      .filter(Boolean);
  }

  getOnlineUsers() {
    return Array.from(this.users.keys());
  }

  isUserOnline(userId) {
    return this.users.has(userId);
  }

  createRoom(roomId, roomName, type = 'group') {
    if (!this.rooms.has(roomId)) {
      console.log(`Creating room in memory: ${roomId} (${roomName})`);
      this.rooms.set(roomId, {
        id: roomId,
        name: roomName,
        type,
        members: new Set()
      });
    }
    return this.rooms.get(roomId);
  }

  joinRoom(userId, roomId, roomInfo = null) {
    if (!this.rooms.has(roomId)) {
      const roomName = roomInfo?.name || `Room-${roomId.substring(0, 8)}`;
      const roomType = roomInfo?.type || 'group';
      console.log(`Room ${roomId} not found in memory, creating it now: ${roomName}`);
      this.createRoom(roomId, roomName, roomType);
    }

    const room = this.rooms.get(roomId);
    const wasMember = room.members.has(userId);
    room.members.add(userId);

    if (!wasMember) {
      console.log(`User ${userId} joined room ${roomId}`);
      this.broadcastToRoom(roomId, {
        type: 'user_joined',
        roomId,
        userId,
        timestamp: Date.now()
      }, userId);
    }

    return true;
  }

  leaveRoom(userId, roomId) {
    if (!this.rooms.has(roomId)) return false;

    const room = this.rooms.get(roomId);
    const wasMember = room.members.has(userId);
    room.members.delete(userId);

    if (wasMember) {
      console.log(`User ${userId} left room ${roomId}`);
      this.broadcastToRoom(roomId, {
        type: 'user_left',
        roomId,
        userId,
        timestamp: Date.now()
      });
    }

    return true;
  }

  getRoomMembers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.members) : [];
  }

  broadcastToRoom(roomId, message, excludeUserId = null) {
    const room = this.rooms.get(roomId);
    if (!room) {
      console.warn(`Room ${roomId} not found in memory for broadcast`);
      return;
    }

    const membersToBroadcast = Array.from(room.members);
    console.log(`Broadcasting to room ${roomId}, members: ${membersToBroadcast.length}, exclude: ${excludeUserId}`);

    membersToBroadcast.forEach(memberId => {
      if (memberId !== excludeUserId) {
        this.sendToUser(memberId, message);
      }
    });
  }

  sendToUser(userId, message) {
    const connections = this.getUserConnections(userId);
    console.log(`Sending to user ${userId}, connections: ${connections.length}`);
    
    connections.forEach(ws => {
      try {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify(message));
        }
      } catch (error) {
        console.error('Error sending message to user:', userId, error);
      }
    });
  }

  broadcastToAll(message, excludeUserId = null) {
    const onlineUsers = this.getOnlineUsers();
    console.log(`Broadcasting to all online users: ${onlineUsers.length}, exclude: ${excludeUserId}`);
    
    onlineUsers.forEach(userId => {
      if (userId !== excludeUserId) {
        this.sendToUser(userId, message);
      }
    });
  }

  sendUserOnlineStatus(userId, isOnline, roomId = null) {
    const statusMessage = {
      type: isOnline ? 'user_online' : 'user_offline',
      userId,
      timestamp: Date.now()
    };

    if (roomId) {
      this.broadcastToRoom(roomId, statusMessage, userId);
    } else {
      const userRooms = this.getUserRooms(userId);
      userRooms.forEach(room => {
        this.broadcastToRoom(room.id, statusMessage, userId);
      });
    }
  }

  getUserRooms(userId) {
    const userRooms = [];
    this.rooms.forEach((room, roomId) => {
      if (room.members.has(userId)) {
        userRooms.push({
          id: room.id,
          name: room.name,
          type: room.type
        });
      }
    });
    return userRooms;
  }

  setTyping(userId, roomId, isTyping) {
    const key = `${userId}:${roomId}`;
    
    if (isTyping) {
      if (!this.typingUsers.has(key)) {
        this.typingUsers.set(key, {
          userId,
          roomId,
          timestamp: Date.now()
        });
        
        this.broadcastToRoom(roomId, {
          type: 'typing',
          roomId,
          userId,
          isTyping: true,
          timestamp: Date.now()
        }, userId);
      }
    } else {
      if (this.typingUsers.has(key)) {
        this.typingUsers.delete(key);
        
        this.broadcastToRoom(roomId, {
          type: 'typing',
          roomId,
          userId,
          isTyping: false,
          timestamp: Date.now()
        }, userId);
      }
    }
  }

  getTypingUsers(roomId) {
    const typing = [];
    this.typingUsers.forEach((value, key) => {
      if (value.roomId === roomId) {
        typing.push(value.userId);
      }
    });
    return typing;
  }

  cleanup() {
    const now = Date.now();
    const timeout = 30000;
    
    this.typingUsers.forEach((value, key) => {
      if (now - value.timestamp > timeout) {
        this.typingUsers.delete(key);
      }
    });
  }
}

module.exports = new WebSocketManager();
