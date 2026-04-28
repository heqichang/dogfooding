/**
 * WebGL 核心引擎模块
 * 包含粒子系统的核心 WebGL 渲染类和粒子数据结构
 */

export { ParticleSystem } from './ParticleSystem';

export { WebGLContext } from './WebGLContext';
export { Shader } from './Shader';
export type { ShaderType, ShaderError } from './Shader';
export { ShaderProgram } from './ShaderProgram';
export { Buffer } from './Buffer';
export type { BufferTarget, BufferUsage, BufferDataType } from './Buffer';
export { VertexArray } from './VertexArray';
export type { VertexAttribute, IndexBufferConfig } from './VertexArray';
export { RenderLoop } from './RenderLoop';
export type { RenderCallback, FPSStats } from './RenderLoop';

export type {
  ParticleAttribute,
  ParticleAttributeType,
  ParticleAttributeName,
} from './ParticleAttribute';
export {
  PARTICLE_ATTRIBUTES,
  PARTICLE_ATTRIBUTE_LIST,
  calculateParticleByteSize,
  calculateParticleComponentCount,
  calculateTotalMemory,
  formatBytes,
  validateMemoryCalculation,
} from './ParticleAttribute';

export { ParticleBuffer } from './ParticleBuffer';
export type { ParticleBufferOptions } from './ParticleBuffer';

export { PingPongBuffer } from './PingPongBuffer';
export type { PingPongBufferOptions } from './PingPongBuffer';

export { ParticleSystemBuffer } from './ParticleSystemBuffer';
export type {
  ParticleSystemBufferOptions,
  ParticleBufferMap,
} from './ParticleSystemBuffer';

export { ParticleSystemState } from './ParticleSystemState';
export type {
  ParticleSystemStatus,
  ParticleSystemStateOptions,
} from './ParticleSystemState';

export { TransformFeedbackManager, getTransformFeedbackVaryingNames } from './TransformFeedbackManager';
export type {
  TransformFeedbackConfig,
  TransformFeedbackBuffers,
} from './TransformFeedbackManager';

export { ParticleUpdateSystem } from './ParticleUpdateSystem';
export type {
  ParticleUpdateSystemConfig,
  ParticleUpdateState,
  BlendMode,
} from './ParticleUpdateSystem';

export { Texture } from './Texture';
export type {
  TextureConfig,
  TextureMagFilter,
  TextureMinFilter,
  TextureWrapMode,
} from './Texture';

export {
  GPURandomShaderFunctions,
  GPURandomUniforms,
  createGPURandomShaderCode,
  injectGPURandomIntoShader,
} from './GPURandom';
