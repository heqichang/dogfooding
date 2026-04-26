import React from 'react';
import { useTool } from '../../contexts/ToolContext';
import { useHistory } from '../../contexts/HistoryContext';
import { useLayer } from '../../contexts/LayerContext';
import { ToolType, DrawingStyle } from '../../types';
import './Toolbar.css';

const tools: { type: ToolType; icon: string; label: string }[] = [
  { type: 'pen', icon: '✏️', label: '画笔' },
  { type: 'eraser', icon: '🧹', label: '橡皮擦' },
  { type: 'rectangle', icon: '⬜', label: '矩形' },
  { type: 'circle', icon: '⭕', label: '圆形' },
  { type: 'text', icon: '📝', label: '文本' },
  { type: 'select', icon: '👆', label: '选择' },
  { type: 'move', icon: '✋', label: '移动画布' },
];

const colors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#808080', '#800000',
  '#808000', '#008000', '#800080', '#008080', '#000080',
];

const lineWidths = [1, 2, 3, 4, 5, 8, 10, 15, 20];

export const Toolbar: React.FC = () => {
  const { currentTool, style, setCurrentTool, setStyle } = useTool();
  const { undo, redo, canUndo, canRedo, clearAll } = useHistory();
  const { addLayer } = useLayer();

  const handleToolClick = (toolType: ToolType) => {
    setCurrentTool(toolType);
  };

  const handleColorChange = (color: string, isStroke: boolean) => {
    if (isStroke) {
      setStyle({ ...style, strokeColor: color });
    } else {
      setStyle({ ...style, fillColor: color });
    }
  };

  const handleLineWidthChange = (width: number) => {
    setStyle({ ...style, strokeWidth: width });
  };

  const handleFontSizeChange = (size: number) => {
    setStyle({ ...style, fontSize: size });
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3 className="toolbar-title">工具</h3>
        <div className="tool-grid">
          {tools.map((tool) => (
            <button
              key={tool.type}
              className={`tool-button ${currentTool === tool.type ? 'active' : ''}`}
              onClick={() => handleToolClick(tool.type)}
              title={tool.label}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <h3 className="toolbar-title">操作</h3>
        <div className="action-buttons">
          <button
            className="action-button"
            onClick={undo}
            disabled={!canUndo}
            title="撤销 (Ctrl+Z)"
          >
            ↩️ 撤销
          </button>
          <button
            className="action-button"
            onClick={redo}
            disabled={!canRedo}
            title="重做 (Ctrl+Y)"
          >
            ↪️ 重做
          </button>
          <button
            className="action-button danger"
            onClick={clearAll}
            title="清空画布"
          >
            🗑️ 清空
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3 className="toolbar-title">描边颜色</h3>
        <div className="color-palette">
          {colors.map((color) => (
            <button
              key={`stroke-${color}`}
              className={`color-swatch ${style.strokeColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #ccc' : 'none' }}
              onClick={() => handleColorChange(color, true)}
              title={color}
            />
          ))}
        </div>
        <input
          type="color"
          value={style.strokeColor}
          onChange={(e) => handleColorChange(e.target.value, true)}
          className="color-picker"
        />
      </div>

      <div className="toolbar-section">
        <h3 className="toolbar-title">填充颜色</h3>
        <div className="color-palette">
          {colors.map((color) => (
            <button
              key={`fill-${color}`}
              className={`color-swatch ${style.fillColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #ccc' : 'none' }}
              onClick={() => handleColorChange(color, false)}
              title={color}
            />
          ))}
        </div>
        <input
          type="color"
          value={style.fillColor}
          onChange={(e) => handleColorChange(e.target.value, false)}
          className="color-picker"
        />
      </div>

      <div className="toolbar-section">
        <h3 className="toolbar-title">线条粗细</h3>
        <div className="line-widths">
          {lineWidths.map((width) => (
            <button
              key={width}
              className={`line-width-button ${style.strokeWidth === width ? 'active' : ''}`}
              onClick={() => handleLineWidthChange(width)}
              title={`${width}px`}
            >
              <div
                className="line-preview"
                style={{ height: `${width}px` }}
              />
              <span className="line-width-label">{width}</span>
            </button>
          ))}
        </div>
      </div>

      {currentTool === 'text' && (
        <div className="toolbar-section">
          <h3 className="toolbar-title">字体大小</h3>
          <div className="font-size-selector">
            {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map((size) => (
              <button
                key={size}
                className={`font-size-button ${style.fontSize === size ? 'active' : ''}`}
                onClick={() => handleFontSizeChange(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
