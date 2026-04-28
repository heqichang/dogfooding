/**
 * 着色器类型
 */
export type ShaderType = 'vertex' | 'fragment';

/**
 * 着色器编译错误信息
 */
export interface ShaderError {
  line: number;
  column: number;
  message: string;
  raw: string;
}

/**
 * 着色器编译器
 * 负责编译顶点着色器和片段着色器，并提供详细的错误信息
 */
export class Shader {
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private type: ShaderType;
  private source: string;
  private shader: WebGLShader | null = null;
  private compiled: boolean = false;
  private errors: ShaderError[] = [];

  constructor(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    type: ShaderType,
    source: string
  ) {
    this.gl = gl;
    this.type = type;
    this.source = source;
    this.compile();
  }

  /**
   * 从字符串创建着色器
   */
  static fromString(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    type: ShaderType,
    source: string
  ): Shader {
    return new Shader(gl, type, source);
  }

  /**
   * 从文件加载着色器（异步）
   * 注意：需要确保 Vite 已配置支持 GLSL 文件导入
   */
  static async fromFile(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    type: ShaderType,
    url: string
  ): Promise<Shader> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`无法加载着色器文件: ${url}`);
    }
    const source = await response.text();
    return new Shader(gl, type, source);
  }

  /**
   * 编译着色器
   */
  private compile(): void {
    const gl = this.gl;
    const shaderType = this.type === 'vertex' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;

    this.shader = gl.createShader(shaderType);
    if (!this.shader) {
      throw new Error('无法创建着色器对象');
    }

    gl.shaderSource(this.shader, this.source);
    gl.compileShader(this.shader);

    this.compiled = gl.getShaderParameter(this.shader, gl.COMPILE_STATUS) as boolean;

    if (!this.compiled) {
      const infoLog = gl.getShaderInfoLog(this.shader) || '';
      this.errors = this.parseErrors(infoLog);
      console.error(`着色器编译失败 (${this.type}):`);
      this.errors.forEach(err => {
        console.error(`  行 ${err.line}: ${err.message}`);
      });
    }
  }

  /**
   * 解析编译错误信息
   * WebGL 错误信息格式通常为: "ERROR: X:Y: message"
   * 其中 X 是行号，Y 是列号
   */
  private parseErrors(infoLog: string): ShaderError[] {
    const errors: ShaderError[] = [];
    const lines = infoLog.split('\n');

    const errorPattern = /ERROR:\s*(\d+):(\d+):\s*(.+)/;

    lines.forEach(line => {
      const match = line.trim().match(errorPattern);
      if (match) {
        errors.push({
          line: parseInt(match[1], 10),
          column: parseInt(match[2], 10),
          message: match[3],
          raw: line
        });
      } else if (line.trim().length > 0) {
        // 对于无法解析的错误，添加为通用错误
        errors.push({
          line: 0,
          column: 0,
          message: line.trim(),
          raw: line
        });
      }
    });

    return errors;
  }

  /**
   * 获取原始 WebGLShader 对象
   * @throws 如果编译失败
   */
  getShader(): WebGLShader {
    if (!this.shader || !this.compiled) {
      throw new Error(`着色器未成功编译: ${this.errors.map(e => e.message).join('; ')}`);
    }
    return this.shader;
  }

  /**
   * 检查是否编译成功
   */
  isCompiled(): boolean {
    return this.compiled;
  }

  /**
   * 获取编译错误列表
   */
  getErrors(): ShaderError[] {
    return [...this.errors];
  }

  /**
   * 获取着色器类型
   */
  getType(): ShaderType {
    return this.type;
  }

  /**
   * 获取着色器源代码
   */
  getSource(): string {
    return this.source;
  }

  /**
   * 获取带行号的源代码，便于调试
   */
  getSourceWithLineNumbers(): string {
    const lines = this.source.split('\n');
    return lines.map((line, index) => `${index + 1}: ${line}`).join('\n');
  }

  /**
   * 删除着色器对象
   * 调用此方法后，着色器将不可再使用
   */
  delete(): void {
    if (this.shader) {
      this.gl.deleteShader(this.shader);
      this.shader = null;
      this.compiled = false;
    }
  }
}
