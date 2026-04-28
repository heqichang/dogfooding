import { Shader } from './Shader';

/**
 * 统一变量信息
 */
interface UniformInfo {
  location: WebGLUniformLocation;
  type: number;
}

/**
 * 属性变量信息
 */
interface AttributeInfo {
  location: number;
  type: number;
}

/**
 * 着色器程序
 * 负责链接着色器，并提供统一的 Uniform 和 Attribute 管理接口
 */
export class ShaderProgram {
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private program: WebGLProgram;
  private linked: boolean = false;
  private linkError: string = '';
  
  // 缓存位置信息以提高性能
  private uniformCache: Map<string, UniformInfo> = new Map();
  private attributeCache: Map<string, AttributeInfo> = new Map();

  constructor(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    vertexShader: Shader,
    fragmentShader: Shader
  ) {
    this.gl = gl;
    this.program = this.createProgram();
    this.attachAndLink(vertexShader, fragmentShader);
  }

  /**
   * 从着色器源字符串创建着色器程序
   */
  static fromSources(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string
  ): ShaderProgram {
    const vertexShader = new Shader(gl, 'vertex', vertexSource);
    const fragmentShader = new Shader(gl, 'fragment', fragmentSource);
    
    if (!vertexShader.isCompiled()) {
      throw new Error(`顶点着色器编译失败: ${vertexShader.getErrors().map(e => e.message).join('; ')}`);
    }
    
    if (!fragmentShader.isCompiled()) {
      throw new Error(`片段着色器编译失败: ${fragmentShader.getErrors().map(e => e.message).join('; ')}`);
    }
    
    return new ShaderProgram(gl, vertexShader, fragmentShader);
  }

  /**
   * 创建带有 Transform Feedback 配置的着色器程序
   * 仅适用于 WebGL 2.0
   * 
   * @param gl WebGL 2.0 上下文
   * @param vertexShader 顶点着色器
   * @param fragmentShader 片段着色器（可选，对于纯更新程序可以为空）
   * @param varyings 要捕获的 varying 变量名称数组
   * @param bufferMode 缓冲区模式：'interleaved' 或 'separate'
   */
  static createWithTransformFeedback(
    gl: WebGL2RenderingContext,
    vertexShader: Shader,
    fragmentShader: Shader | null,
    varyings: string[],
    bufferMode: 'interleaved' | 'separate' = 'separate'
  ): ShaderProgram {
    if (!vertexShader.isCompiled()) {
      throw new Error(`顶点着色器编译失败: ${vertexShader.getErrors().map(e => e.message).join('; ')}`);
    }

    if (fragmentShader && !fragmentShader.isCompiled()) {
      throw new Error(`片段着色器编译失败: ${fragmentShader.getErrors().map(e => e.message).join('; ')}`);
    }

    const emptyFragmentShaderSource = `#version 300 es
precision highp float;
void main() {
}`;

    const actualFragmentShader = fragmentShader || new Shader(gl, 'fragment', emptyFragmentShaderSource);

    if (!actualFragmentShader.isCompiled()) {
      throw new Error(`片段着色器编译失败: ${actualFragmentShader.getErrors().map(e => e.message).join('; ')}`);
    }

    const program = gl.createProgram();
    if (!program) {
      throw new Error('无法创建着色器程序');
    }

    gl.attachShader(program, vertexShader.getShader());
    gl.attachShader(program, actualFragmentShader.getShader());

    const glBufferMode = bufferMode === 'interleaved' 
      ? gl.INTERLEAVED_ATTRIBS 
      : gl.SEPARATE_ATTRIBS;
    
    gl.transformFeedbackVaryings(program, varyings, glBufferMode);

    gl.linkProgram(program);

    const linked = gl.getProgramParameter(program, gl.LINK_STATUS) as boolean;
    
    if (!linked) {
      const linkError = gl.getProgramInfoLog(program) || '';
      console.error('着色器程序链接失败:', linkError);
      throw new Error(`着色器程序链接失败: ${linkError}`);
    }

    const shaderProgram = new ShaderProgram(
      gl,
      vertexShader,
      actualFragmentShader
    );
    
    return shaderProgram;
  }

  /**
   * 从源字符串创建带有 Transform Feedback 配置的着色器程序
   */
  static fromSourcesWithTransformFeedback(
    gl: WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string | null,
    varyings: string[],
    bufferMode: 'interleaved' | 'separate' = 'separate'
  ): ShaderProgram {
    const vertexShader = new Shader(gl, 'vertex', vertexSource);
    
    let fragmentShader: Shader | null = null;
    if (fragmentSource) {
      fragmentShader = new Shader(gl, 'fragment', fragmentSource);
    }

    return ShaderProgram.createWithTransformFeedback(
      gl,
      vertexShader,
      fragmentShader,
      varyings,
      bufferMode
    );
  }

  /**
   * 创建着色器程序对象
   */
  private createProgram(): WebGLProgram {
    const program = this.gl.createProgram();
    if (!program) {
      throw new Error('无法创建着色器程序');
    }
    return program;
  }

  /**
   * 附加着色器并链接程序
   */
  private attachAndLink(vertexShader: Shader, fragmentShader: Shader): void {
    const gl = this.gl;
    
    gl.attachShader(this.program, vertexShader.getShader());
    gl.attachShader(this.program, fragmentShader.getShader());
    
    gl.linkProgram(this.program);
    
    this.linked = gl.getProgramParameter(this.program, gl.LINK_STATUS) as boolean;
    
    if (!this.linked) {
      this.linkError = gl.getProgramInfoLog(this.program) || '';
      console.error('着色器程序链接失败:', this.linkError);
    } else {
      this.cacheActiveUniforms();
      this.cacheActiveAttributes();
    }
  }

  /**
   * 缓存所有活动的 Uniform 变量
   */
  private cacheActiveUniforms(): void {
    const gl = this.gl;
    const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS) as number;
    
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(this.program, i);
      if (info) {
        const location = gl.getUniformLocation(this.program, info.name);
        if (location) {
          this.uniformCache.set(info.name, {
            location,
            type: info.type
          });
        }
      }
    }
  }

  /**
   * 缓存所有活动的 Attribute 变量
   */
  private cacheActiveAttributes(): void {
    const gl = this.gl;
    const numAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES) as number;
    
    for (let i = 0; i < numAttributes; i++) {
      const info = gl.getActiveAttrib(this.program, i);
      if (info) {
        const location = gl.getAttribLocation(this.program, info.name);
        this.attributeCache.set(info.name, {
          location,
          type: info.type
        });
      }
    }
  }

  /**
   * 验证程序是否链接成功
   * @throws 如果程序未链接
   */
  private ensureLinked(): void {
    if (!this.linked) {
      throw new Error(`着色器程序未链接: ${this.linkError}`);
    }
  }

  /**
   * 使用此着色器程序
   */
  use(): void {
    this.ensureLinked();
    this.gl.useProgram(this.program);
  }

  /**
   * 取消使用此着色器程序
   */
  unuse(): void {
    this.gl.useProgram(null);
  }

  /**
   * 获取原始 WebGLProgram 对象
   */
  getProgram(): WebGLProgram {
    this.ensureLinked();
    return this.program;
  }

  /**
   * 检查是否链接成功
   */
  isLinked(): boolean {
    return this.linked;
  }

  /**
   * 获取链接错误信息
   */
  getLinkError(): string {
    return this.linkError;
  }

  // ==================== Uniform 设置方法 ====================

  /**
   * 获取 Uniform 位置
   */
  getUniformLocation(name: string): WebGLUniformLocation | null {
    const cached = this.uniformCache.get(name);
    if (cached) {
      return cached.location;
    }
    // 如果不在缓存中，尝试直接获取
    const location = this.gl.getUniformLocation(this.program, name);
    if (location) {
      this.uniformCache.set(name, {
        location,
        type: 0
      });
    }
    return location;
  }

  setFloat(name: string, value: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniform1f(location, value);
    }
  }

  setInt(name: string, value: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniform1i(location, value);
    }
  }

  setVec2(name: string, x: number, y: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniform2f(location, x, y);
    }
  }

  setVec2Array(name: string, value: Float32Array | number[]): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniform2fv(location, value);
    }
  }

  setVec3(name: string, x: number, y: number, z: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniform3f(location, x, y, z);
    }
  }

  setVec3Array(name: string, value: Float32Array | number[]): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniform3fv(location, value);
    }
  }

  setVec4(name: string, x: number, y: number, z: number, w: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniform4f(location, x, y, z, w);
    }
  }

  setVec4Array(name: string, value: Float32Array | number[]): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniform4fv(location, value);
    }
  }

  setMat2(name: string, value: Float32Array, transpose: boolean = false): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniformMatrix2fv(location, transpose, value);
    }
  }

  setMat3(name: string, value: Float32Array, transpose: boolean = false): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniformMatrix3fv(location, transpose, value);
    }
  }

  setMat4(name: string, value: Float32Array, transpose: boolean = false): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniformMatrix4fv(location, transpose, value);
    }
  }

  setFloatArray(name: string, value: Float32Array | number[]): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniform1fv(location, value);
    }
  }

  setIntArray(name: string, value: Int32Array | number[]): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this.gl.uniform1iv(location, value);
    }
  }

  // ==================== Attribute 管理方法 ====================

  /**
   * 获取 Attribute 位置
   */
  getAttributeLocation(name: string): number {
    const cached = this.attributeCache.get(name);
    if (cached !== undefined) {
      return cached.location;
    }
    // 如果不在缓存中，尝试直接获取
    const location = this.gl.getAttribLocation(this.program, name);
    this.attributeCache.set(name, {
      location,
      type: 0
    });
    return location;
  }

  /**
   * 获取所有活动的 Uniform 名称列表
   */
  getActiveUniforms(): string[] {
    return Array.from(this.uniformCache.keys());
  }

  /**
   * 获取所有活动的 Attribute 名称列表
   */
  getActiveAttributes(): string[] {
    return Array.from(this.attributeCache.keys());
  }

  /**
   * 启用顶点属性数组
   */
  enableAttribute(name: string): void {
    const location = this.getAttributeLocation(name);
    if (location >= 0) {
      this.gl.enableVertexAttribArray(location);
    }
  }

  /**
   * 禁用顶点属性数组
   */
  disableAttribute(name: string): void {
    const location = this.getAttributeLocation(name);
    if (location >= 0) {
      this.gl.disableVertexAttribArray(location);
    }
  }

  /**
   * 删除着色器程序
   */
  delete(): void {
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
    this.linked = false;
    this.uniformCache.clear();
    this.attributeCache.clear();
  }
}
