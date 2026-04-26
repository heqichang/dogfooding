const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const db = require('./database');
const wsManager = require('./websocketManager');
const messageManager = require('./messageManager');
const roomManager = require('./roomManager');
const userManager = require('./userManager');

async function startServer() {
  await db.init();
  console.log('Database initialized');

  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.get('/api/users', async (req, res) => {
    try {
      console.log('GET /api/users called');
      const users = await userManager.getAllUsers();
      console.log('GET /api/users returning:', users.length, 'users');
      res.json(users);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const { username } = req.body;
      console.log('POST /api/users with username:', username);
      
      if (!username || username.trim() === '') {
        return res.status(400).json({ error: 'Username is required' });
      }
      
      const { user, isNewUser } = await userManager.getOrCreateUser(username.trim());
      console.log('User created/fetched:', user, 'isNewUser:', isNewUser);
      
      if (isNewUser) {
        console.log('Broadcasting new user registration to all online users');
        wsManager.broadcastToAll({
          type: 'user_registered',
          user,
          timestamp: Date.now()
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.get('/api/users/:userId/rooms', async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('GET /api/users/:userId/rooms for user:', userId);
      
      const rooms = await roomManager.getUserRooms(userId);
      console.log('User rooms:', rooms.length);
      
      for (const room of rooms) {
        room.unreadCount = await messageManager.getUnreadCount(room.id, userId);
      }
      
      res.json(rooms);
    } catch (error) {
      console.error('Error getting user rooms:', error);
      res.status(500).json({ error: 'Failed to get rooms' });
    }
  });

  app.post('/api/rooms', async (req, res) => {
    try {
      const { name, type, creatorId } = req.body;
      console.log('POST /api/rooms:', { name, type, creatorId });
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Room name is required' });
      }
      
      const room = await roomManager.createRoom(name.trim(), type || 'group', creatorId);
      console.log('Room created:', room);
      
      const creatorInfo = await userManager.getUserById(creatorId);
      wsManager.broadcastToAll({
        type: 'room_created',
        room,
        creatorName: creatorInfo?.username,
        timestamp: Date.now()
      }, creatorId);
      
      res.json(room);
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  });

  app.get('/api/rooms/public', async (req, res) => {
    try {
      const { excludeUserId } = req.query;
      console.log('GET /api/rooms/public, excludeUserId:', excludeUserId);
      
      const rooms = await roomManager.getAllPublicRooms(excludeUserId);
      console.log('Public rooms found:', rooms.length);
      
      res.json(rooms);
    } catch (error) {
      console.error('Error getting public rooms:', error);
      res.status(500).json({ error: 'Failed to get public rooms' });
    }
  });

  app.post('/api/rooms/invite', async (req, res) => {
    try {
      const { inviterId, inviteeId, roomId } = req.body;
      console.log('POST /api/rooms/invite:', { inviterId, inviteeId, roomId });
      
      if (!inviterId || !inviteeId || !roomId) {
        return res.status(400).json({ error: 'Inviter ID, invitee ID, and room ID are required' });
      }
      
      const inviteInfo = await roomManager.inviteUser(inviterId, inviteeId, roomId);
      
      const inviterInfo = await userManager.getUserById(inviterId);
      wsManager.sendToUser(inviteeId, {
        type: 'invitation',
        inviterId,
        inviterName: inviterInfo?.username,
        roomId,
        roomName: inviteInfo.roomName,
        timestamp: Date.now()
      });
      
      console.log('Invitation sent:', inviteInfo);
      res.json(inviteInfo);
    } catch (error) {
      console.error('Error inviting user:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/rooms/private', async (req, res) => {
    try {
      const { userId1, userId2 } = req.body;
      console.log('POST /api/rooms/private:', { userId1, userId2 });
      
      if (!userId1 || !userId2) {
        return res.status(400).json({ error: 'Both user IDs are required' });
      }
      
      const room = await roomManager.createPrivateRoom(userId1, userId2);
      console.log('Private room created/found:', room);
      
      res.json(room);
    } catch (error) {
      console.error('Error creating private room:', error);
      res.status(500).json({ error: 'Failed to create private room' });
    }
  });

  app.post('/api/rooms/:roomId/join', async (req, res) => {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;
      console.log('POST /api/rooms/:roomId/join:', { roomId, userId });
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const result = await roomManager.constructor.addMember(roomId, userId);
      console.log('Join result:', result);
      
      res.json(result);
    } catch (error) {
      console.error('Error joining room:', error);
      res.status(500).json({ error: 'Failed to join room' });
    }
  });

  app.get('/api/rooms/:roomId/members', async (req, res) => {
    try {
      const { roomId } = req.params;
      console.log('GET /api/rooms/:roomId/members:', roomId);
      
      const members = await roomManager.getRoomMembers(roomId);
      console.log('Room members:', members.length);
      
      res.json(members);
    } catch (error) {
      console.error('Error getting room members:', error);
      res.status(500).json({ error: 'Failed to get room members' });
    }
  });

  app.get('/api/rooms/:roomId/messages', async (req, res) => {
    try {
      const { roomId } = req.params;
      const { limit, before } = req.query;
      console.log('GET /api/rooms/:roomId/messages:', { roomId, limit, before });
      
      const result = await messageManager.getMessages(
        roomId,
        limit ? parseInt(limit) : 50,
        before
      );
      
      console.log('Messages found:', result.messages.length, 'hasMore:', result.hasMore);
      res.json(result);
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  });

  app.post('/api/messages/:messageId/read', async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId } = req.body;
      console.log('POST /api/messages/:messageId/read:', { messageId, userId });
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const result = await messageManager.markAsRead(messageId, userId);
      res.json(result);
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  });

  app.post('/api/rooms/:roomId/read', async (req, res) => {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;
      console.log('POST /api/rooms/:roomId/read:', { roomId, userId });
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const result = await messageManager.markAllMessagesAsRead(roomId, userId);
      res.json(result);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    
    let connectionId = null;
    let userId = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log('WebSocket message received:', data.type);
        
        switch (data.type) {
          case 'auth':
            userId = data.userId;
            if (userId) {
              const wasOnline = wsManager.isUserOnline(userId);
              connectionId = wsManager.addConnection(ws, userId);
              console.log(`User ${userId} authenticated with connection ${connectionId}, wasOnline: ${wasOnline}`);
              
              ws.send(JSON.stringify({
                type: 'auth_success',
                userId,
                timestamp: Date.now()
              }));
              
              const userRooms = await roomManager.getUserRooms(userId);
              console.log(`User ${userId} has ${userRooms.length} rooms, joining them all`);
              
              for (const room of userRooms) {
                console.log(`Joining user ${userId} to room ${room.id} (${room.name})`);
                wsManager.joinRoom(userId, room.id, room);
                
                if (!wasOnline) {
                  const userInfo = await userManager.getUserById(userId);
                  wsManager.broadcastToRoom(room.id, {
                    type: 'user_online',
                    userId,
                    username: userInfo?.username,
                    timestamp: Date.now()
                  }, userId);
                }
              }
              
              console.log(`Current online users: ${wsManager.getOnlineUsers().length}`);
            }
            break;
            
          case 'message':
            if (!userId) {
              ws.send(JSON.stringify({
                type: 'error',
                error: 'Not authenticated',
                timestamp: Date.now()
              }));
              return;
            }
            
            const { roomId, content } = data;
            console.log(`Message from user ${userId} to room ${roomId}: ${content.substring(0, 50)}...`);
            
            if (!roomId || !content) {
              ws.send(JSON.stringify({
                type: 'error',
                error: 'Room ID and content are required',
                timestamp: Date.now()
              }));
              return;
            }
            
            const isInRoom = await roomManager.isUserInRoom(userId, roomId);
            if (!isInRoom) {
              ws.send(JSON.stringify({
                type: 'error',
                error: 'Not a member of this room',
                timestamp: Date.now()
              }));
              return;
            }
            
            const newMessage = await messageManager.createMessage(roomId, userId, content, 'text');
            const userInfo = await userManager.getUserById(userId);
            newMessage.senderName = userInfo?.username;
            
            console.log(`Broadcasting message to room ${roomId}`);
            wsManager.broadcastToRoom(roomId, {
              type: 'message',
              message: newMessage,
              timestamp: Date.now()
            });
            break;
            
          case 'typing':
            if (!userId) return;
            
            const { roomId: typingRoomId, isTyping } = data;
            if (typingRoomId) {
              wsManager.setTyping(userId, typingRoomId, isTyping);
            }
            break;
            
          case 'read':
            if (!userId) return;
            
            const { messageId: readMessageId } = data;
            if (readMessageId) {
              await messageManager.markAsRead(readMessageId, userId);
              
              const msg = await messageManager.getMessageById(readMessageId);
              if (msg) {
                wsManager.sendToUser(msg.senderId, {
                  type: 'read_receipt',
                  messageId: readMessageId,
                  userId,
                  timestamp: Date.now()
                });
              }
            }
            break;
            
          case 'read_all':
            if (!userId) return;
            
            const { roomId: readRoomId } = data;
            if (readRoomId) {
              await messageManager.markAllMessagesAsRead(readRoomId, userId);
            }
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format',
          timestamp: Date.now()
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      if (connectionId) {
        wsManager.removeConnection(connectionId);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  const PORT = process.env.PORT || 9000;

  server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Chat server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
    console.log(`========================================`);
  });

  setInterval(() => {
    wsManager.cleanup();
  }, 60000);
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
