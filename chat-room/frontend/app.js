class ChatApp {
  constructor() {
    this.currentUser = null;
    this.currentRoom = null;
    this.rooms = [];
    this.messages = [];
    this.hasMoreMessages = true;
    this.typingTimeout = null;
    this.isTyping = false;
    this.typingUsers = new Map();
    this.userMap = new Map();
    
    this.api = window.ChatAPI;
    this.ws = window.ChatWebSocket;
    
    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.checkStoredUser();
  }

  bindElements() {
    this.loginPage = document.getElementById('login-page');
    this.chatPage = document.getElementById('chat-page');
    this.loginForm = document.getElementById('login-form');
    this.usernameInput = document.getElementById('username');
    this.currentUserEl = document.getElementById('current-user');
    this.logoutBtn = document.getElementById('logout-btn');
    
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabContents = {
      rooms: document.getElementById('rooms-tab'),
      private: document.getElementById('private-tab'),
      users: document.getElementById('users-tab')
    };
    
    this.roomList = document.getElementById('room-list');
    this.privateList = document.getElementById('private-list');
    this.usersList = document.getElementById('users-list');
    this.publicRoomsList = document.getElementById('public-rooms-list');
    this.refreshPublicRoomsBtn = document.getElementById('refresh-public-rooms-btn');
    
    this.inviteUsersList = document.getElementById('invite-users-list');
    this.invitationModal = document.getElementById('invitation-modal');
    this.invitationMessage = document.getElementById('invitation-message');
    this.declineInvitationBtn = document.getElementById('decline-invitation');
    this.acceptInvitationBtn = document.getElementById('accept-invitation');
    
    this.pendingInvitation = null;
    
    this.noRoomSelected = document.getElementById('no-room-selected');
    this.chatRoom = document.getElementById('chat-room');
    this.roomNameEl = document.getElementById('room-name');
    this.membersCountEl = document.getElementById('members-count');
    this.viewMembersBtn = document.getElementById('view-members-btn');
    
    this.messagesContainer = document.getElementById('messages-container');
    this.messagesList = document.getElementById('messages-list');
    this.loadMoreBtn = document.getElementById('load-more-btn');
    this.typingIndicator = document.getElementById('typing-indicator');
    
    this.messageInput = document.getElementById('message-input');
    this.sendBtn = document.getElementById('send-btn');
    
    this.createRoomBtn = document.getElementById('create-room-btn');
    this.createRoomModal = document.getElementById('create-room-modal');
    this.createRoomForm = document.getElementById('create-room-form');
    this.roomNameInput = document.getElementById('room-name-input');
    this.cancelCreateRoom = document.getElementById('cancel-create-room');
    
    this.membersModal = document.getElementById('members-modal');
    this.membersListEl = document.getElementById('members-list');
    this.closeMembersBtn = document.getElementById('close-members-btn');
  }

  bindEvents() {
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    this.logoutBtn.addEventListener('click', () => this.handleLogout());
    
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
    
    this.createRoomBtn.addEventListener('click', () => this.showCreateRoomModal());
    this.createRoomForm.addEventListener('submit', (e) => this.handleCreateRoom(e));
    this.cancelCreateRoom.addEventListener('click', () => this.hideCreateRoomModal());
    this.createRoomModal.addEventListener('click', (e) => {
      if (e.target === this.createRoomModal) {
        this.hideCreateRoomModal();
      }
    });
    
    this.viewMembersBtn.addEventListener('click', () => this.showMembersModal());
    this.closeMembersBtn.addEventListener('click', () => this.hideMembersModal());
    this.membersModal.addEventListener('click', (e) => {
      if (e.target === this.membersModal) {
        this.hideMembersModal();
      }
    });
    
    this.sendBtn.addEventListener('click', () => this.handleSendMessage());
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });
    this.messageInput.addEventListener('input', () => this.handleTyping());
    
    this.loadMoreBtn.addEventListener('click', () => this.loadMoreMessages());
    
    this.refreshPublicRoomsBtn.addEventListener('click', () => this.loadPublicRooms());
    
    this.declineInvitationBtn.addEventListener('click', () => this.declineInvitation());
    this.acceptInvitationBtn.addEventListener('click', () => this.acceptInvitation());
    this.invitationModal.addEventListener('click', (e) => {
      if (e.target === this.invitationModal) {
        this.hideInvitationModal();
      }
    });
  }

  checkStoredUser() {
    const storedUser = localStorage.getItem('chatUser');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.showChatPage();
        this.initConnection();
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('chatUser');
      }
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = this.usernameInput.value.trim();
    
    if (!username) {
      alert('请输入用户名');
      return;
    }
    
    try {
      this.currentUser = await this.api.login(username);
      localStorage.setItem('chatUser', JSON.stringify(this.currentUser));
      
      await this.showChatPage();
      await this.initConnection();
    } catch (error) {
      console.error('Login error:', error);
      alert('登录失败: ' + error.message);
    }
  }

  handleLogout() {
    localStorage.removeItem('chatUser');
    this.ws.disconnect();
    this.currentUser = null;
    this.currentRoom = null;
    this.rooms = [];
    this.messages = [];
    
    this.showLoginPage();
  }

  showLoginPage() {
    this.loginPage.classList.remove('hidden');
    this.chatPage.classList.add('hidden');
    this.usernameInput.value = '';
    this.usernameInput.focus();
  }

  async showChatPage() {
    this.loginPage.classList.add('hidden');
    this.chatPage.classList.remove('hidden');
    this.currentUserEl.textContent = this.currentUser.username;
    
    await this.loadRooms();
    await this.loadPublicRooms();
    await this.loadUsers();
  }

  async initConnection() {
    try {
      await this.ws.connect(this.currentUser.id);
      this.bindWebSocketEvents();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      alert('无法连接到服务器，请确保后端已启动');
    }
  }

  bindWebSocketEvents() {
    this.ws.on('message', (data) => {
      this.handleIncomingMessage(data.message);
    });
    
    this.ws.on('typing', (data) => {
      this.handleTypingIndicator(data);
    });
    
    this.ws.on('read_receipt', (data) => {
      this.handleReadReceipt(data);
    });
    
    this.ws.on('user_joined', (data) => {
      console.log('User joined:', data);
      this.refreshRooms();
      this.showNotification(`${data.userId} 加入了房间`);
    });
    
    this.ws.on('user_left', (data) => {
      console.log('User left:', data);
      this.refreshRooms();
      this.showNotification(`${data.userId} 离开了房间`);
    });
    
    this.ws.on('user_online', (data) => {
      console.log('User online:', data);
      this.refreshRooms();
      if (data.username) {
        this.showNotification(`${data.username} 上线了`);
      }
    });
    
    this.ws.on('user_offline', (data) => {
      console.log('User offline:', data);
      this.refreshRooms();
    });
    
    this.ws.on('room_created', (data) => {
      console.log('Room created:', data);
      this.loadPublicRooms();
      if (data.creatorName) {
        this.showNotification(`${data.creatorName} 创建了房间: ${data.room.name}`);
      }
    });
    
    this.ws.on('invitation', (data) => {
      console.log('Invitation received:', data);
      this.showInvitationModal(data);
    });
    
    this.ws.on('user_registered', (data) => {
      console.log('New user registered:', data);
      this.loadUsers();
      if (data.user && data.user.username) {
        this.showNotification(`新用户 ${data.user.username} 加入了聊天`);
      }
    });
  }

  switchTab(tabName) {
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    Object.entries(this.tabContents).forEach(([name, content]) => {
      content.classList.toggle('hidden', name !== tabName);
    });
  }

  async loadRooms() {
    try {
      const rooms = await this.api.getUserRooms(this.currentUser.id);
      this.rooms = rooms;
      this.renderRooms();
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  }

  renderRooms() {
    const groupRooms = this.rooms.filter(r => r.type === 'group');
    const privateRooms = this.rooms.filter(r => r.type === 'private');
    
    this.renderRoomList(groupRooms, this.roomList, 'group');
    this.renderRoomList(privateRooms, this.privateList, 'private');
  }

  renderRoomList(rooms, container, type) {
    if (rooms.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px;">
          <p style="color: #999;">暂无${type === 'group' ? '群聊' : '私聊'}房间</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = rooms.map(room => {
      const isActive = this.currentRoom && this.currentRoom.id === room.id;
      const unreadBadge = room.unreadCount > 0 
        ? `<span class="room-badge">${room.unreadCount}</span>` 
        : '';
      
      const displayName = type === 'private' 
        ? this.extractOtherUserFromPrivateRoom(room.name) 
        : room.name;
      
      return `
        <div class="room-item ${isActive ? 'active' : ''}" data-room-id="${room.id}">
          <div class="room-info">
            <h4>${this.escapeHtml(displayName)}</h4>
            <p>${room.type === 'group' ? '群聊' : '私聊'}</p>
          </div>
          ${unreadBadge}
        </div>
      `;
    }).join('');
    
    container.querySelectorAll('.room-item').forEach(item => {
      item.addEventListener('click', () => {
        const roomId = item.dataset.roomId;
        const room = this.rooms.find(r => r.id === roomId);
        if (room) {
          this.selectRoom(room);
        }
      });
    });
  }

  extractOtherUserFromPrivateRoom(roomName) {
    if (!this.currentUser) return '私聊';
    
    const parts = roomName.split('-');
    if (parts.length >= 3) {
      const userId1 = parts[1];
      const userId2 = parts[2];
      
      let otherUserId = null;
      if (userId1 === this.currentUser.id) {
        otherUserId = userId2;
      } else if (userId2 === this.currentUser.id) {
        otherUserId = userId1;
      }
      
      if (otherUserId) {
        const otherUser = this.userMap.get(otherUserId);
        if (otherUser) {
          return otherUser.username;
        }
        return `与 ${otherUserId.substring(0, 8)}...`;
      }
    }
    
    return '私聊';
  }

  async loadUsers() {
    try {
      const users = await this.api.getUsers();
      
      this.userMap.clear();
      users.forEach(user => {
        this.userMap.set(user.id, user);
      });
      
      this.renderUsers(users.filter(u => u.id !== this.currentUser.id));
      this.renderRooms();
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  renderUsers(users) {
    if (users.length === 0) {
      this.usersList.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px;">
          <p style="color: #999;">暂无其他用户</p>
        </div>
      `;
      return;
    }
    
    this.usersList.innerHTML = users.map(user => `
      <div class="user-item" data-user-id="${user.id}">
        <div class="user-info-main">
          <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
          <div class="user-details">
            <h4>${this.escapeHtml(user.username)}</h4>
            <p class="${user.isOnline ? 'online' : 'offline'}">
              ${user.isOnline ? '在线' : '离线'}
            </p>
          </div>
        </div>
        <button class="btn-small" data-action="private-chat">私聊</button>
      </div>
    `).join('');
    
    this.usersList.querySelectorAll('.user-item').forEach(item => {
      const userId = item.dataset.userId;
      const chatBtn = item.querySelector('[data-action="private-chat"]');
      
      chatBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startPrivateChat(userId);
      });
    });
  }

  async startPrivateChat(otherUserId) {
    try {
      const room = await this.api.createPrivateRoom(this.currentUser.id, otherUserId);
      
      await this.loadRooms();
      this.selectRoom(room);
      this.switchTab('private');
    } catch (error) {
      console.error('Error creating private room:', error);
      alert('创建私聊失败: ' + error.message);
    }
  }

  async selectRoom(room) {
    this.currentRoom = room;
    this.messages = [];
    this.hasMoreMessages = true;
    
    this.noRoomSelected.classList.add('hidden');
    this.chatRoom.classList.remove('hidden');
    
    const displayName = room.type === 'private' 
      ? this.extractOtherUserFromPrivateRoom(room.name) 
      : room.name;
    this.roomNameEl.textContent = displayName;
    this.membersCountEl.textContent = `${room.memberCount || 0} 成员`;
    
    this.messagesList.innerHTML = '';
    this.loadMoreBtn.classList.add('hidden');
    
    await this.loadMessages();
    
    if (room.unreadCount > 0) {
      await this.api.markRoomAsRead(room.id, this.currentUser.id);
      this.ws.markAllAsRead(room.id);
      await this.loadRooms();
    }
  }

  async loadMessages() {
    if (!this.currentRoom) return;
    
    try {
      const result = await this.api.getMessages(
        this.currentRoom.id,
        50,
        this.messages.length > 0 ? this.messages[0].createdAt : null
      );
      
      const newMessages = result.messages;
      this.hasMoreMessages = result.hasMore;
      
      if (newMessages.length === 0 && this.messages.length === 0) {
        this.messagesList.innerHTML = `
          <div class="empty-state" style="padding: 40px;">
            <p style="color: #999;">暂无消息，发送第一条消息吧！</p>
          </div>
        `;
        return;
      }
      
      if (this.messages.length === 0) {
        this.messages = newMessages;
        this.renderMessages();
      } else {
        this.messages = [...newMessages, ...this.messages];
        this.prependMessages(newMessages);
      }
      
      if (this.hasMoreMessages) {
        this.loadMoreBtn.classList.remove('hidden');
      } else {
        this.loadMoreBtn.classList.add('hidden');
      }
      
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async loadMoreMessages() {
    if (!this.hasMoreMessages) return;
    await this.loadMessages();
  }

  renderMessages() {
    if (this.messages.length === 0) {
      this.messagesList.innerHTML = `
        <div class="empty-state" style="padding: 40px;">
          <p style="color: #999;">暂无消息，发送第一条消息吧！</p>
        </div>
      `;
      return;
    }
    
    this.messagesList.innerHTML = this.messages.map(msg => this.renderMessage(msg)).join('');
    this.scrollToBottom();
  }

  prependMessages(newMessages) {
    const currentScrollTop = this.messagesContainer.scrollTop;
    const currentScrollHeight = this.messagesContainer.scrollHeight;
    
    const html = newMessages.map(msg => this.renderMessage(msg)).join('');
    this.messagesList.insertAdjacentHTML('afterbegin', html);
    
    const newScrollHeight = this.messagesContainer.scrollHeight;
    this.messagesContainer.scrollTop = currentScrollTop + (newScrollHeight - currentScrollHeight);
  }

  renderMessage(msg) {
    const isOwn = msg.senderId === this.currentUser.id;
    const time = new Date(msg.createdAt).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    let readStatus = '';
    if (isOwn && msg.readReceipts && msg.readReceipts.length > 0) {
      readStatus = `<span class="read-status">已读 ${msg.readReceipts.length}</span>`;
    } else if (isOwn) {
      readStatus = `<span class="read-status">已发送</span>`;
    }
    
    const senderName = msg.senderName || msg.senderId.substring(0, 8);
    
    return `
      <div class="message ${isOwn ? 'own' : 'other'}" data-message-id="${msg.id}">
        ${!isOwn ? `<div class="message-sender">${this.escapeHtml(senderName)}</div>` : ''}
        <div class="message-bubble">${this.escapeHtml(msg.content)}</div>
        <div class="message-time">
          ${time}
          ${readStatus}
        </div>
      </div>
    `;
  }

  handleIncomingMessage(msg) {
    if (!this.currentRoom || msg.roomId !== this.currentRoom.id) {
      this.loadRooms();
      return;
    }
    
    this.messages.push(msg);
    const html = this.renderMessage(msg);
    this.messagesList.insertAdjacentHTML('beforeend', html);
    this.scrollToBottom();
    
    this.ws.markAsRead(msg.id);
    this.api.markMessageAsRead(msg.id, this.currentUser.id);
  }

  handleReadReceipt(data) {
    const messageEl = this.messagesList.querySelector(`[data-message-id="${data.messageId}"]`);
    if (messageEl) {
      const readStatusEl = messageEl.querySelector('.read-status');
      if (readStatusEl) {
        const currentCount = readStatusEl.textContent.match(/已读 (\d+)/)?.[1] || '0';
        const newCount = parseInt(currentCount) + 1;
        readStatusEl.textContent = `已读 ${newCount}`;
      }
    }
  }

  handleTyping() {
    if (!this.currentRoom) return;
    
    if (!this.isTyping) {
      this.isTyping = true;
      this.ws.setTyping(this.currentRoom.id, true);
    }
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      if (this.currentRoom) {
        this.ws.setTyping(this.currentRoom.id, false);
      }
    }, 2000);
  }

  handleTypingIndicator(data) {
    if (!this.currentRoom || data.roomId !== this.currentRoom.id) return;
    if (data.userId === this.currentUser.id) return;
    
    const key = `${data.userId}:${data.roomId}`;
    
    if (data.isTyping) {
      this.typingUsers.set(key, { userId: data.userId, timestamp: Date.now() });
    } else {
      this.typingUsers.delete(key);
    }
    
    this.updateTypingIndicator();
  }

  updateTypingIndicator() {
    const typingInRoom = [];
    this.typingUsers.forEach((value, key) => {
      if (value.userId !== this.currentUser.id) {
        typingInRoom.push(value.userId);
      }
    });
    
    if (typingInRoom.length > 0) {
      const count = typingInRoom.length;
      let text = '';
      if (count === 1) {
        text = `有人正在输入`;
      } else {
        text = `${count} 人正在输入`;
      }
      
      this.typingIndicator.textContent = text;
      this.typingIndicator.classList.remove('hidden');
    } else {
      this.typingIndicator.classList.add('hidden');
    }
  }

  handleSendMessage() {
    if (!this.currentRoom) return;
    
    const content = this.messageInput.value.trim();
    if (!content) return;
    
    this.ws.sendMessage(this.currentRoom.id, content);
    this.messageInput.value = '';
    
    if (this.isTyping) {
      this.isTyping = false;
      this.ws.setTyping(this.currentRoom.id, false);
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
    }
  }

  showCreateRoomModal() {
    this.createRoomModal.classList.remove('hidden');
    this.roomNameInput.value = '';
    this.roomNameInput.focus();
  }

  hideCreateRoomModal() {
    this.createRoomModal.classList.add('hidden');
  }

  async handleCreateRoom(e) {
    e.preventDefault();
    
    const name = this.roomNameInput.value.trim();
    if (!name) {
      alert('请输入房间名称');
      return;
    }
    
    try {
      const room = await this.api.createRoom(name, 'group', this.currentUser.id);
      this.hideCreateRoomModal();
      
      await this.loadRooms();
      this.selectRoom(room);
      this.switchTab('rooms');
    } catch (error) {
      console.error('Error creating room:', error);
      alert('创建房间失败: ' + error.message);
    }
  }

  async showMembersModal() {
    if (!this.currentRoom) return;
    
    try {
      const members = await this.api.getRoomMembers(this.currentRoom.id);
      this.renderMembersModal(members);
      this.membersModal.classList.remove('hidden');
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  hideMembersModal() {
    this.membersModal.classList.add('hidden');
  }

  renderMembersModal(members) {
    this.membersListEl.innerHTML = members.map(member => `
      <div class="member-item">
        <div class="member-info">
          <h4>${this.escapeHtml(member.username)}</h4>
        </div>
        <span class="member-status ${member.isOnline ? 'online' : 'offline'}">
          ${member.isOnline ? '在线' : '离线'}
        </span>
      </div>
    `).join('');
  }

  async loadPublicRooms() {
    try {
      const rooms = await this.api.getPublicRooms(this.currentUser?.id);
      this.renderPublicRooms(rooms);
    } catch (error) {
      console.error('Error loading public rooms:', error);
    }
  }

  renderPublicRooms(rooms) {
    if (rooms.length === 0) {
      this.publicRoomsList.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p style="color: #999;">暂无公开房间</p>
        </div>
      `;
      return;
    }
    
    this.publicRoomsList.innerHTML = rooms.map(room => `
      <div class="room-item" data-room-id="${room.id}">
        <div class="room-info">
          <h4>${this.escapeHtml(room.name)}</h4>
          <p>${room.memberCount || 0} 成员</p>
        </div>
        <button class="btn-small join-public-room-btn" data-room-id="${room.id}">加入</button>
      </div>
    `).join('');
    
    this.publicRoomsList.querySelectorAll('.join-public-room-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const roomId = btn.dataset.roomId;
        this.joinPublicRoom(roomId);
      });
    });
  }

  async joinPublicRoom(roomId) {
    try {
      await this.api.joinRoom(roomId, this.currentUser.id);
      
      await this.loadRooms();
      await this.loadPublicRooms();
      
      const rooms = await this.api.getUserRooms(this.currentUser.id);
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        this.selectRoom(room);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('加入房间失败: ' + error.message);
    }
  }

  async showMembersModal() {
    if (!this.currentRoom) return;
    
    try {
      const members = await this.api.getRoomMembers(this.currentRoom.id);
      const allUsers = await this.api.getUsers();
      
      const nonMembers = allUsers.filter(u => 
        u.id !== this.currentUser.id && !members.find(m => m.id === u.id)
      );
      
      this.renderMembersModal(members, nonMembers);
      this.membersModal.classList.remove('hidden');
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  renderMembersModal(members, nonMembers = []) {
    this.membersListEl.innerHTML = members.map(member => `
      <div class="member-item">
        <div class="member-info">
          <h4>${this.escapeHtml(member.username)}</h4>
        </div>
        <span class="member-status ${member.isOnline ? 'online' : 'offline'}">
          ${member.isOnline ? '在线' : '离线'}
        </span>
      </div>
    `).join('');
    
    if (nonMembers.length === 0) {
      this.inviteUsersList.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p style="color: #999;">没有可邀请的用户</p>
        </div>
      `;
    } else {
      this.inviteUsersList.innerHTML = nonMembers.map(user => `
        <div class="member-item">
          <div class="member-info">
            <h4>${this.escapeHtml(user.username)}</h4>
          </div>
          <button class="btn-small invite-user-btn" data-user-id="${user.id}">邀请</button>
        </div>
      `).join('');
      
      this.inviteUsersList.querySelectorAll('.invite-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const userId = btn.dataset.userId;
          this.inviteUserToRoom(userId);
        });
      });
    }
  }

  async inviteUserToRoom(userId) {
    if (!this.currentRoom) return;
    
    try {
      await this.api.inviteUser(this.currentUser.id, userId, this.currentRoom.id);
      alert('邀请已发送！');
      
      const members = await this.api.getRoomMembers(this.currentRoom.id);
      const allUsers = await this.api.getUsers();
      const nonMembers = allUsers.filter(u => 
        u.id !== this.currentUser.id && !members.find(m => m.id === u.id)
      );
      this.renderMembersModal(members, nonMembers);
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('邀请失败: ' + error.message);
    }
  }

  showInvitationModal(data) {
    this.pendingInvitation = data;
    this.invitationMessage.innerHTML = `
      <p style="margin-bottom: 15px;">
        <strong>${this.escapeHtml(data.inviterName || '某人')}</strong> 邀请你加入房间：
      </p>
      <p style="font-size: 18px; font-weight: bold; color: #0078d4;">
        ${this.escapeHtml(data.roomName)}
      </p>
    `;
    this.invitationModal.classList.remove('hidden');
  }

  hideInvitationModal() {
    this.invitationModal.classList.add('hidden');
    this.pendingInvitation = null;
  }

  async acceptInvitation() {
    if (!this.pendingInvitation) return;
    
    try {
      await this.api.joinRoom(this.pendingInvitation.roomId, this.currentUser.id);
      this.hideInvitationModal();
      
      await this.loadRooms();
      await this.loadPublicRooms();
      
      const rooms = await this.api.getUserRooms(this.currentUser.id);
      const room = rooms.find(r => r.id === this.pendingInvitation.roomId);
      if (room) {
        this.selectRoom(room);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('加入房间失败: ' + error.message);
    }
  }

  declineInvitation() {
    this.hideInvitationModal();
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0078d4;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  refreshRooms() {
    this.loadRooms();
    this.loadPublicRooms();
    this.loadUsers();
  }

  scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.chatApp = new ChatApp();
});
