import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { RoomManager } from './rooms/RoomManager';
import { 
  WebSocketMessage, 
  User,
  DrawingElement,
  Layer
} from './types';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const roomManager = new RoomManager();

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  roomId: string;
  userId: string;
  userInfo?: User;
}

const clients = new Map<string, ConnectedClient>();

function generateColor(): string {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
    '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe',
    '#00b894', '#e17055', '#0984e3', '#6c5ce7'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function sendToClient(client: ConnectedClient, message: WebSocketMessage) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

function broadcastToRoom(roomId: string, message: WebSocketMessage, excludeUserId?: string) {
  const room = roomManager.getRoom(roomId);
  if (!room) return;

  clients.forEach((client) => {
    if (client.roomId === roomId && client.userId !== excludeUserId) {
      sendToClient(client, message);
    }
  });
}

function handleJoin(client: ConnectedClient, message: any) {
  const roomId = message.roomId || 'default-room';
  const userId = message.userId || uuidv4();
  const userName = message.userName || `用户${Math.floor(Math.random() * 1000)}`;

  client.roomId = roomId;
  client.userId = userId;

  const userInfo: User = {
    id: userId,
    name: userName,
    color: generateColor(),
  };
  client.userInfo = userInfo;

  const room = roomManager.getOrCreateRoom(roomId);
  room.users.set(userId, userInfo);

  console.log(`用户 ${userName} (${userId}) 加入房间 ${roomId}`);

  const syncMessage: any = {
    type: 'sync',
    roomId,
    userId: 'server',
    timestamp: Date.now(),
    elements: room.elements,
    layers: room.layers,
    users: Array.from(room.users.values()),
  };
  sendToClient(client, syncMessage);

  const joinBroadcast: any = {
    type: 'join',
    roomId,
    userId,
    timestamp: Date.now(),
    userName,
    users: Array.from(room.users.values()),
  };
  broadcastToRoom(roomId, joinBroadcast, userId);
}

function handleDraw(client: ConnectedClient, message: any) {
  const room = roomManager.getRoom(client.roomId);
  if (!room) return;

  const elements: DrawingElement[] = message.elements || [];
  elements.forEach((el) => {
    room.elements.push(el);
  });

  broadcastToRoom(client.roomId, message, client.userId);
}

function handleUndo(client: ConnectedClient, message: any) {
  const room = roomManager.getRoom(client.roomId);
  if (!room) return;

  if (room.history.length > 0) {
    room.history.pop();
  }

  broadcastToRoom(client.roomId, message, client.userId);
}

function handleRedo(client: ConnectedClient, message: any) {
  broadcastToRoom(client.roomId, message, client.userId);
}

function handleClear(client: ConnectedClient, message: any) {
  const room = roomManager.getRoom(client.roomId);
  if (!room) return;

  room.elements = [];
  room.history = [];

  broadcastToRoom(client.roomId, message, client.userId);
}

function handleLayerAdd(client: ConnectedClient, message: any) {
  const room = roomManager.getRoom(client.roomId);
  if (!room) return;

  const layer: Layer = message.layer;
  room.layers.push(layer);

  broadcastToRoom(client.roomId, message, client.userId);
}

function handleLayerRemove(client: ConnectedClient, message: any) {
  const room = roomManager.getRoom(client.roomId);
  if (!room) return;

  const layerId = message.layerId;
  room.layers = room.layers.filter((l) => l.id !== layerId);

  broadcastToRoom(client.roomId, message, client.userId);
}

function handleLayerUpdate(client: ConnectedClient, message: any) {
  const room = roomManager.getRoom(client.roomId);
  if (!room) return;

  const layerUpdate = message.layer;
  const layerIndex = room.layers.findIndex((l) => l.id === layerUpdate.id);
  if (layerIndex !== -1) {
    room.layers[layerIndex] = { ...room.layers[layerIndex], ...layerUpdate };
  }

  broadcastToRoom(client.roomId, message, client.userId);
}

function handleCursor(client: ConnectedClient, message: any) {
  const room = roomManager.getRoom(client.roomId);
  if (!room || !client.userInfo) return;

  client.userInfo.cursorPosition = message.position;
  room.users.set(client.userId, client.userInfo);

  broadcastToRoom(client.roomId, message, client.userId);
}

function handleDisconnect(client: ConnectedClient) {
  console.log(`客户端 ${client.id} 断开连接`);

  if (client.roomId && client.userId) {
    const room = roomManager.getRoom(client.roomId);
    if (room) {
      room.users.delete(client.userId);

      const leaveMessage: any = {
        type: 'leave',
        roomId: client.roomId,
        userId: client.userId,
        timestamp: Date.now(),
        users: Array.from(room.users.values()),
      };
      broadcastToRoom(client.roomId, leaveMessage, client.userId);
    }
  }

  clients.delete(client.id);
}

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  const client: ConnectedClient = {
    id: clientId,
    ws,
    roomId: '',
    userId: '',
  };
  clients.set(clientId, client);

  console.log(`新客户端连接: ${clientId}`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage;

      switch (message.type) {
        case 'join':
          handleJoin(client, message);
          break;
        case 'draw':
          handleDraw(client, message);
          break;
        case 'undo':
          handleUndo(client, message);
          break;
        case 'redo':
          handleRedo(client, message);
          break;
        case 'clear':
          handleClear(client, message);
          break;
        case 'layer-add':
          handleLayerAdd(client, message);
          break;
        case 'layer-remove':
          handleLayerRemove(client, message);
          break;
        case 'layer-update':
          handleLayerUpdate(client, message);
          break;
        case 'cursor':
          handleCursor(client, message);
          break;
        default:
          console.log('未知消息类型:', message);
      }
    } catch (error) {
      console.error('解析消息失败:', error);
    }
  });

  ws.on('close', () => {
    handleDisconnect(client);
  });

  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
    handleDisconnect(client);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`在线白板服务器运行在 http://localhost:${PORT}`);
  console.log(`WebSocket 服务运行在 ws://localhost:${PORT}`);
});
