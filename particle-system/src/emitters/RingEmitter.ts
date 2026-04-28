import { Emitter, ParticleInitialState, EmitterConfig } from './Emitter';

export interface RingEmitterConfig extends EmitterConfig {
  radius?: number;
  radiusThickness?: number;
  emitDirection?: 'outward' | 'inward' | 'upward' | 'tangent' | 'normal';
  arc?: number;
  arcOffset?: number;
}

export class RingEmitter extends Emitter {
  private radius: number;
  private radiusThickness: number;
  private emitDirection: 'outward' | 'inward' | 'upward' | 'tangent' | 'normal';
  private arc: number;
  private arcOffset: number;

  constructor(config: RingEmitterConfig = {}) {
    super(config);
    this.radius = config.radius ?? 1;
    this.radiusThickness = config.radiusThickness ?? 0.1;
    this.emitDirection = config.emitDirection ?? 'outward';
    this.arc = config.arc ?? Math.PI * 2;
    this.arcOffset = config.arcOffset ?? 0;
  }

  getType(): string {
    return 'ring';
  }

  setRadius(radius: number): void {
    this.radius = Math.max(0, radius);
  }

  setRadiusThickness(thickness: number): void {
    this.radiusThickness = Math.max(0, thickness);
  }

  setEmitDirection(mode: 'outward' | 'inward' | 'upward' | 'tangent' | 'normal'): void {
    this.emitDirection = mode;
  }

  setArc(arc: number, offset: number = 0): void {
    this.arc = Math.max(0, Math.min(Math.PI * 2, arc));
    this.arcOffset = offset;
  }

  getParticleInitialState(index: number, _total: number): ParticleInitialState {
    const life = this.randomRange(this.lifeRange.min, this.lifeRange.max, index, 0);
    const size = this.randomRange(this.sizeRange.min, this.sizeRange.max, index, 1);
    const speed = this.randomRange(this.speedRange.min, this.speedRange.max, index, 2);
    const rotation = this.randomRange(this.rotationRange.min, this.rotationRange.max, index, 3);
    const rotationSpeed = this.randomRange(this.rotationSpeedRange.min, this.rotationSpeedRange.max, index, 4);
    
    const colorT = this.random(index, 5);
    const color = this.lerpColor(this.colorStart, this.colorEnd, colorT);

    const angle = this.arcOffset + this.random(index, 10) * this.arc;
    const radiusOffset = (this.random(index, 11) - 0.5) * this.radiusThickness;
    const r = this.radius + radiusOffset;

    const localX = Math.cos(angle) * r;
    const localY = 0;
    const localZ = Math.sin(angle) * r;

    const position: [number, number, number] = [
      this.position[0] + localX,
      this.position[1] + localY,
      this.position[2] + localZ,
    ];

    const velocity = this.calculateVelocity(angle, localX, localZ, speed);

    return {
      position,
      velocity,
      life: [0, life],
      size,
      rotation,
      rotationSpeed,
      color,
    };
  }

  private calculateVelocity(
    angle: number,
    localX: number,
    localZ: number,
    speed: number
  ): [number, number, number] {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    switch (this.emitDirection) {
      case 'outward': {
        const r = Math.max(Math.sqrt(localX * localX + localZ * localZ), 0.001);
        return [
          (localX / r) * speed,
          0,
          (localZ / r) * speed,
        ];
      }
      
      case 'inward': {
        const r = Math.max(Math.sqrt(localX * localX + localZ * localZ), 0.001);
        return [
          (-localX / r) * speed,
          0,
          (-localZ / r) * speed,
        ];
      }
      
      case 'upward':
        return [0, speed, 0];
      
      case 'tangent':
        return [
          -sinAngle * speed,
          0,
          cosAngle * speed,
        ];
      
      case 'normal':
      default:
        return [
          this.direction[0] * speed,
          this.direction[1] * speed,
          this.direction[2] * speed,
        ];
    }
  }
}
