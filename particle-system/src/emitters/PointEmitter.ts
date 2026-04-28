import { Emitter, ParticleInitialState, EmitterConfig } from './Emitter';

export interface PointEmitterConfig extends EmitterConfig {
  spreadAngle?: number;
  emitDirection?: 'omni' | 'directional';
}

export class PointEmitter extends Emitter {
  private spreadAngle: number;
  private emitDirection: 'omni' | 'directional';

  constructor(config: PointEmitterConfig = {}) {
    super(config);
    this.spreadAngle = config.spreadAngle ?? Math.PI * 2;
    this.emitDirection = config.emitDirection ?? 'omni';
  }

  getType(): string {
    return 'point';
  }

  setSpreadAngle(angle: number): void {
    this.spreadAngle = Math.max(0, Math.min(Math.PI * 2, angle));
  }

  setEmitDirection(mode: 'omni' | 'directional'): void {
    this.emitDirection = mode;
  }

  getParticleInitialState(index: number, _total: number): ParticleInitialState {
    const life = this.randomRange(this.lifeRange.min, this.lifeRange.max, index, 0);
    const size = this.randomRange(this.sizeRange.min, this.sizeRange.max, index, 1);
    const speed = this.randomRange(this.speedRange.min, this.speedRange.max, index, 2);
    const rotation = this.randomRange(this.rotationRange.min, this.rotationRange.max, index, 3);
    const rotationSpeed = this.randomRange(this.rotationSpeedRange.min, this.rotationSpeedRange.max, index, 4);
    
    const colorT = this.random(index, 5);
    const color = this.lerpColor(this.colorStart, this.colorEnd, colorT);

    const velocity = this.calculateVelocity(index, speed);

    return {
      position: [...this.position] as [number, number, number],
      velocity,
      life: [0, life],
      size,
      rotation,
      rotationSpeed,
      color,
    };
  }

  private calculateVelocity(index: number, speed: number): [number, number, number] {
    if (this.emitDirection === 'omni' || this.spreadAngle >= Math.PI * 2) {
      const theta = this.random(index, 10) * Math.PI * 2;
      const phi = Math.acos(2 * this.random(index, 11) - 1);
      
      const sinPhi = Math.sin(phi);
      return [
        sinPhi * Math.cos(theta) * speed,
        sinPhi * Math.sin(theta) * speed,
        Math.cos(phi) * speed,
      ];
    }

    if (this.spreadAngle <= 0) {
      return [
        this.direction[0] * speed,
        this.direction[1] * speed,
        this.direction[2] * speed,
      ];
    }

    const dir = this.normalize(this.direction);
    const up = Math.abs(dir[2]) < 0.999 ? [0, 0, 1] : [1, 0, 0];
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

    const halfAngle = this.spreadAngle / 2;
    const u1 = this.random(index, 12);
    const u2 = this.random(index, 13);

    const cosAngle = Math.cos(halfAngle);
    const z = u1 * (1 - cosAngle) + cosAngle;
    const sqrtZ = Math.sqrt(1 - z * z);
    const azimuth = Math.PI * 2 * u2;

    const randomDir = [
      sqrtZ * Math.cos(azimuth),
      sqrtZ * Math.sin(azimuth),
      z,
    ];

    const velocity = [
      randomDir[0] * right[0] + randomDir[1] * newUp[0] + randomDir[2] * dir[0],
      randomDir[0] * right[1] + randomDir[1] * newUp[1] + randomDir[2] * dir[1],
      randomDir[0] * right[2] + randomDir[1] * newUp[2] + randomDir[2] * dir[2],
    ];

    return [
      velocity[0] * speed,
      velocity[1] * speed,
      velocity[2] * speed,
    ];
  }
}
