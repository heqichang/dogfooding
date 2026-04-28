export interface ParticleInitialState {
  position: [number, number, number];
  velocity: [number, number, number];
  life: [number, number];
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: [number, number, number, number];
}

export interface Range<T> {
  min: T;
  max: T;
}

export type ValueOrRange<T> = T | Range<T>;

export interface EmitterConfig {
  position?: [number, number, number];
  direction?: [number, number, number];
  emissionRate?: number;
  emitMode?: 'continuous' | 'burst';
  burstCount?: number;
  
  lifeRange?: Range<number>;
  sizeRange?: Range<number>;
  speedRange?: Range<number>;
  rotationRange?: Range<number>;
  rotationSpeedRange?: Range<number>;
  colorStart?: [number, number, number, number];
  colorEnd?: [number, number, number, number];
  
  seed?: number;
}

export abstract class Emitter {
  protected position: [number, number, number];
  protected direction: [number, number, number];
  protected emissionRate: number;
  protected emitMode: 'continuous' | 'burst';
  protected burstCount: number;
  protected hasBurst: boolean = false;
  
  protected lifeRange: Range<number>;
  protected sizeRange: Range<number>;
  protected speedRange: Range<number>;
  protected rotationRange: Range<number>;
  protected rotationSpeedRange: Range<number>;
  protected colorStart: [number, number, number, number];
  protected colorEnd: [number, number, number, number];
  
  protected seed: number;
  protected emissionAccumulator: number = 0;

  constructor(config: EmitterConfig = {}) {
    this.position = config.position || [0, 0, 0];
    this.direction = config.direction || [0, 1, 0];
    this.emissionRate = config.emissionRate || 100;
    this.emitMode = config.emitMode || 'continuous';
    this.burstCount = config.burstCount || 0;
    
    this.lifeRange = config.lifeRange || { min: 2, max: 4 };
    this.sizeRange = config.sizeRange || { min: 5, max: 15 };
    this.speedRange = config.speedRange || { min: 1, max: 3 };
    this.rotationRange = config.rotationRange || { min: 0, max: Math.PI * 2 };
    this.rotationSpeedRange = config.rotationSpeedRange || { min: -2, max: 2 };
    this.colorStart = config.colorStart || [1, 1, 1, 1];
    this.colorEnd = config.colorEnd || [1, 1, 1, 1];
    
    this.seed = config.seed || Math.random() * 10000;
  }

  abstract getType(): string;

  setPosition(x: number, y: number, z: number): void {
    this.position = [x, y, z];
  }

  setDirection(x: number, y: number, z: number): void {
    const len = Math.sqrt(x * x + y * y + z * z);
    if (len > 0) {
      this.direction = [x / len, y / len, z / len];
    }
  }

  setEmissionRate(rate: number): void {
    this.emissionRate = Math.max(0, rate);
  }

  setSeed(seed: number): void {
    this.seed = seed;
  }

  update(deltaTime: number): number {
    if (this.emitMode === 'burst' && !this.hasBurst) {
      this.hasBurst = true;
      return this.burstCount;
    }
    
    if (this.emitMode === 'burst') {
      return 0;
    }
    
    this.emissionAccumulator += this.emissionRate * deltaTime;
    const emitCount = Math.floor(this.emissionAccumulator);
    this.emissionAccumulator -= emitCount;
    return emitCount;
  }

  emit(count: number): ParticleInitialState[] {
    const particles: ParticleInitialState[] = [];
    for (let i = 0; i < count; i++) {
      particles.push(this.getParticleInitialState(i, count));
    }
    return particles;
  }

  abstract getParticleInitialState(index: number, total: number): ParticleInitialState;

  protected random(particleIndex: number, offset: number = 0): number {
    const x = Math.sin(this.seed + particleIndex * 127.1 + offset * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  protected randomRange(min: number, max: number, particleIndex: number, offset: number = 0): number {
    return min + this.random(particleIndex, offset) * (max - min);
  }

  protected lerpColor(
    start: [number, number, number, number],
    end: [number, number, number, number],
    t: number
  ): [number, number, number, number] {
    return [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t,
      start[2] + (end[2] - start[2]) * t,
      start[3] + (end[3] - start[3]) * t,
    ];
  }

  protected normalize(v: [number, number, number]): [number, number, number] {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (len === 0) return [0, 0, 0];
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  reset(): void {
    this.emissionAccumulator = 0;
    this.hasBurst = false;
  }
}

export function isRange<T>(value: ValueOrRange<T>): value is Range<T> {
  return value !== null && typeof value === 'object' && 'min' in value && 'max' in value;
}

export function getValueFromRange<T>(value: ValueOrRange<T>, randomFn: () => number): T {
  if (isRange(value)) {
    const min = value.min as number;
    const max = value.max as number;
    const t = randomFn();
    return (min + t * (max - min)) as unknown as T;
  }
  return value as T;
}
