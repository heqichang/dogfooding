import { Emitter, EmitterConfig } from './Emitter';
import { PointEmitter, PointEmitterConfig } from './PointEmitter';
import { SphereEmitter, SphereEmitterConfig } from './SphereEmitter';
import { ConeEmitter, ConeEmitterConfig } from './ConeEmitter';
import { BoxEmitter, BoxEmitterConfig } from './BoxEmitter';
import { RingEmitter, RingEmitterConfig } from './RingEmitter';

export type EmitterType = 'point' | 'sphere' | 'cone' | 'box' | 'ring';

export interface EmitterFactoryConfig {
  type: EmitterType;
  config?: EmitterConfig;
}

export class EmitterFactory {
  static create(type: 'point', config?: PointEmitterConfig): PointEmitter;
  static create(type: 'sphere', config?: SphereEmitterConfig): SphereEmitter;
  static create(type: 'cone', config?: ConeEmitterConfig): ConeEmitter;
  static create(type: 'box', config?: BoxEmitterConfig): BoxEmitter;
  static create(type: 'ring', config?: RingEmitterConfig): RingEmitter;
  static create(type: EmitterType, config?: EmitterConfig): Emitter {
    switch (type) {
      case 'point':
        return new PointEmitter(config as PointEmitterConfig);
      case 'sphere':
        return new SphereEmitter(config as SphereEmitterConfig);
      case 'cone':
        return new ConeEmitter(config as ConeEmitterConfig);
      case 'box':
        return new BoxEmitter(config as BoxEmitterConfig);
      case 'ring':
        return new RingEmitter(config as RingEmitterConfig);
      default:
        return new PointEmitter(config);
    }
  }

  static createPoint(config?: PointEmitterConfig): PointEmitter {
    return new PointEmitter(config);
  }

  static createSphere(config?: SphereEmitterConfig): SphereEmitter {
    return new SphereEmitter(config);
  }

  static createCone(config?: ConeEmitterConfig): ConeEmitter {
    return new ConeEmitter(config);
  }

  static createBox(config?: BoxEmitterConfig): BoxEmitter {
    return new BoxEmitter(config);
  }

  static createRing(config?: RingEmitterConfig): RingEmitter {
    return new RingEmitter(config);
  }
}

export {
  Emitter,
  PointEmitter,
  SphereEmitter,
  ConeEmitter,
  BoxEmitter,
  RingEmitter,
};

export type {
  EmitterConfig,
  ParticleInitialState,
  Range,
  ValueOrRange,
} from './Emitter';

export type {
  PointEmitterConfig,
} from './PointEmitter';

export type {
  SphereEmitterConfig,
} from './SphereEmitter';

export type {
  ConeEmitterConfig,
} from './ConeEmitter';

export type {
  BoxEmitterConfig,
} from './BoxEmitter';

export type {
  RingEmitterConfig,
} from './RingEmitter';
