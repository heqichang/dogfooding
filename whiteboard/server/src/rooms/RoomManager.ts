import { v4 as uuidv4 } from 'uuid';
import { Room, User, DrawingElement, Layer } from '../types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getOrCreateRoom(roomId: string): Room {
    let room = this.rooms.get(roomId);
    
    if (!room) {
      const defaultLayer: Layer = {
        id: uuidv4(),
        name: '图层 1',
        visible: true,
        locked: false,
        order: 0,
      };

      room = {
        id: roomId,
        users: new Map<string, User>(),
        elements: [],
        layers: [defaultLayer],
        history: [],
      };
      
      this.rooms.set(roomId, room);
    }
    
    return room;
  }

  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  getAllRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  addElementToRoom(roomId: string, element: DrawingElement): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.elements.push(element);
    }
  }

  getElementsFromRoom(roomId: string): DrawingElement[] {
    const room = this.rooms.get(roomId);
    return room ? [...room.elements] : [];
  }

  clearRoomElements(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.elements = [];
      room.history = [];
    }
  }

  addUserToRoom(roomId: string, user: User): void {
    const room = this.getOrCreateRoom(roomId);
    room.users.set(user.id, user);
  }

  removeUserFromRoom(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.delete(userId);
    }
  }

  getUsersFromRoom(roomId: string): User[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.values()) : [];
  }

  addLayerToRoom(roomId: string, layer: Layer): void {
    const room = this.getOrCreateRoom(roomId);
    room.layers.push(layer);
  }

  removeLayerFromRoom(roomId: string, layerId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.layers = room.layers.filter((l) => l.id !== layerId);
    }
  }

  getLayersFromRoom(roomId: string): Layer[] {
    const room = this.rooms.get(roomId);
    return room ? [...room.layers] : [];
  }

  updateLayerInRoom(roomId: string, layerId: string, updates: Partial<Layer>): void {
    const room = this.rooms.get(roomId);
    if (room) {
      const layerIndex = room.layers.findIndex((l) => l.id === layerId);
      if (layerIndex !== -1) {
        room.layers[layerIndex] = { ...room.layers[layerIndex], ...updates };
      }
    }
  }
}
