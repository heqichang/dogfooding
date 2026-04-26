import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CanvasState, Point } from '../types';

interface CanvasContextType extends CanvasState {
  setZoom: (zoom: number) => void;
  setOffset: (x: number, y: number) => void;
  resetCanvas: () => void;
  screenToCanvas: (screenX: number, screenY: number) => Point;
}

const initialState: CanvasState = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

type Action =
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_OFFSET'; payload: { x: number; y: number } }
  | { type: 'RESET' };

function canvasReducer(state: CanvasState, action: Action): CanvasState {
  switch (action.type) {
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.payload)) };
    case 'SET_OFFSET':
      return { ...state, offsetX: action.payload.x, offsetY: action.payload.y };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  const setZoom = (zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  };

  const setOffset = (x: number, y: number) => {
    dispatch({ type: 'SET_OFFSET', payload: { x, y } });
  };

  const resetCanvas = () => {
    dispatch({ type: 'RESET' });
  };

  const screenToCanvas = (screenX: number, screenY: number): Point => {
    return {
      x: (screenX - state.offsetX) / state.zoom,
      y: (screenY - state.offsetY) / state.zoom,
    };
  };

  return (
    <CanvasContext.Provider
      value={{
        ...state,
        setZoom,
        setOffset,
        resetCanvas,
        screenToCanvas,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = (): CanvasContextType => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};
