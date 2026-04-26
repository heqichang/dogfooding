const API_BASE = 'http://localhost:9000/api';

class ChatAPI {
  constructor() {
    this.baseUrl = API_BASE;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async login(username) {
    return this.request('/users', {
      method: 'POST',
      body: { username }
    });
  }

  async getUsers() {
    return this.request('/users');
  }

  async getUserRooms(userId) {
    return this.request(`/users/${userId}/rooms`);
  }

  async createRoom(name, type = 'group', creatorId = null) {
    return this.request('/rooms', {
      method: 'POST',
      body: { name, type, creatorId }
    });
  }

  async createPrivateRoom(userId1, userId2) {
    return this.request('/rooms/private', {
      method: 'POST',
      body: { userId1, userId2 }
    });
  }

  async joinRoom(roomId, userId) {
    return this.request(`/rooms/${roomId}/join`, {
      method: 'POST',
      body: { userId }
    });
  }

  async getRoomMembers(roomId) {
    return this.request(`/rooms/${roomId}/members`);
  }

  async getMessages(roomId, limit = 50, before = null) {
    let endpoint = `/rooms/${roomId}/messages?limit=${limit}`;
    if (before) {
      endpoint += `&before=${encodeURIComponent(before)}`;
    }
    return this.request(endpoint);
  }

  async markMessageAsRead(messageId, userId) {
    return this.request(`/messages/${messageId}/read`, {
      method: 'POST',
      body: { userId }
    });
  }

  async markRoomAsRead(roomId, userId) {
    return this.request(`/rooms/${roomId}/read`, {
      method: 'POST',
      body: { userId }
    });
  }

  async getPublicRooms(excludeUserId = null) {
    let endpoint = '/rooms/public';
    if (excludeUserId) {
      endpoint += `?excludeUserId=${encodeURIComponent(excludeUserId)}`;
    }
    return this.request(endpoint);
  }

  async inviteUser(inviterId, inviteeId, roomId) {
    return this.request('/rooms/invite', {
      method: 'POST',
      body: { inviterId, inviteeId, roomId }
    });
  }

  async getHealth() {
    try {
      const response = await fetch('http://localhost:9000/health');
      return response.json();
    } catch (error) {
      throw new Error('Backend not available');
    }
  }
}

window.ChatAPI = new ChatAPI();
