/**
 * 双缓冲机制 (Ping-Pong Buffer)
 * 实现 Transform Feedback 所需的 ping-pong 缓冲
 * 包含两个缓冲区，支持在每次更新后交换
 */

import { Buffer, BufferUsage } from './Buffer';

/**
 * 双缓冲配置选项
 */
export interface PingPongBufferOptions {
  /** 缓冲区字节大小 */
  byteSize: number;
  /** 缓冲区目标类型 */
  target?: 'array' | 'transform_feedback';
  /** 缓冲区使用方式 */
  usage?: BufferUsage;
  /** 是否预分配数据 */
  preallocate?: boolean;
}

/**
 * 双缓冲类
 * 用于 Transform Feedback 的 ping-pong 模式
 * 当前输入缓冲区作为下一帧的输出，反之亦然
 */
export class PingPongBuffer {
  private gl: WebGL2RenderingContext;
  private byteSize: number;
  private target: number;
  private usage: number;

  /** 缓冲区 A */
  private bufferA: Buffer;
  /** 缓冲区 B */
  private bufferB: Buffer;

  /** 当前读取缓冲区索引 (0 = A, 1 = B) */
  private readIndex: 0 | 1 = 0;

  constructor(gl: WebGL2RenderingContext, options: PingPongBufferOptions) {
    this.gl = gl;
    this.byteSize = options.byteSize;
    this.target = this.getTargetEnum(options.target || 'array');
    this.usage = this.getUsageEnum(options.usage || 'dynamic_copy');

    this.bufferA = this.createBuffer();
    this.bufferB = this.createBuffer();

    if (options.preallocate !== false) {
      this.bufferA.bufferData(this.byteSize);
      this.bufferB.bufferData(this.byteSize);
    }
  }

  /**
   * 从数据创建双缓冲
   */
  static fromData(
    gl: WebGL2RenderingContext,
    data: ArrayBufferView,
    options: Omit<PingPongBufferOptions, 'byteSize'> = {}
  ): PingPongBuffer {
    const buffer = new PingPongBuffer(gl, {
      byteSize: data.byteLength,
      target: options.target,
      usage: options.usage,
      preallocate: false,
    });

    buffer.bufferA.bufferData(data);
    buffer.bufferB.bufferData(data);

    return buffer;
  }

  /**
   * 创建 WebGL 缓冲区
   */
  private createBuffer(): Buffer {
    const buffer = new Buffer(this.gl, 'array', this.convertUsageToString(this.usage));
    return buffer;
  }

  /**
   * 转换目标类型为 WebGL 枚举
   */
  private getTargetEnum(target: 'array' | 'transform_feedback'): number {
    const gl = this.gl;
    switch (target) {
      case 'array':
        return gl.ARRAY_BUFFER;
      case 'transform_feedback':
        return gl.TRANSFORM_FEEDBACK_BUFFER;
      default:
        return gl.ARRAY_BUFFER;
    }
  }

  /**
   * 转换使用方式为 WebGL 枚举
   */
  private getUsageEnum(usage: BufferUsage): number {
    const gl = this.gl;
    switch (usage) {
      case 'static_draw':
        return gl.STATIC_DRAW;
      case 'dynamic_draw':
        return gl.DYNAMIC_DRAW;
      case 'stream_draw':
        return gl.STREAM_DRAW;
      case 'static_read':
        return gl.STATIC_READ;
      case 'dynamic_read':
        return gl.DYNAMIC_READ;
      case 'stream_read':
        return gl.STREAM_READ;
      case 'static_copy':
        return gl.STATIC_COPY;
      case 'dynamic_copy':
        return gl.DYNAMIC_COPY;
      case 'stream_copy':
        return gl.STREAM_COPY;
      default:
        return gl.DYNAMIC_COPY;
    }
  }

  /**
   * 将 usage 枚举转换为字符串
   */
  private convertUsageToString(usage: number): BufferUsage {
    const gl = this.gl;
    switch (usage) {
      case gl.STATIC_DRAW:
        return 'static_draw';
      case gl.DYNAMIC_DRAW:
        return 'dynamic_draw';
      case gl.STREAM_DRAW:
        return 'stream_draw';
      case gl.STATIC_READ:
        return 'static_read';
      case gl.DYNAMIC_READ:
        return 'dynamic_read';
      case gl.STREAM_READ:
        return 'stream_read';
      case gl.STATIC_COPY:
        return 'static_copy';
      case gl.DYNAMIC_COPY:
        return 'dynamic_copy';
      case gl.STREAM_COPY:
        return 'stream_copy';
      default:
        return 'dynamic_copy';
    }
  }

  /**
   * 获取当前读取缓冲区（输入）
   * 用于着色器读取（顶点着色器输入）
   */
  getReadBuffer(): Buffer {
    return this.readIndex === 0 ? this.bufferA : this.bufferB;
  }

  /**
   * 获取当前写入缓冲区（输出）
   * 用于 Transform Feedback 写入
   */
  getWriteBuffer(): Buffer {
    return this.readIndex === 0 ? this.bufferB : this.bufferA;
  }

  /**
   * 获取当前输入缓冲区
   * 别名方法，与 getReadBuffer 相同
   */
  getInputBuffer(): Buffer {
    return this.getReadBuffer();
  }

  /**
   * 获取当前输出缓冲区
   * 别名方法，与 getWriteBuffer 相同
   */
  getOutputBuffer(): Buffer {
    return this.getWriteBuffer();
  }

  /**
   * 交换缓冲区
   * 每次更新后调用，读取和写入缓冲区互换
   */
  swap(): void {
    this.readIndex = this.readIndex === 0 ? 1 : 0;
  }

  /**
   * 绑定读取缓冲区
   */
  bindReadBuffer(): void {
    this.getReadBuffer().bind();
  }

  /**
   * 绑定写入缓冲区
   */
  bindWriteBuffer(): void {
    this.getWriteBuffer().bind();
  }

  /**
   * 解绑缓冲区
   */
  unbind(): void {
    this.gl.bindBuffer(this.target, null);
  }

  /**
   * 设置数据到两个缓冲区
   * 初始化时使用
   */
  setData(data: ArrayBufferView): void {
    this.bufferA.bufferData(data);
    this.bufferB.bufferData(data);
  }

  /**
   * 更新部分数据
   * @param offset 字节偏移
   * @param data 数据
   * @param target 目标缓冲区：'read' | 'write' | 'both'
   */
  updateData(
    offset: number,
    data: ArrayBufferView,
    target: 'read' | 'write' | 'both' = 'read'
  ): void {
    if (target === 'read' || target === 'both') {
      this.getReadBuffer().bufferSubData(offset, data);
    }
    if (target === 'write' || target === 'both') {
      this.getWriteBuffer().bufferSubData(offset, data);
    }
  }

  /**
   * 获取缓冲区字节大小
   */
  getByteSize(): number {
    return this.byteSize;
  }

  /**
   * 获取当前读取索引
   * 0 = A, 1 = B
   */
  getReadIndex(): number {
    return this.readIndex;
  }

  /**
   * 重置读取索引为 0
   */
  reset(): void {
    this.readIndex = 0;
  }

  /**
   * 绑定 Transform Feedback 缓冲区
   * 仅适用于 WebGL 2.0
   */
  bindTransformFeedback(index: number = 0): void {
    const gl = this.gl;
    const writeBuffer = this.getWriteBuffer();
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, index, writeBuffer.getBuffer());
  }

  /**
   * 解绑 Transform Feedback 缓冲区
   */
  unbindTransformFeedback(index: number = 0): void {
    const gl = this.gl;
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, index, null);
  }

  /**
   * 删除两个缓冲区
   */
  delete(): void {
    this.bufferA.delete();
    this.bufferB.delete();
  }
}
