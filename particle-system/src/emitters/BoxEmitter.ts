import { Emitter, ParticleInitialState, EmitterConfig } from './Emitter';

export interface BoxEmitterConfig extends EmitterConfig {
  size?: [number, number, number];
  emitFrom?: 'volume' | 'surface' | 'edges';
  velocityMode?: 'outward' | 'inward' | 'directional' | 'random';
}

export class BoxEmitter extends Emitter {
  private size: [number, number, number];
  private emitFrom: 'volume' | 'surface' | 'edges';
  private velocityMode: 'outward' | 'inward' | 'directional' | 'random';

  constructor(config: BoxEmitterConfig = {}) {
    super(config);
    this.size = config.size ?? [1, 1, 1];
    this.emitFrom = config.emitFrom ?? 'volume';
    this.velocityMode = config.velocityMode ?? 'random';
  }

  getType(): string {
    return 'box';
  }

  setSize(x: number, y: number, z: number): void {
    this.size = [Math.max(0, x), Math.max(0, y), Math.max(0, z)];
  }

  setEmitFrom(mode: 'volume' | 'surface' | 'edges'): void {
    this.emitFrom = mode;
  }

  setVelocityMode(mode: 'outward' | 'inward' | 'directional' | 'random'): void {
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

    const localPosition = this.calculatePosition(index);
    const position: [number, number, number] = [
      this.position[0] + localPosition[0],
      this.position[1] + localPosition[1],
      this.position[2] + localPosition[2],
    ];

    const velocity = this.calculateVelocity(localPosition, speed);

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

  private calculatePosition(index: number): [number, number, number] {
    const halfX = this.size[0] / 2;
    const halfY = this.size[1] / 2;
    const halfZ = this.size[2] / 2;

    if (this.emitFrom === 'volume') {
      return [
        (this.random(index, 10) * 2 - 1) * halfX,
        (this.random(index, 11) * 2 - 1) * halfY,
        (this.random(index, 12) * 2 - 1) * halfZ,
      ];
    }

    if (this.emitFrom === 'surface') {
      const areaXY = this.size[0] * this.size[1];
      const areaXZ = this.size[0] * this.size[2];
      const areaYZ = this.size[1] * this.size[2];
      const totalArea = 2 * (areaXY + areaXZ + areaYZ);
      
      let r = this.random(index, 10) * totalArea;
      
      if (r < areaXY) {
        return [
          (this.random(index, 11) * 2 - 1) * halfX,
          (this.random(index, 12) * 2 - 1) * halfY,
          halfZ,
        ];
      }
      r -= areaXY;
      
      if (r < areaXY) {
        return [
          (this.random(index, 11) * 2 - 1) * halfX,
          (this.random(index, 12) * 2 - 1) * halfY,
          -halfZ,
        ];
      }
      r -= areaXY;
      
      if (r < areaXZ) {
        return [
          (this.random(index, 11) * 2 - 1) * halfX,
          halfY,
          (this.random(index, 12) * 2 - 1) * halfZ,
        ];
      }
      r -= areaXZ;
      
      if (r < areaXZ) {
        return [
          (this.random(index, 11) * 2 - 1) * halfX,
          -halfY,
          (this.random(index, 12) * 2 - 1) * halfZ,
        ];
      }
      r -= areaXZ;
      
      if (r < areaYZ) {
        return [
          halfX,
          (this.random(index, 11) * 2 - 1) * halfY,
          (this.random(index, 12) * 2 - 1) * halfZ,
        ];
      }
      
      return [
        -halfX,
        (this.random(index, 11) * 2 - 1) * halfY,
        (this.random(index, 12) * 2 - 1) * halfZ,
      ];
    }

    const edgeSelector = Math.floor(this.random(index, 10) * 12);
    
    switch (edgeSelector) {
      case 0:
        return [-halfX, -halfY, (this.random(index, 11) * 2 - 1) * halfZ];
      case 1:
        return [halfX, -halfY, (this.random(index, 11) * 2 - 1) * halfZ];
      case 2:
        return [-halfX, halfY, (this.random(index, 11) * 2 - 1) * halfZ];
      case 3:
        return [halfX, halfY, (this.random(index, 11) * 2 - 1) * halfZ];
      case 4:
        return [-halfX, (this.random(index, 11) * 2 - 1) * halfY, -halfZ];
      case 5:
        return [halfX, (this.random(index, 11) * 2 - 1) * halfY, -halfZ];
      case 6:
        return [-halfX, (this.random(index, 11) * 2 - 1) * halfY, halfZ];
      case 7:
        return [halfX, (this.random(index, 11) * 2 - 1) * halfY, halfZ];
      case 8:
        return [(this.random(index, 11) * 2 - 1) * halfX, -halfY, -halfZ];
      case 9:
        return [(this.random(index, 11) * 2 - 1) * halfX, halfY, -halfZ];
      case 10:
        return [(this.random(index, 11) * 2 - 1) * halfX, -halfY, halfZ];
      case 11:
      default:
        return [(this.random(index, 11) * 2 - 1) * halfX, halfY, halfZ];
    }
  }

  private calculateVelocity(localPos: [number, number, number], speed: number): [number, number, number] {
    if (this.velocityMode === 'random') {
      const theta = this.random(0, 20) * Math.PI * 2;
      const phi = Math.acos(2 * this.random(0, 21) - 1);
      const sinPhi = Math.sin(phi);
      return [
        sinPhi * Math.cos(theta) * speed,
        sinPhi * Math.sin(theta) * speed,
        Math.cos(phi) * speed,
      ];
    }

    if (this.velocityMode === 'directional') {
      return [
        this.direction[0] * speed,
        this.direction[1] * speed,
        this.direction[2] * speed,
      ];
    }

    const len = Math.sqrt(localPos[0] * localPos[0] + localPos[1] * localPos[1] + localPos[2] * localPos[2]);
    
    if (len < 0.0001) {
      return [0, speed, 0];
    }

    const dir = this.velocityMode === 'outward' ? 1 : -1;
    
    return [
      (localPos[0] / len) * speed * dir,
      (localPos[1] / len) * speed * dir,
      (localPos[2] / len) * speed * dir,
    ];
  }
}
