export {
  Emitter,
  PointEmitter,
  SphereEmitter,
  ConeEmitter,
  EmitterFactory,
} from './EmitterFactory';

export type {
  EmitterConfig,
  ParticleInitialState,
  Range,
  ValueOrRange,
  PointEmitterConfig,
  SphereEmitterConfig,
  ConeEmitterConfig,
  EmitterType,
} from './EmitterFactory';

export { isRange, getValueFromRange } from './Emitter';
