/**
 * 缓冲区类型
 */
export type BufferTarget = 'array' | 'element';

/**
 * 缓冲区使用方式
 */
export type BufferUsage = 
  | 'static_draw' 
  | 'dynamic_draw' 
  | 'stream_draw' 
  | 'static_read' 
  | 'dynamic_read' 
  | 'stream_read' 
  | 'static_copy' 
  | 'dynamic_copy' 
  | 'stream_copy';

/**
 * 缓冲区数据类型
 */
export type BufferDataType = 
  | 'byte' 
  | 'unsigned_byte' 
  | 'short' 
  | 'unsigned_short' 
  | 'int' 
  | 'unsigned_int' 
  | 'float' 
  | 'half_float';

/**
 * WebGL 缓冲区封装
 * 提供对 WebGLBuffer 的高级管理，支持 ARRAY_BUFFER 和 ELEMENT_ARRAY_BUFFER
 */
export class Buffer {
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private buffer: WebGLBuffer;
  private target: BufferTarget;
  private targetEnum: number;
  private usage: BufferUsage;
  private usageEnum: number;
  private byteLength: number = 0;
  private isBound: boolean = false;

  constructor(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    target: BufferTarget,
    usage: BufferUsage = 'static_draw'
  ) {
    this.gl = gl;
    this.target = target;
    this.usage = usage;
    this.targetEnum = this.getTargetEnum(target);
    this.usageEnum = this.getUsageEnum(usage);

    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error('无法创建缓冲区对象');
    }
    this.buffer = buffer;
  }

  /**
   * 从数据创建缓冲区
   */
  static fromData(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    target: BufferTarget,
    data: ArrayBufferView,
    usage: BufferUsage = 'static_draw'
  ): Buffer {
    const buffer = new Buffer(gl, target, usage);
    buffer.bufferData(data);
    return buffer;
  }

  /**
   * 创建顶点缓冲区 (ARRAY_BUFFER)
   */
  static createVertexBuffer(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    usage: BufferUsage = 'static_draw'
  ): Buffer {
    return new Buffer(gl, 'array', usage);
  }

  /**
   * 创建索引缓冲区 (ELEMENT_ARRAY_BUFFER)
   */
  static createIndexBuffer(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    usage: BufferUsage = 'static_draw'
  ): Buffer {
    return new Buffer(gl, 'element', usage);
  }

  /**
   * 将 BufferTarget 转换为 WebGL 枚举值
   */
  private getTargetEnum(target: BufferTarget): number {
    const gl = this.gl;
    switch (target) {
      case 'array':
        return gl.ARRAY_BUFFER;
      case 'element':
        return gl.ELEMENT_ARRAY_BUFFER;
      default:
        throw new Error(`未知的缓冲区目标: ${target}`);
    }
  }

  /**
   * 将 BufferUsage 转换为 WebGL 枚举值
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
        return (gl as WebGL2RenderingContext).STATIC_READ || gl.STATIC_DRAW;
      case 'dynamic_read':
        return (gl as WebGL2RenderingContext).DYNAMIC_READ || gl.DYNAMIC_DRAW;
      case 'stream_read':
        return (gl as WebGL2RenderingContext).STREAM_READ || gl.STREAM_DRAW;
      case 'static_copy':
        return (gl as WebGL2RenderingContext).STATIC_COPY || gl.STATIC_DRAW;
      case 'dynamic_copy':
        return (gl as WebGL2RenderingContext).DYNAMIC_COPY || gl.DYNAMIC_DRAW;
      case 'stream_copy':
        return (gl as WebGL2RenderingContext).STREAM_COPY || gl.STREAM_DRAW;
      default:
        return gl.STATIC_DRAW;
    }
  }

  /**
   * 绑定缓冲区
   */
  bind(): void {
    this.gl.bindBuffer(this.targetEnum, this.buffer);
    this.isBound = true;
  }

  /**
   * 解绑缓冲区
   */
  unbind(): void {
    this.gl.bindBuffer(this.targetEnum, null);
    this.isBound = false;
  }

  /**
   * 检查缓冲区是否已绑定
   */
  isBufferBound(): boolean {
    return this.isBound;
  }

  /**
   * 上传数据到缓冲区
   * 这会重新分配缓冲区存储
   */
  bufferData(data: ArrayBufferView | number): void {
    const wasBound = this.isBound;
    if (!wasBound) {
      this.bind();
    }

    if (typeof data === 'number') {
      this.gl.bufferData(this.targetEnum, data, this.usageEnum);
      this.byteLength = data;
    } else {
      this.gl.bufferData(this.targetEnum, data, this.usageEnum);
      this.byteLength = data.byteLength;
    }

    if (!wasBound) {
      this.unbind();
    }
  }

  /**
   * 部分更新缓冲区数据
   * 不会重新分配存储
   */
  bufferSubData(offset: number, data: ArrayBufferView): void {
    const wasBound = this.isBound;
    if (!wasBound) {
      this.bind();
    }

    this.gl.bufferSubData(this.targetEnum, offset, data);

    if (!wasBound) {
      this.unbind();
    }
  }

  /**
   * 设置顶点属性指针
   * 仅适用于 ARRAY_BUFFER 类型的缓冲区
   */
  vertexAttribPointer(
    index: number,
    size: number,
    type: BufferDataType,
    normalized: boolean,
    stride: number,
    offset: number
  ): void {
    if (this.target !== 'array') {
      throw new Error('vertexAttribPointer 仅适用于 ARRAY_BUFFER 类型的缓冲区');
    }

    const wasBound = this.isBound;
    if (!wasBound) {
      this.bind();
    }

    const gl = this.gl;
    const typeEnum = this.getDataTypeEnum(type);
    gl.vertexAttribPointer(index, size, typeEnum, normalized, stride, offset);

    if (!wasBound) {
      this.unbind();
    }
  }

  /**
   * 将 BufferDataType 转换为 WebGL 枚举值
   */
  private getDataTypeEnum(type: BufferDataType): number {
    const gl = this.gl;
    const gl2 = gl as WebGL2RenderingContext;
    
    switch (type) {
      case 'byte':
        return gl.BYTE;
      case 'unsigned_byte':
        return gl.UNSIGNED_BYTE;
      case 'short':
        return gl.SHORT;
      case 'unsigned_short':
        return gl.UNSIGNED_SHORT;
      case 'int':
        return gl.INT;
      case 'unsigned_int':
        return gl.UNSIGNED_INT;
      case 'float':
        return gl.FLOAT;
      case 'half_float':
        return gl2.HALF_FLOAT || gl.FLOAT;
      default:
        return gl.FLOAT;
    }
  }

  /**
   * 获取缓冲区目标类型
   */
  getTarget(): BufferTarget {
    return this.target;
  }

  /**
   * 获取缓冲区使用方式
   */
  getUsage(): BufferUsage {
    return this.usage;
  }

  /**
   * 获取缓冲区字节大小
   */
  getByteLength(): number {
    return this.byteLength;
  }

  /**
   * 获取原始 WebGLBuffer 对象
   */
  getBuffer(): WebGLBuffer {
    return this.buffer;
  }

  /**
   * 删除缓冲区
   */
  delete(): void {
    if (this.buffer) {
      this.gl.deleteBuffer(this.buffer);
    }
    this.byteLength = 0;
    this.isBound = false;
  }
}
