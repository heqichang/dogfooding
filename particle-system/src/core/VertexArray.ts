import { Buffer } from './Buffer';

/**
 * 顶点属性配置
 */
export interface VertexAttribute {
  /** 属姓名或位置 */
  nameOrIndex: string | number;
  /** 每个顶点的数据个数（1-4） */
  size: number;
  /** 数据类型 */
  type: 'byte' | 'unsigned_byte' | 'short' | 'unsigned_short' | 'int' | 'unsigned_int' | 'float' | 'half_float';
  /** 是否归一化 */
  normalized: boolean;
  /** 两个顶点之间的字节偏移量（0 表示紧凑排列） */
  stride: number;
  /** 从缓冲区起始位置的字节偏移量 */
  offset: number;
  /** 包含数据的缓冲区 */
  buffer: Buffer;
  /** 是否是整数属性（仅 WebGL 2.0） */
  integer?: boolean;
}

/**
 * 索引缓冲区配置
 */
export interface IndexBufferConfig {
  /** 索引缓冲区 */
  buffer: Buffer;
  /** 索引类型 */
  type: 'unsigned_byte' | 'unsigned_short' | 'unsigned_int';
}

/**
 * VAO（顶点数组对象）管理器
 * 
 * 注意：VAO 是 WebGL 2.0 的特性。在 WebGL 1.0 中，
 * 需要 OES_vertex_array_object 扩展支持。
 * 如果不支持 VAO，此类会降级为手动管理状态。
 */
export class VertexArray {
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  private isSupported: boolean = false;
  private isBound: boolean = false;
  private attributes: Map<string | number, VertexAttribute> = new Map();
  private indexBuffer: IndexBufferConfig | null = null;
  private vaoExt: OES_vertex_array_object | null = null;

  constructor(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    this.gl = gl;
    this.initVAO();
  }

  /**
   * 初始化 VAO 支持
   */
  private initVAO(): void {
    const gl = this.gl;

    // 尝试 WebGL 2.0 VAO
    if ((gl as WebGL2RenderingContext).createVertexArray) {
      this.vao = (gl as WebGL2RenderingContext).createVertexArray();
      this.isSupported = this.vao !== null;
      return;
    }

    // 尝试 WebGL 1.0 扩展
    this.vaoExt = gl.getExtension('OES_vertex_array_object');
    if (this.vaoExt) {
      this.vao = this.vaoExt.createVertexArrayOES();
      this.isSupported = this.vao !== null;
      return;
    }

    // VAO 不支持，将使用降级模式
    this.isSupported = false;
    console.warn('VAO 不受支持，将使用手动状态管理');
  }

  /**
   * 检查 VAO 是否受支持
   */
  isVAOSupported(): boolean {
    return this.isSupported;
  }

  /**
   * 绑定 VAO
   */
  bind(): void {
    if (this.isSupported && this.vao) {
      const gl = this.gl;
      if (this.vaoExt) {
        this.vaoExt.bindVertexArrayOES(this.vao);
      } else {
        (gl as WebGL2RenderingContext).bindVertexArray(this.vao);
      }
      this.isBound = true;
    } else {
      // 降级模式：手动绑定所有属性
      this.bindAttributesManually();
      this.isBound = true;
    }
  }

  /**
   * 解绑 VAO
   */
  unbind(): void {
    if (this.isSupported) {
      const gl = this.gl;
      if (this.vaoExt) {
        this.vaoExt.bindVertexArrayOES(null);
      } else {
        (gl as WebGL2RenderingContext).bindVertexArray(null);
      }
    } else {
      // 降级模式：解绑所有属性
      this.unbindAttributesManually();
    }
    this.isBound = false;
  }

  /**
   * 检查 VAO 是否已绑定
   */
  isVAOBound(): boolean {
    return this.isBound;
  }

  /**
   * 添加顶点属性配置
   * 
   * 如果 VAO 已支持且当前已绑定，配置将立即应用到 VAO。
   * 否则，配置将被保存并在绑定时应用。
   */
  addAttribute(attr: VertexAttribute): void {
    this.attributes.set(attr.nameOrIndex, attr);

    // 如果 VAO 已支持且当前已绑定，立即应用配置
    if (this.isSupported && this.isBound) {
      this.applyAttribute(attr);
    }
  }

  /**
   * 批量添加多个顶点属性
   */
  addAttributes(attrs: VertexAttribute[]): void {
    attrs.forEach(attr => this.addAttribute(attr));
  }

  /**
   * 设置索引缓冲区
   */
  setIndexBuffer(buffer: Buffer, type: 'unsigned_byte' | 'unsigned_short' | 'unsigned_int'): void {
    if (buffer.getTarget() !== 'element') {
      throw new Error('索引缓冲区必须是 ELEMENT_ARRAY_BUFFER 类型');
    }

    this.indexBuffer = { buffer, type };

    // 如果 VAO 已支持且当前已绑定，立即绑定索引缓冲区
    if (this.isSupported && this.isBound) {
      buffer.bind();
    }
  }

  /**
   * 获取索引缓冲区配置
   */
  getIndexBuffer(): IndexBufferConfig | null {
    return this.indexBuffer;
  }

  /**
   * 获取所有顶点属性
   */
  getAttributes(): VertexAttribute[] {
    return Array.from(this.attributes.values());
  }

  /**
   * 应用单个顶点属性配置
   */
  private applyAttribute(attr: VertexAttribute): void {
    const gl = this.gl;
    const gl2 = gl as WebGL2RenderingContext;

    // 绑定缓冲区
    attr.buffer.bind();

    // 获取属性位置
    let location: number;
    if (typeof attr.nameOrIndex === 'number') {
      location = attr.nameOrIndex;
    } else {
      location = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram, attr.nameOrIndex);
      if (location < 0) {
        console.warn(`属性 "${attr.nameOrIndex}" 在当前着色器程序中未找到或未使用`);
        return;
      }
    }

    // 启用属性数组
    gl.enableVertexAttribArray(location);

    // 转换类型枚举
    const typeEnum = this.getTypeEnum(attr.type);

    // 设置顶点属性指针
    if (attr.integer && gl2.vertexAttribIPointer) {
      // 整数属性（WebGL 2.0）
      gl2.vertexAttribIPointer(location, attr.size, typeEnum, attr.stride, attr.offset);
    } else {
      // 常规属性
      gl.vertexAttribPointer(location, attr.size, typeEnum, attr.normalized, attr.stride, attr.offset);
    }
  }

  /**
   * 将数据类型转换为 WebGL 枚举值
   */
  private getTypeEnum(type: string): number {
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
   * 降级模式：手动绑定所有属性
   */
  private bindAttributesManually(): void {
    // 绑定所有顶点属性
    this.attributes.forEach(attr => {
      this.applyAttribute(attr);
    });

    // 绑定索引缓冲区（如果有）
    if (this.indexBuffer) {
      this.indexBuffer.buffer.bind();
    }
  }

  /**
   * 降级模式：手动解绑所有属性
   */
  private unbindAttributesManually(): void {
    const gl = this.gl;

    // 禁用所有属性数组
    this.attributes.forEach((_attr, key) => {
      let location: number;
      if (typeof key === 'number') {
        location = key;
      } else {
        location = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram, key);
      }
      if (location >= 0) {
        gl.disableVertexAttribArray(location);
      }
    });

    // 解绑缓冲区
    this.attributes.forEach(attr => {
      attr.buffer.unbind();
    });

    if (this.indexBuffer) {
      this.indexBuffer.buffer.unbind();
    }
  }

  /**
   * 删除 VAO
   */
  delete(): void {
    if (this.vao) {
      const gl = this.gl;
      if (this.vaoExt) {
        this.vaoExt.deleteVertexArrayOES(this.vao);
      } else if ((gl as WebGL2RenderingContext).deleteVertexArray) {
        (gl as WebGL2RenderingContext).deleteVertexArray(this.vao);
      }
      this.vao = null;
    }
    this.attributes.clear();
    this.indexBuffer = null;
    this.isBound = false;
  }
}
