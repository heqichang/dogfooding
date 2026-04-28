import { Emitter, ParticleInitialState, EmitterConfig } from './Emitter';

export interface SphereEmitterConfig extends EmitterConfig {
  radius?: number;
  innerRadius?: number;
  emitFrom?: 'volume' | 'surface';
  velocityMode?: 'outward' | 'inward' | 'radial' | 'random';
}

export class SphereEmitter extends Emitter {
  private radius: number;
  private innerRadius: number;
  private emitFrom: 'volume' | 'surface';
  private velocityMode: 'outward' | 'inward' | 'radial' | 'random';

  constructor(config: SphereEmitterConfig = {}) {
    super(config);
    this.radius = config.radius ?? 1;
    this.innerRadius = config.innerRadius ?? 0;
    this.emitFrom = config.emitFrom ?? 'volume';
    this.velocityMode = config.velocityMode ?? 'outward';
  }

  getType(): string {
    return 'sphere';
  }

  setRadius(radius: number): void {
    this.radius = Math.max(0, radius);
    this.innerRadius = Math.min(this.innerRadius, this.radius);
  }

  setInnerRadius(radius: number): void {
    this.innerRadius = Math.max(0, Math.min(radius, this.radius));
  }

  setEmitFrom(mode: 'volume' | 'surface'): void {
    this.emitFrom = mode;
  }

  setVelocityMode(mode: 'outward' | 'inward' | 'radial' | 'random'): void {
    this.velocityMode = mode;
  }

  getParticleInitialState(index: number, _total: number): ParticleInitialState {
    const life = this.randomRange(this.lifeRange.min, this.lifeRange.max, index, 0);
    const size = this.randomRange(this.sizeRange.min, this.sizeRange.max, index, 1);
    const speed = this.randomRange(this.speedRange.min, this.speedRange.max, index, 2);
    const rotation = this.randomRange(this.rotationRange.min, this.rotationRange.max, index, 3);
    const rotationSpeed = this.randomRange(this.rotationSpeedRange.min, this.rotationSpeedRange.max, index, 4);
    
    const colorT = this.random(index, 5);
    const color = this.lerpColor(this.colorStart, this.colorEnd, colorT);

    const { position, direction } = this.calculatePositionAndDirection(index);

    let velocity: [number, number, number];
    
    switch (this.velocityMode) {
      case 'outward':
        velocity = [
          direction[0] * speed,
          direction[1] * speed,
          direction[2] * speed,
        ];
        break;
      case 'inward':
        velocity = [
          -direction[0] * speed,
          -direction[1] * speed,
          -direction[2] * speed,
        ];
        break;
      case 'radial':
        const radialSpeed = this.randomRange(-speed, speed, index, 10);
        velocity = [
          direction[0] * radialSpeed,
          direction[1] * radialSpeed,
          direction[2] * radialSpeed,
        ];
        break;
      case 'random':
      default:
        const theta = this.random(index, 11) * Math.PI * 2;
        const phi = Math.acos(2 * this.random(index, 12) - 1);
        const sinPhi = Math.sin(phi);
        velocity = [
          sinPhi * Math.cos(theta) * speed,
          sinPhi * Math.sin(theta) * speed,
          Math.cos(phi) * speed,
        ];
        break;
    }

    return {
      position: [
        this.position[0] + position[0],
        this.position[1] + position[1],
        this.position[2] + position[2],
      ],
      velocity,
      life: [0, life],
      size,
      rotation,
      rotationSpeed,
      color,
    };
  }

  private calculatePositionAndDirection(index: number): { 
    position: [number, number, number]; 
    direction: [number, number, number] 
  } {
    const theta = this.random(index, 20) * Math.PI * 2;
    const phi = Math.acos(2 * this.random(index, 21) - 1);

    let radius: number;
    if (this.emitFrom === 'surface') {
      radius = this.radius;
    } else {
      const u = this.random(index, 22);
      const minRadius = Math.max(0, this.innerRadius);
      const maxRadius = this.radius;
      const minRadius3 = minRadius * minRadius * minRadius;
      const maxRadius3 = maxRadius * maxRadius * maxRadius;
      const r3 = minRadius3 + u * (maxRadius3 - minRadius3);
      radius = Math.pow(r3, 1 / 3);
    }

    const sinPhi = Math.sin(phi);
    const direction: [number, number, number] = [
      sinPhi * Math.cos(theta),
      sinPhi * Math.sin(theta),
      Math.cos(phi),
    ];

    const position: [number, number, number] = [
      direction[0] * radius,
      direction[1] * radius,
      direction[2] * radius,
    ];

    return { position, direction };
  }
}
