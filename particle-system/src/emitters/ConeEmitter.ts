import { Emitter, ParticleInitialState, EmitterConfig } from './Emitter';

export interface ConeEmitterConfig extends EmitterConfig {
  angle?: number;
  baseRadius?: number;
  height?: number;
  velocityMode?: 'directional' | 'radial' | 'random';
}

export class ConeEmitter extends Emitter {
  private angle: number;
  private baseRadius: number;
  private height: number;
  private velocityMode: 'directional' | 'radial' | 'random';

  constructor(config: ConeEmitterConfig = {}) {
    super(config);
    this.angle = config.angle ?? Math.PI / 4;
    this.baseRadius = config.baseRadius ?? 0;
    this.height = config.height ?? 1;
    this.velocityMode = config.velocityMode ?? 'directional';
  }

  getType(): string {
    return 'cone';
  }

  setAngle(angle: number): void {
    this.angle = Math.max(0, Math.min(Math.PI, angle));
  }

  setBaseRadius(radius: number): void {
    this.baseRadius = Math.max(0, radius);
  }

  setHeight(height: number): void {
    this.height = Math.max(0.001, height);
  }

  setVelocityMode(mode: 'directional' | 'radial' | 'random'): void {
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

    const position = this.calculatePosition(index);
    const velocity = this.calculateVelocity(index, speed, position);

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

  private calculatePosition(index: number): [number, number, number] {
    if (this.baseRadius <= 0 || this.height <= 0) {
      return [0, 0, 0];
    }

    const t = this.random(index, 10);
    const theta = this.random(index, 11) * Math.PI * 2;

    const radiusAtT = this.baseRadius * t;
    const r = Math.sqrt(this.random(index, 12)) * radiusAtT;

    return [
      r * Math.cos(theta),
      t * this.height,
      r * Math.sin(theta),
    ];
  }

  private calculateVelocity(
    index: number,
    speed: number,
    localPosition: [number, number, number]
  ): [number, number, number] {
    const dir = this.normalize(this.direction);
    const up = Math.abs(dir[1]) < 0.999 ? [0, 1, 0] : [1, 0, 0];
    const right = this.normalize([
      up[1] * dir[2] - up[2] * dir[1],
      up[2] * dir[0] - up[0] * dir[2],
      up[0] * dir[1] - up[1] * dir[0],
    ]);
    const newUp = [
      dir[1] * right[2] - dir[2] * right[1],
      dir[2] * right[0] - dir[0] * right[2],
      dir[0] * right[1] - dir[1] * right[0],
    ];

    switch (this.velocityMode) {
      case 'radial': {
        const radialDir: [number, number, number] = [
          localPosition[0],
          0,
          localPosition[2],
        ];
        const len = Math.sqrt(radialDir[0] ** 2 + radialDir[2] ** 2);
        if (len > 0) {
          radialDir[0] /= len;
          radialDir[2] /= len;
        }
        
        const worldRadialDir: [number, number, number] = [
          radialDir[0] * right[0] + radialDir[2] * newUp[0],
          0,
          radialDir[0] * right[2] + radialDir[2] * newUp[2],
        ];
        
        return [
          worldRadialDir[0] * speed,
          worldRadialDir[1] * speed,
          worldRadialDir[2] * speed,
        ];
      }

      case 'random': {
        const theta = this.random(index, 20) * Math.PI * 2;
        const phi = Math.acos(2 * this.random(index, 21) - 1);
        const sinPhi = Math.sin(phi);
        const randomDir: [number, number, number] = [
          sinPhi * Math.cos(theta),
          sinPhi * Math.sin(theta),
          Math.cos(phi),
        ];
        
        const worldDir: [number, number, number] = [
          randomDir[0] * right[0] + randomDir[1] * newUp[0] + randomDir[2] * dir[0],
          randomDir[0] * right[1] + randomDir[1] * newUp[1] + randomDir[2] * dir[1],
          randomDir[0] * right[2] + randomDir[1] * newUp[2] + randomDir[2] * dir[2],
        ];
        
        return [
          worldDir[0] * speed,
          worldDir[1] * speed,
          worldDir[2] * speed,
        ];
      }

      case 'directional':
      default: {
        const halfAngle = this.angle / 2;
        const u1 = this.random(index, 15);
        const u2 = this.random(index, 16);

        const cosAngle = Math.cos(halfAngle);
        const z = u1 * (1 - cosAngle) + cosAngle;
        const sqrtZ = Math.sqrt(1 - z * z);
        const azimuth = Math.PI * 2 * u2;

        const randomDir: [number, number, number] = [
          sqrtZ * Math.cos(azimuth),
          sqrtZ * Math.sin(azimuth),
          z,
        ];

        const worldDir: [number, number, number] = [
          randomDir[0] * right[0] + randomDir[1] * newUp[0] + randomDir[2] * dir[0],
          randomDir[0] * right[1] + randomDir[1] * newUp[1] + randomDir[2] * dir[1],
          randomDir[0] * right[2] + randomDir[1] * newUp[2] + randomDir[2] * dir[2],
        ];

        return [
          worldDir[0] * speed,
          worldDir[1] * speed,
          worldDir[2] * speed,
        ];
      }
    }
  }
}
