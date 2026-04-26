export interface Point {
  x: number;
  y: number;
}

export type ToolType = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'select' | 'move';

export interface DrawingStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize?: number;
  fontFamily?: string;
}

export interface DrawingElement {
  id: string;
  type: ToolType;
  layerId: string;
  points?: Point[];
  startPoint?: Point;
  endPoint?: Point;
  center?: Point;
  radius?: number;
  width?: number;
  height?: number;
  text?: string;
  position?: Point;
  style: DrawingStyle;
  isSelected?: boolean;
  offsetX?: number;
  offsetY?: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursorPosition?: Point;
}

export type MessageType = 
  | 'join' 
  | 'leave' 
  | 'draw' 
  | 'undo' 
  | 'redo' 
  | 'layer-add' 
  | 'layer-remove' 
  | 'layer-update' 
  | 'sync'
  | 'clear'
  | 'cursor';

export interface BaseMessage {
  type: MessageType;
  roomId: string;
  userId: string;
  timestamp: number;
}

export interface JoinMessage extends BaseMessage {
  type: 'join';
  userName: string;
}

export interface LeaveMessage extends BaseMessage {
  type: 'leave';
}

export interface DrawMessage extends BaseMessage {
  type: 'draw';
  elements: DrawingElement[];
}

export interface UndoMessage extends BaseMessage {
  type: 'undo';
}

export interface RedoMessage extends BaseMessage {
  type: 'redo';
}

export interface LayerAddMessage extends BaseMessage {
  type: 'layer-add';
  layer: Layer;
}

export interface LayerRemoveMessage extends BaseMessage {
  type: 'layer-remove';
  layerId: string;
}

export interface LayerUpdateMessage extends BaseMessage {
  type: 'layer-update';
  layer: Partial<Layer> & { id: string };
}

export interface SyncMessage extends BaseMessage {
  type: 'sync';
  elements: DrawingElement[];
  layers: Layer[];
  users: User[];
}

export interface ClearMessage extends BaseMessage {
  type: 'clear';
}

export interface CursorMessage extends BaseMessage {
  type: 'cursor';
  position: Point;
}

export type WebSocketMessage = 
  | JoinMessage 
  | LeaveMessage 
  | DrawMessage 
  | UndoMessage 
  | RedoMessage 
  | LayerAddMessage 
  | LayerRemoveMessage 
  | LayerUpdateMessage 
  | SyncMessage
  | ClearMessage
  | CursorMessage;

export interface CanvasState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface HistoryState {
  history: DrawingElement[][];
  currentIndex: number;
}
