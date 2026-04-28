/**
 * 粒子系统缓冲区
 * 管理所有粒子属性缓冲区
 * 采用"数组结构" (Structure of Arrays) 模式
 * 每个属性一个独立的缓冲区，获得更好的 GPU 缓存性能
 */

import { ParticleBuffer, ParticleBufferOptions } from './ParticleBuffer';
import {
  ParticleAttributeName,
  PARTICLE_ATTRIBUTE_LIST,
  formatBytes,
} from './ParticleAttribute';

/**
 * 粒子系统缓冲区配置选项
 */
export interface ParticleSystemBufferOptions {
  /** 最大粒子数量 */
  maxParticles: number;
  /** 是否使用双缓冲模式（用于 Transform Feedback） */
  useDoubleBuffer?: boolean;
  /** 缓冲区使用方式 */
  usage?: 'static_draw' | 'dynamic_draw' | 'stream_draw' | 'dynamic_copy';
  /** 要包含的属性列表（默认包含所有属性） */
  attributes?: ParticleAttributeName[];
}

/**
 * 粒子缓冲区映射类型
 */
export type ParticleBufferMap = Record<ParticleAttributeName, ParticleBuffer>;

/**
 * 粒子系统缓冲区类
 * 管理所有粒子属性缓冲区
 * 采用 SoA (Structure of Arrays) 布局
 */
export class ParticleSystemBuffer {
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private maxParticles: number;
  private useDoubleBuffer: boolean;
  private usage: 'static_draw' | 'dynamic_draw' | 'stream_draw' | 'dynamic_copy';

  /** 所有粒子属性缓冲区 */
  private buffers: ParticleBufferMap;

  /** 实际使用的属性列表 */
  private activeAttributes: ParticleAttributeName[];

  constructor(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    options: ParticleSystemBufferOptions
  ) {
    this.gl = gl;
    this.maxParticles = options.maxParticles;
    this.useDoubleBuffer = options.useDoubleBuffer || false;
    this.usage = options.usage || 'dynamic_copy';
    this.activeAttributes = options.attributes || [...PARTICLE_ATTRIBUTE_LIST];

    this.buffers = this.createBuffers();
  }

  /**
   * 创建所有属性缓冲区
   */
  private createBuffers(): ParticleBufferMap {
    const buffers: Partial<ParticleBufferMap> = {};

    for (const attrName of this.activeAttributes) {
      const options: ParticleBufferOptions = {
        maxParticles: this.maxParticles,
        attributeName: attrName,
        usage: this.usage,
        useDoubleBuffer: this.useDoubleBuffer,
      };

      buffers[attrName] = new ParticleBuffer(this.gl, options);
    }

    return buffers as ParticleBufferMap;
  }

  /**
   * 获取指定属性的缓冲区
   */
  getBuffer(attrName: ParticleAttributeName): ParticleBuffer | undefined {
    return this.buffers[attrName];
  }

  /**
   * 获取所有缓冲区
   */
  getBuffers(): ParticleBufferMap {
    return { ...this.buffers };
  }

  /**
   * 获取活跃属性列表
   */
  getActiveAttributes(): ParticleAttributeName[] {
    return [...this.activeAttributes];
  }

  /**
   * 获取最大粒子数量
   */
  getMaxParticles(): number {
    return this.maxParticles;
  }

  /**
   * 是否使用双缓冲
   */
  isDoubleBuffered(): boolean {
    return this.useDoubleBuffer;
  }

  /**
   * 计算单粒子字节大小
   */
  getParticleByteSize(): number {
    return this.activeAttributes.reduce(
      (total, attrName) => total + this.buffers[attrName].getParticleByteSize(),
      0
    );
  }

  /**
   * 计算总内存占用
   * @param includeDoubleBuffer 是否包含双缓冲
   */
  getTotalMemory(includeDoubleBuffer: boolean = true): number {
    const perParticleSize = this.getParticleByteSize();
    const multiplier = includeDoubleBuffer && this.useDoubleBuffer ? 2 : 1;
    return this.maxParticles * perParticleSize * multiplier;
  }

  /**
   * 获取格式化的内存字符串
   */
  getFormattedMemory(includeDoubleBuffer: boolean = true): string {
    return formatBytes(this.getTotalMemory(includeDoubleBuffer));
  }

  /**
   * 交换所有缓冲区（双缓冲模式下）
   */
  swap(): void {
    if (!this.useDoubleBuffer) {
      return;
    }

    for (const attrName of this.activeAttributes) {
      this.buffers[attrName].swap();
    }
  }

  /**
   * 绑定所有前端缓冲区（用于渲染）
   */
  bindAll(): void {
    for (const attrName of this.activeAttributes) {
      this.buffers[attrName].bind();
    }
  }

  /**
   * 解绑所有缓冲区
   */
  unbindAll(): void {
    for (const attrName of this.activeAttributes) {
      this.buffers[attrName].unbind();
    }
  }

  /**
   * 获取所有输入缓冲区（前端/读取）
   * 用于 Transform Feedback 的输入阶段
   */
  getInputBuffers(): Record<ParticleAttributeName, ParticleBuffer> {
    const buffers: Partial<Record<ParticleAttributeName, ParticleBuffer>> = {};

    for (const attrName of this.activeAttributes) {
      buffers[attrName] = this.buffers[attrName];
    }

    return buffers as Record<ParticleAttributeName, ParticleBuffer>;
  }

  /**
   * 获取所有输出缓冲区（后端/写入）
   * 用于 Transform Feedback 的输出阶段
   * 在单缓冲模式下，返回与输入相同的缓冲区
   */
  getOutputBuffers(): Record<ParticleAttributeName, ParticleBuffer> {
    return this.getInputBuffers();
  }

  /**
   * 获取着色器属性名称列表
   * 用于设置 Transform Feedback 的 varyings
   */
  getShaderAttributeNames(): string[] {
    return this.activeAttributes.map(
      (attrName) => this.buffers[attrName].getShaderAttributeName()
    );
  }

  /**
   * 设置单个粒子的数据
   * @param particleIndex 粒子索引
   * @param data 粒子数据对象
   */
  setParticle(
    particleIndex: number,
    data: Partial<Record<ParticleAttributeName, number[]>>
  ): void {
    for (const attrName of this.activeAttributes) {
      const attrData = data[attrName];
      if (attrData) {
        this.buffers[attrName].setParticle(particleIndex, attrData);
      }
    }
  }

  /**
   * 批量设置多个粒子的数据
   * @param startIndex 起始粒子索引
   * @param dataMap 每个属性的数据数组
   */
  setParticles(
    startIndex: number,
    dataMap: Partial<Record<ParticleAttributeName, Float32Array>>
  ): void {
    for (const attrName of this.activeAttributes) {
      const data = dataMap[attrName];
      if (data) {
        this.buffers[attrName].setData(data, startIndex);
      }
    }
  }

  /**
   * 重置所有缓冲区为零
   */
  clear(): void {
    const zeroData = new Float32Array(1024).fill(0);

    for (const attrName of this.activeAttributes) {
      const buffer = this.buffers[attrName];
      const componentCount = buffer.getParticleComponentCount();
      const totalComponents = this.maxParticles * componentCount;

      let offset = 0;
      while (offset < totalComponents) {
        const chunkSize = Math.min(zeroData.length, totalComponents - offset);
        const chunk = zeroData.subarray(0, chunkSize);
        buffer.setData(chunk, offset / componentCount);
        offset += chunkSize;
      }
    }
  }

  /**
   * 获取内存统计信息
   */
  getMemoryStats(): {
    maxParticles: number;
    perParticleBytes: number;
    perParticleFloats: number;
    totalBytes: number;
    totalBytesDoubleBuffered: number;
    totalMB: string;
    totalMBDoubleBuffered: string;
    attributes: Array<{
      name: ParticleAttributeName;
      shaderName: string;
      componentCount: number;
      byteSize: number;
    }>;
  } {
    const perParticleBytes = this.getParticleByteSize();
    const perParticleFloats = perParticleBytes / 4;
    const totalBytes = this.getTotalMemory(false);
    const totalBytesDoubleBuffered = this.getTotalMemory(true);

    const attributes = this.activeAttributes.map((attrName) => {
      const buffer = this.buffers[attrName];
      return {
        name: attrName,
        shaderName: buffer.getShaderAttributeName(),
        componentCount: buffer.getParticleComponentCount(),
        byteSize: buffer.getParticleByteSize(),
      };
    });

    return {
      maxParticles: this.maxParticles,
      perParticleBytes,
      perParticleFloats,
      totalBytes,
      totalBytesDoubleBuffered,
      totalMB: formatBytes(totalBytes),
      totalMBDoubleBuffered: formatBytes(totalBytesDoubleBuffered),
      attributes,
    };
  }

  /**
   * 删除所有缓冲区
   */
  delete(): void {
    for (const attrName of this.activeAttributes) {
      this.buffers[attrName].delete();
    }
  }
}
