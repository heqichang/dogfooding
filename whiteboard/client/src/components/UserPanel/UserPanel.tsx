import React from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import './UserPanel.css';

export const UserPanel: React.FC = () => {
  const { users, isConnected } = useWebSocket();

  return (
    <div className="user-panel">
      <div className="panel-header">
        <h3 className="panel-title">在线用户</h3>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          <span className="status-text">{isConnected ? '已连接' : '未连接'}</span>
        </div>
      </div>

      <div className="user-list">
        {users.length === 0 ? (
          <div className="no-users">
            <p>暂无在线用户</p>
            <p className="hint">等待其他用户加入...</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="user-item">
              <div
                className="user-avatar"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">
                  {user.id === 'current-user' ? '(你)' : '在线'}
                </span>
              </div>
              <div
                className="user-indicator"
                style={{ backgroundColor: user.color }}
              />
            </div>
          ))
        )}
      </div>

      <div className="user-info-text">
        <span>在线人数: {users.length}</span>
        <span>房间: 默认房间</span>
      </div>
    </div>
  );
};
