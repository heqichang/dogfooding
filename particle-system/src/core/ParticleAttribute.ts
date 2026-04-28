/**
 * 粒子属性定义
 * 定义粒子系统中每个属性的类型、布局和元数据
 */

/**
 * 粒子属性数据类型
 */
export type ParticleAttributeType = 'float';

/**
 * 粒子属性元数据接口
 */
export interface ParticleAttribute {
  /** 属性名称（用于着色器中的 in/out 变量名） */
  name: string;
  /** 组件数量：1 (scalar), 2 (vec2), 3 (vec3), 4 (vec4) */
  componentCount: 1 | 2 | 3 | 4;
  /** 数据类型 */
  dataType: ParticleAttributeType;
  /** 单粒子字节大小 */
  byteSize: number;
  /** 在数组结构中的字节偏移量（主要用于计算和验证） */
  byteOffset: number;
}

/**
 * 粒子属性类型枚举
 */
export type ParticleAttributeName = 
  | 'position' 
  | 'velocity' 
  | 'life' 
  | 'size' 
  | 'rotation' 
  | 'rotationSpeed' 
  | 'color';

/**
 * 粒子属性布局定义
 * 采用"数组结构" (Structure of Arrays) 模式
 * 每个属性一个独立的缓冲区，获得更好的 GPU 缓存性能
 */
export const PARTICLE_ATTRIBUTES: Record<ParticleAttributeName, ParticleAttribute> = {
  /**
   * 位置属性
   * vec3 (x, y, z) - 粒子的三维空间位置
   */
  position: {
    name: 'a_position',
    componentCount: 3,
    dataType: 'float',
    byteSize: 3 * 4,
    byteOffset: 0,
  },

  /**
   * 速度属性
   * vec3 (vx, vy, vz) - 粒子的三维速度向量
   */
  velocity: {
    name: 'a_velocity',
    componentCount: 3,
    dataType: 'float',
    byteSize: 3 * 4,
    byteOffset: 3 * 4,
  },

  /**
   * 生命周期属性
   * vec2 (currentAge, maxLife) - 当前年龄和最大生命周期
   * - currentAge: 粒子已存活时间（秒）
   * - maxLife: 粒子最大存活时间（秒）
   */
  life: {
    name: 'a_life',
    componentCount: 2,
    dataType: 'float',
    byteSize: 2 * 4,
    byteOffset: 6 * 4,
  },

  /**
   * 大小属性
   * float - 粒子的大小（像素或世界单位）
   * 对于椭圆粒子，可以使用 vec2 (width, height)
   */
  size: {
    name: 'a_size',
    componentCount: 1,
    dataType: 'float',
    byteSize: 1 * 4,
    byteOffset: 8 * 4,
  },

  /**
   * 旋转属性
   * float - 粒子的当前旋转角度（弧度）
   */
  rotation: {
    name: 'a_rotation',
    componentCount: 1,
    dataType: 'float',
    byteSize: 1 * 4,
    byteOffset: 9 * 4,
  },

  /**
   * 旋转速度属性
   * float - 粒子的旋转速度（弧度/秒）
   */
  rotationSpeed: {
    name: 'a_rotationSpeed',
    componentCount: 1,
    dataType: 'float',
    byteSize: 1 * 4,
    byteOffset: 10 * 4,
  },

  /**
   * 颜色属性
   * vec4 (r, g, b, a) - 粒子的颜色
   * - r, g, b: 颜色分量（0.0 - 1.0）
   * - a: 透明度（0.0 - 1.0）
   * 也可以用作颜色渐变索引（根据具体实现）
   */
  color: {
    name: 'a_color',
    componentCount: 4,
    dataType: 'float',
    byteSize: 4 * 4,
    byteOffset: 11 * 4,
  },
};

/**
 * 粒子属性数组（按顺序排列）
 * 用于迭代所有属性
 */
export const PARTICLE_ATTRIBUTE_LIST: ParticleAttributeName[] = [
  'position',
  'velocity',
  'life',
  'size',
  'rotation',
  'rotationSpeed',
  'color',
];

/**
 * 计算单粒子的总字节大小
 * 所有属性的字节大小之和
 */
export function calculateParticleByteSize(): number {
  return PARTICLE_ATTRIBUTE_LIST.reduce(
    (total, attrName) => total + PARTICLE_ATTRIBUTES[attrName].byteSize,
    0
  );
}

/**
 * 计算单粒子的总 float 组件数
 */
export function calculateParticleComponentCount(): number {
  return PARTICLE_ATTRIBUTE_LIST.reduce(
    (total, attrName) => total + PARTICLE_ATTRIBUTES[attrName].componentCount,
    0
  );
}

/**
 * 计算指定数量粒子的总内存占用（字节）
 * @param particleCount 粒子数量
 * @param useDoubleBuffer 是否使用双缓冲（ping-pong）
 */
export function calculateTotalMemory(
  particleCount: number,
  useDoubleBuffer: boolean = false
): number {
  const perParticleSize = calculateParticleByteSize();
  const multiplier = useDoubleBuffer ? 2 : 1;
  return particleCount * perParticleSize * multiplier;
}

/**
 * 格式化字节数为可读字符串
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * 验证内存计算
 * 每粒子: 3+3+2+1+1+1+4 = 15 floats = 60 bytes
 */
export function validateMemoryCalculation(): {
  perParticleFloats: number;
  perParticleBytes: number;
  oneHundredThousandBytes: number;
  oneHundredThousandDoubleBufferBytes: number;
  isValid: boolean;
} {
  const perParticleFloats = calculateParticleComponentCount();
  const perParticleBytes = calculateParticleByteSize();
  const oneHundredThousandBytes = calculateTotalMemory(100000, false);
  const oneHundredThousandDoubleBufferBytes = calculateTotalMemory(100000, true);

  const isValid = 
    perParticleFloats === 15 &&
    perParticleBytes === 60 &&
    oneHundredThousandBytes === 6000000 &&
    oneHundredThousandDoubleBufferBytes === 12000000;

  return {
    perParticleFloats,
    perParticleBytes,
    oneHundredThousandBytes,
    oneHundredThousandDoubleBufferBytes,
    isValid,
  };
}
