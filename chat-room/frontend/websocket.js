class ChatWebSocket {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(userId) {
    this.userId = userId;
    
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `ws://localhost:9000`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          this.send({
            type: 'auth',
            userId: this.userId
          });
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
          
          this.emit('disconnected');
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.on('auth_success', () => {
          this.isConnected = true;
          resolve();
        });

        this.on('error', (error) => {
          console.error('WebSocket error message:', error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.userId && !this.isConnected) {
        console.log('Attempting to reconnect...');
        this.connect(this.userId).catch(() => {
          console.log('Reconnect failed');
        });
      }
    }, delay);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  handleMessage(message) {
    console.log('Received message:', message.type);
    this.emit(message.type, message);
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in handler for event ${event}:`, error);
        }
      });
    }
  }

  sendMessage(roomId, content) {
    this.send({
      type: 'message',
      roomId,
      content
    });
  }

  setTyping(roomId, isTyping) {
    this.send({
      type: 'typing',
      roomId,
      isTyping
    });
  }

  markAsRead(messageId) {
    this.send({
      type: 'read',
      messageId
    });
  }

  markAllAsRead(roomId) {
    this.send({
      type: 'read_all',
      roomId
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
    this.userId = null;
    this.eventHandlers.clear();
  }
}

window.ChatWebSocket = new ChatWebSocket();
