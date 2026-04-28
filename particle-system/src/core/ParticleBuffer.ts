/**
 * 粒子缓冲区
 * 封装单个粒子属性的缓冲区管理
 * 支持创建、更新、绑定和双缓冲模式切换
 */

import { Buffer, BufferUsage } from './Buffer';
import { ParticleAttribute, ParticleAttributeName, PARTICLE_ATTRIBUTES } from './ParticleAttribute';

/**
 * 粒子缓冲区配置选项
 */
export interface ParticleBufferOptions {
  /** 最大粒子数量 */
  maxParticles: number;
  /** 属性名称 */
  attributeName: ParticleAttributeName;
  /** 缓冲区使用方式 */
  usage?: BufferUsage;
  /** 是否使用双缓冲模式 */
  useDoubleBuffer?: boolean;
}

/**
 * 粒子缓冲区类
 * 管理单个粒子属性的所有粒子数据
 * 采用"数组结构"模式，每个属性独立存储
 */
export class ParticleBuffer {
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private attribute: ParticleAttribute;
  private attributeName: ParticleAttributeName;
  private maxParticles: number;
  private usage: BufferUsage;

  /** 前端缓冲区（用于读取/渲染） */
  private frontBuffer: Buffer;
  /** 后端缓冲区（用于写入/更新） */
  private backBuffer: Buffer | null = null;
  /** 是否使用双缓冲模式 */
  private useDoubleBuffer: boolean;

  /** 数据数组（CPU 端缓存，可选） */
  private dataArray: Float32Array | null = null;

  constructor(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    options: ParticleBufferOptions
  ) {
    this.gl = gl;
    this.attributeName = options.attributeName;
    this.attribute = PARTICLE_ATTRIBUTES[options.attributeName];
    this.maxParticles = options.maxParticles;
    this.usage = options.usage || 'dynamic_copy';
    this.useDoubleBuffer = options.useDoubleBuffer || false;

    const totalByteSize = this.calculateTotalByteSize();

    this.frontBuffer = new Buffer(gl, 'array', this.usage);
    this.frontBuffer.bufferData(totalByteSize);

    if (this.useDoubleBuffer) {
      this.backBuffer = new Buffer(gl, 'array', this.usage);
      this.backBuffer.bufferData(totalByteSize);
    }
  }

  /**
   * 从数据创建粒子缓冲区
   */
  static fromData(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    attributeName: ParticleAttributeName,
    data: Float32Array,
    options: Omit<ParticleBufferOptions, 'attributeName' | 'maxParticles'> & { maxParticles?: number } = {}
  ): ParticleBuffer {
    const attribute = PARTICLE_ATTRIBUTES[attributeName];
    const componentCount = attribute.componentCount;
    const particleCount = data.length / componentCount;
    const maxParticles = options.maxParticles || Math.ceil(particleCount);

    const buffer = new ParticleBuffer(gl, {
      maxParticles,
      attributeName,
      usage: options.usage,
      useDoubleBuffer: options.useDoubleBuffer,
    });

    buffer.setData(data, 0);
    return buffer;
  }

  /**
   * 计算总字节大小
   */
  private calculateTotalByteSize(): number {
    return this.maxParticles * this.attribute.byteSize;
  }

  /**
   * 获取属性定义
   */
  getAttribute(): ParticleAttribute {
    return this.attribute;
  }

  /**
   * 获取属性名称
   */
  getAttributeName(): ParticleAttributeName {
    return this.attributeName;
  }

  /**
   * 获取着色器中的属性名称
   */
  getShaderAttributeName(): string {
    return this.attribute.name;
  }

  /**
   * 获取最大粒子数量
   */
  getMaxParticles(): number {
    return this.maxParticles;
  }

  /**
   * 获取是否使用双缓冲
   */
  isDoubleBuffered(): boolean {
    return this.useDoubleBuffer;
  }

  /**
   * 获取前端缓冲区（用于读取/渲染）
   */
  getFrontBuffer(): Buffer {
    return this.frontBuffer;
  }

  /**
   * 获取后端缓冲区（用于写入/更新）
   */
  getBackBuffer(): Buffer | null {
    return this.backBuffer;
  }

  /**
   * 获取当前输入缓冲区（用于 Transform Feedback 读取）
   * 在双缓冲模式下，前端缓冲区是输入
   */
  getInputBuffer(): Buffer {
    return this.frontBuffer;
  }

  /**
   * 获取当前输出缓冲区（用于 Transform Feedback 写入）
   * 在双缓冲模式下，后端缓冲区是输出；否则使用前端缓冲区
   */
  getOutputBuffer(): Buffer {
    return this.backBuffer || this.frontBuffer;
  }

  /**
   * 交换缓冲区（双缓冲模式下）
   * 前端和后端缓冲区互换
   */
  swap(): void {
    if (!this.useDoubleBuffer || !this.backBuffer) {
      return;
    }

    const temp = this.frontBuffer;
    this.frontBuffer = this.backBuffer;
    this.backBuffer = temp;
  }

  /**
   * 绑定前端缓冲区（用于渲染）
   */
  bind(): void {
    this.frontBuffer.bind();
  }

  /**
   * 解绑缓冲区
   */
  unbind(): void {
    this.frontBuffer.unbind();
  }

  /**
   * 设置顶点属性指针
   * 使用前端缓冲区的数据
   */
  vertexAttribPointer(
    index: number,
    normalized: boolean = false,
    stride: number = 0,
    offset: number = 0
  ): void {
    const gl = this.gl;
    const wasBound = this.frontBuffer.isBufferBound();

    if (!wasBound) {
      this.frontBuffer.bind();
    }

    const typeEnum = gl.FLOAT;
    gl.vertexAttribPointer(
      index,
      this.attribute.componentCount,
      typeEnum,
      normalized,
      stride,
      offset
    );

    if (!wasBound) {
      this.frontBuffer.unbind();
    }
  }

  /**
   * 设置数据到缓冲区
   * @param data 数据数组
   * @param offset 粒子偏移量（不是字节偏移）
   */
  setData(data: Float32Array, offset: number = 0): void {
    const byteOffset = offset * this.attribute.byteSize;
    this.frontBuffer.bufferSubData(byteOffset, data);
    if (this.useDoubleBuffer && this.backBuffer) {
      this.backBuffer.bufferSubData(byteOffset, data);
    }
  }

  /**
   * 设置单个粒子的数据
   * @param particleIndex 粒子索引
   * @param values 属性值数组（长度应等于 componentCount）
   */
  setParticle(particleIndex: number, values: number[]): void {
    if (values.length !== this.attribute.componentCount) {
      throw new Error(
        `属性 ${this.attributeName} 需要 ${this.attribute.componentCount} 个分量，实际提供 ${values.length} 个`
      );
    }

    const data = new Float32Array(values);
    this.setData(data, particleIndex);
  }

  /**
   * 获取 CPU 端数据数组（延迟创建）
   */
  getDataArray(): Float32Array {
    if (!this.dataArray) {
      const totalComponents = this.maxParticles * this.attribute.componentCount;
      this.dataArray = new Float32Array(totalComponents);
    }
    return this.dataArray;
  }

  /**
   * 将 CPU 端数据同步到 GPU
   */
  syncToGPU(): void {
    if (!this.dataArray) {
      return;
    }
    this.setData(this.dataArray, 0);
  }

  /**
   * 获取缓冲区字节大小
   */
  getByteLength(): number {
    return this.frontBuffer.getByteLength();
  }

  /**
   * 获取单个粒子的字节大小
   */
  getParticleByteSize(): number {
    return this.attribute.byteSize;
  }

  /**
   * 获取单个粒子的组件数量
   */
  getParticleComponentCount(): number {
    return this.attribute.componentCount;
  }

  /**
   * 删除缓冲区
   */
  delete(): void {
    this.frontBuffer.delete();
    if (this.backBuffer) {
      this.backBuffer.delete();
    }
    this.dataArray = null;
  }
}
