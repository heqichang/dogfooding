import React, { useRef } from 'react';
import './ExportButton.css';

interface ExportButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ canvasRef }) => {
  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleExportJPG = () => {
    if (!canvasRef.current) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvasRef.current, 0, 0);
    
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.jpg`;
    link.href = tempCanvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  return (
    <div className="export-button-group">
      <button className="export-button" onClick={handleExportPNG}>
        📥 导出 PNG
      </button>
      <button className="export-button" onClick={handleExportJPG}>
        📥 导出 JPG
      </button>
    </div>
  );
};
