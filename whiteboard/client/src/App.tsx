import React, { useRef } from 'react';
import { CanvasProvider } from './contexts/CanvasContext';
import { ToolProvider } from './contexts/ToolContext';
import { LayerProvider } from './contexts/LayerContext';
import { HistoryProvider } from './contexts/HistoryContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { Canvas } from './components/Canvas/Canvas';
import { Toolbar } from './components/Toolbar/Toolbar';
import { LayerPanel } from './components/LayerPanel/LayerPanel';
import { UserPanel } from './components/UserPanel/UserPanel';
import { ExportButton } from './components/ExportButton/ExportButton';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <WebSocketProvider>
      <CanvasProvider>
        <ToolProvider>
          <LayerProvider>
            <HistoryProvider>
              <div className="app">
                <header className="app-header">
                  <h1 className="app-title">🎨 在线协作白板</h1>
                  <div className="header-actions">
                    <ExportButton canvasRef={canvasRef} />
                  </div>
                </header>

                <div className="app-content">
                  <aside className="sidebar left-sidebar">
                    <Toolbar />
                  </aside>

                  <main className="main-canvas-area">
                    <Canvas ref={canvasRef} width={1920} height={1080} />
                  </main>

                  <aside className="sidebar right-sidebar">
                    <UserPanel />
                    <LayerPanel />
                  </aside>
                </div>

                <footer className="app-footer">
                  <div className="footer-info">
                    <span>提示: 使用 Ctrl+Z 撤销, Ctrl+Y 重做</span>
                    <span>滚轮缩放画布</span>
                  </div>
                </footer>
              </div>
            </HistoryProvider>
          </LayerProvider>
        </ToolProvider>
      </CanvasProvider>
    </WebSocketProvider>
  );
}

export default App;
