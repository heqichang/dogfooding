export interface ParticlePresetConfig {
  emitterType: 'point' | 'sphere' | 'cone' | 'box' | 'ring';
  emitterConfig: {
    position?: [number, number, number];
    direction?: [number, number, number];
    emissionRate: number;
    emitMode?: 'continuous' | 'burst';
    burstCount?: number;
    speedRange: { min: number; max: number };
    lifeRange: { min: number; max: number };
    sizeRange: { min: number; max: number };
    emitDirection?: 'omni' | 'directional';
    spreadAngle?: number;
    size?: [number, number, number];
    emitFrom?: 'volume' | 'surface' | 'edges';
    velocityMode?: 'outward' | 'inward' | 'directional' | 'random';
    radius?: number;
    radiusThickness?: number;
  };
  
  colorStart: [number, number, number, number];
  colorEnd: [number, number, number, number];
  useColorGradient: boolean;
  
  gravity: { x: number; y: number; z: number };
  drag: number;
  
  useGroundCollision: boolean;
  groundY: number;
  groundRestitution: number;
  groundFriction: number;
  
  useAdditiveBlending: boolean;
}

export type PresetType = 
  | 'fire'
  | 'smoke'
  | 'explosion'
  | 'rain'
  | 'snow'
  | 'fountain'
  | 'spark'
  | 'confetti';

export function getPresetConfig(preset: PresetType): ParticlePresetConfig {
  switch (preset) {
    case 'fire':
      return {
        emitterType: 'point',
        emitterConfig: {
          position: [0, 0, 0],
          direction: [0, 1, 0],
          emissionRate: 500,
          emitMode: 'continuous',
          speedRange: { min: 3, max: 6 },
          lifeRange: { min: 1.5, max: 3 },
          sizeRange: { min: 8, max: 16 },
          emitDirection: 'directional',
          spreadAngle: Math.PI / 3,
        },
        colorStart: [1, 1, 0.5, 1],
        colorEnd: [1, 0.2, 0, 0],
        useColorGradient: true,
        gravity: { x: 0, y: -2, z: 0 },
        drag: 0.05,
        useGroundCollision: false,
        groundY: 0,
        groundRestitution: 0,
        groundFriction: 0,
        useAdditiveBlending: true,
      };

    case 'smoke':
      return {
        emitterType: 'point',
        emitterConfig: {
          position: [0, 0, 0],
          direction: [0, 1, 0],
          emissionRate: 200,
          emitMode: 'continuous',
          speedRange: { min: 1, max: 2.5 },
          lifeRange: { min: 3, max: 6 },
          sizeRange: { min: 15, max: 30 },
          emitDirection: 'directional',
          spreadAngle: Math.PI / 2,
        },
        colorStart: [0.6, 0.6, 0.6, 0.9],
        colorEnd: [0.3, 0.3, 0.3, 0],
        useColorGradient: true,
        gravity: { x: 0, y: 0.5, z: 0 },
        drag: 0.15,
        useGroundCollision: false,
        groundY: 0,
        groundRestitution: 0,
        groundFriction: 0,
        useAdditiveBlending: false,
      };

    case 'explosion':
      return {
        emitterType: 'sphere',
        emitterConfig: {
          position: [0, 0, 0],
          emissionRate: 0,
          emitMode: 'burst',
          burstCount: 2000,
          speedRange: { min: 5, max: 12 },
          lifeRange: { min: 0.5, max: 2 },
          sizeRange: { min: 4, max: 10 },
          velocityMode: 'outward',
        },
        colorStart: [1, 1, 0.8, 1],
        colorEnd: [1, 0.4, 0, 0],
        useColorGradient: true,
        gravity: { x: 0, y: -5, z: 0 },
        drag: 0.3,
        useGroundCollision: true,
        groundY: -2,
        groundRestitution: 0.3,
        groundFriction: 0.2,
        useAdditiveBlending: true,
      };

    case 'rain':
      return {
        emitterType: 'box',
        emitterConfig: {
          position: [0, 5, 0],
          emissionRate: 1000,
          emitMode: 'continuous',
          size: [10, 0.5, 10],
          emitFrom: 'volume',
          speedRange: { min: 8, max: 12 },
          lifeRange: { min: 1, max: 1.5 },
          sizeRange: { min: 2, max: 3 },
          velocityMode: 'directional',
          direction: [0, -1, 0],
        },
        colorStart: [0.7, 0.8, 1, 0.9],
        colorEnd: [0.5, 0.6, 0.9, 0.5],
        useColorGradient: true,
        gravity: { x: 0, y: -20, z: 0 },
        drag: 0.0,
        useGroundCollision: true,
        groundY: -2,
        groundRestitution: 0.1,
        groundFriction: 0.5,
        useAdditiveBlending: false,
      };

    case 'snow':
      return {
        emitterType: 'box',
        emitterConfig: {
          position: [0, 5, 0],
          emissionRate: 300,
          emitMode: 'continuous',
          size: [10, 0.5, 10],
          emitFrom: 'volume',
          speedRange: { min: 1, max: 2 },
          lifeRange: { min: 4, max: 8 },
          sizeRange: { min: 3, max: 8 },
          velocityMode: 'directional',
          direction: [0, -1, 0],
        },
        colorStart: [1, 1, 1, 1],
        colorEnd: [0.9, 0.95, 1, 0.3],
        useColorGradient: true,
        gravity: { x: 0, y: -1, z: 0 },
        drag: 0.4,
        useGroundCollision: true,
        groundY: -2,
        groundRestitution: 0.05,
        groundFriction: 0.8,
        useAdditiveBlending: false,
      };

    case 'fountain':
      return {
        emitterType: 'cone',
        emitterConfig: {
          position: [0, 0, 0],
          direction: [0, 1, 0],
          emissionRate: 800,
          emitMode: 'continuous',
          speedRange: { min: 6, max: 10 },
          lifeRange: { min: 2, max: 3.5 },
          sizeRange: { min: 4, max: 8 },
        },
        colorStart: [0.5, 0.8, 1, 1],
        colorEnd: [0.3, 0.5, 0.8, 0],
        useColorGradient: true,
        gravity: { x: 0, y: -9.8, z: 0 },
        drag: 0.05,
        useGroundCollision: true,
        groundY: 0,
        groundRestitution: 0.3,
        groundFriction: 0.3,
        useAdditiveBlending: true,
      };

    case 'spark':
      return {
        emitterType: 'point',
        emitterConfig: {
          position: [0, 0, 0],
          emissionRate: 600,
          emitMode: 'continuous',
          speedRange: { min: 4, max: 8 },
          lifeRange: { min: 0.3, max: 0.8 },
          sizeRange: { min: 2, max: 5 },
          emitDirection: 'omni',
        },
        colorStart: [1, 0.9, 0.6, 1],
        colorEnd: [1, 0.5, 0.1, 0],
        useColorGradient: true,
        gravity: { x: 0, y: -5, z: 0 },
        drag: 0.1,
        useGroundCollision: false,
        groundY: 0,
        groundRestitution: 0,
        groundFriction: 0,
        useAdditiveBlending: true,
      };

    case 'confetti':
      return {
        emitterType: 'box',
        emitterConfig: {
          position: [0, 3, 0],
          emissionRate: 0,
          emitMode: 'burst',
          burstCount: 500,
          size: [2, 2, 2],
          emitFrom: 'volume',
          speedRange: { min: 3, max: 7 },
          lifeRange: { min: 3, max: 6 },
          sizeRange: { min: 6, max: 12 },
          velocityMode: 'random',
        },
        colorStart: [1, 1, 1, 1],
        colorEnd: [1, 1, 1, 0.5],
        useColorGradient: false,
        gravity: { x: 0, y: -8, z: 0 },
        drag: 0.15,
        useGroundCollision: true,
        groundY: -2,
        groundRestitution: 0.6,
        groundFriction: 0.4,
        useAdditiveBlending: false,
      };

    default:
      return getPresetConfig('fire');
  }
}

export function getPresetList(): PresetType[] {
  return ['fire', 'smoke', 'explosion', 'rain', 'snow', 'fountain', 'spark', 'confetti'];
}

export function getPresetDisplayName(preset: PresetType): string {
  const names: Record<PresetType, string> = {
    fire: '火焰',
    smoke: '烟雾',
    explosion: '爆炸',
    rain: '下雨',
    snow: '下雪',
    fountain: '喷泉',
    spark: '火花',
    confetti: '彩屑',
  };
  return names[preset] || preset;
}
