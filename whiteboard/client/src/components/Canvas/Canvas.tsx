import React, { useRef, useEffect, useState, useCallback, forwardRef, ForwardedRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCanvas } from '../../contexts/CanvasContext';
import { useTool } from '../../contexts/ToolContext';
import { useLayer } from '../../contexts/LayerContext';
import { useHistory } from '../../contexts/HistoryContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { drawElement } from '../../utils/canvas';
import { 
  Point, 
  DrawingElement, 
  DrawingStyle,
  User 
} from '../../types';
import './Canvas.css';

interface CanvasProps {
  width?: number;
  height?: number;
}

const CanvasInner: React.FC<CanvasProps & { ref: ForwardedRef<HTMLCanvasElement> }> = ({ 
  width = 1920, 
  height = 1080,
  ref
}) => {
  const canvasRef = ref as React.MutableRefObject<HTMLCanvasElement | null> || useRef<HTMLCanvasElement>(null);
  const { zoom, offsetX, offsetY, setZoom, setOffset, screenToCanvas } = useCanvas();
  const { currentTool, style } = useTool();
  const { currentLayerId, layers, getVisibleLayers } = useLayer();
  const { addToHistory, getCurrentElements } = useHistory();
  const { sendMessage, isConnected, users, elements: remoteElements } = useWebSocket();

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left - offsetX) / zoom;
    const y = (clientY - rect.top - offsetY) / zoom;

    return { x, y };
  }, [zoom, offsetX, offsetY]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);

    const visibleLayers = getVisibleLayers();
    const allElements = [...getCurrentElements(), ...remoteElements];

    visibleLayers.forEach(layer => {
      const layerElements = allElements.filter(el => el.layerId === layer.id);
      layerElements.forEach(element => {
        if (element.isSelected) {
          ctx.save();
          ctx.strokeStyle = '#007aff';
          ctx.lineWidth = 2 / zoom;
          ctx.setLineDash([5 / zoom, 5 / zoom]);
          
          if (element.type === 'pen' || element.type === 'eraser') {
            const bounds = getElementBounds(element);
            if (bounds) {
              ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
            }
          } else if (element.type === 'rectangle' && element.startPoint && element.endPoint) {
            const x = Math.min(element.startPoint.x, element.endPoint.x);
            const y = Math.min(element.startPoint.y, element.endPoint.y);
            const w = Math.abs(element.endPoint.x - element.startPoint.x);
            const h = Math.abs(element.endPoint.y - element.startPoint.y);
            ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
          } else if (element.type === 'circle' && element.center && element.radius) {
            ctx.strokeRect(
              element.center.x - element.radius - 5,
              element.center.y - element.radius - 5,
              element.radius * 2 + 10,
              element.radius * 2 + 10
            );
          } else if (element.type === 'text' && element.position && element.text) {
            const metrics = ctx.measureText(element.text);
            const fontSize = element.style.fontSize || 16;
            ctx.strokeRect(
              element.position.x - 5,
              element.position.y - fontSize - 5,
              metrics.width + 10,
              fontSize + 10
            );
          }
          ctx.restore();
        }
        drawElement(ctx, element);
      });
    });

    if (currentElement) {
      drawElement(ctx, currentElement);
    }

    ctx.restore();

    users.forEach(user => {
      if (user.cursorPosition && user.id !== 'current-user') {
        drawRemoteCursor(ctx, user);
      }
    });
  }, [
    canvasRef, zoom, offsetX, offsetY, 
    getCurrentElements, remoteElements, 
    getVisibleLayers, currentElement, users
  ]);

  const getElementBounds = (element: DrawingElement): { x: number; y: number; width: number; height: number } | null => {
    if (!element.points || element.points.length === 0) return null;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    element.points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const drawRemoteCursor = (ctx: CanvasRenderingContext2D, user: User) => {
    if (!user.cursorPosition) return;
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);
    
    ctx.fillStyle = user.color;
    ctx.beginPath();
    ctx.moveTo(user.cursorPosition.x, user.cursorPosition.y);
    ctx.lineTo(user.cursorPosition.x + 10, user.cursorPosition.y + 15);
    ctx.lineTo(user.cursorPosition.x + 5, user.cursorPosition.y + 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = user.color;
    ctx.font = '12px Arial';
    ctx.fillText(user.name, user.cursorPosition.x + 12, user.cursorPosition.y + 5);
    
    ctx.restore();
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    const point = getCanvasPoint(e);
    setStartPoint(point);
    setIsDrawing(true);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      const newElement: DrawingElement = {
        id: uuidv4(),
        type: currentTool,
        layerId: currentLayerId,
        points: [point],
        style: {
          ...style,
          strokeColor: currentTool === 'eraser' ? '#ffffff' : style.strokeColor,
        },
      };
      setCurrentElement(newElement);
    } else if (currentTool === 'rectangle') {
      const newElement: DrawingElement = {
        id: uuidv4(),
        type: 'rectangle',
        layerId: currentLayerId,
        startPoint: point,
        endPoint: point,
        style,
      };
      setCurrentElement(newElement);
    } else if (currentTool === 'circle') {
      const newElement: DrawingElement = {
        id: uuidv4(),
        type: 'circle',
        layerId: currentLayerId,
        center: point,
        radius: 0,
        style,
      };
      setCurrentElement(newElement);
    }
  }, [currentTool, currentLayerId, style, getCanvasPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    setCursorPosition(point);

    if (isConnected) {
      sendMessage({
        type: 'cursor',
        roomId: 'default-room',
        userId: 'current-user',
        timestamp: Date.now(),
        position: point,
      });
    }

    if (!isDrawing || !startPoint) return;

    if (currentTool === 'pen' || currentTool === 'eraser') {
      if (currentElement && currentElement.points) {
        const newElement = {
          ...currentElement,
          points: [...currentElement.points, point],
        };
        setCurrentElement(newElement);
      }
    } else if (currentTool === 'rectangle' && currentElement) {
      setCurrentElement({
        ...currentElement,
        endPoint: point,
      });
    } else if (currentTool === 'circle' && currentElement) {
      const dx = point.x - startPoint.x;
      const dy = point.y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      setCurrentElement({
        ...currentElement,
        center: startPoint,
        radius,
      });
    }
  }, [
    isDrawing, 
    startPoint, 
    currentTool, 
    currentElement, 
    getCanvasPoint, 
    isConnected, 
    sendMessage
  ]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentElement) {
      addToHistory([currentElement]);
      
      if (isConnected) {
        sendMessage({
          type: 'draw',
          roomId: 'default-room',
          userId: 'current-user',
          timestamp: Date.now(),
          elements: [currentElement],
        });
      }
    }

    setCurrentElement(null);
    setStartPoint(null);
  }, [isDrawing, currentElement, addToHistory, isConnected, sendMessage]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  }, [zoom, setZoom]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const mouseEvent = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as React.MouseEvent;
      handleMouseDown(mouseEvent);
    }
  }, [handleMouseDown]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const mouseEvent = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as React.MouseEvent;
      handleMouseMove(mouseEvent);
    }
  }, [handleMouseMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="whiteboard-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>((props, ref) => (
  <CanvasInner {...props} ref={ref} />
));

Canvas.displayName = 'Canvas';
