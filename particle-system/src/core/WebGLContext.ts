/**
 * WebGL 上下文管理器
 * 负责创建和管理 WebGL 2.0 / WebGL 1.0 上下文
 * 支持上下文丢失和恢复，以及 HiDPI 设备像素比
 */
export class WebGLContext {
  private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement;
  private version: 1 | 2 = 1;
  private devicePixelRatio: number = 1;
  private onContextLostCallbacks: Array<() => void> = [];
  private onContextRestoredCallbacks: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.initContext();
    this.setupEventListeners();
  }

  /**
   * 初始化 WebGL 上下文
   * 优先尝试 WebGL 2.0，如果不支持则降级到 WebGL 1.0
   */
  private initContext(): void {
    const gl2 = this.canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
    });

    if (gl2) {
      this.gl = gl2;
      this.version = 2;
      console.log('WebGL 2.0 上下文创建成功');
      return;
    }

    const gl1 = (this.canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
    }) as WebGLRenderingContext | null) || (this.canvas.getContext('experimental-webgl', {
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
    }) as WebGLRenderingContext | null);

    if (gl1) {
      this.gl = gl1;
      this.version = 1;
      console.log('WebGL 1.0 上下文创建成功 (降级模式)');
      return;
    }

    throw new Error('无法创建 WebGL 上下文，请确保浏览器支持 WebGL');
  }

  /**
   * 设置上下文事件监听器
   */
  private setupEventListeners(): void {
    this.canvas.addEventListener('webglcontextlost', (event: Event) => {
      event.preventDefault();
      this.gl = null;
      console.warn('WebGL 上下文丢失');
      this.onContextLostCallbacks.forEach(callback => callback());
    });

    this.canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL 上下文恢复');
      this.initContext();
      this.onContextRestoredCallbacks.forEach(callback => callback());
    });
  }

  /**
   * 获取 WebGL 上下文
   * @throws 如果上下文已丢失
   */
  getContext(): WebGL2RenderingContext | WebGLRenderingContext {
    if (!this.gl) {
      throw new Error('WebGL 上下文已丢失');
    }
    return this.gl;
  }

  /**
   * 获取 WebGL 2.0 上下文（如果可用）
   * @returns WebGL2RenderingContext 或 null（如果只支持 WebGL 1.0）
   */
  getWebGL2(): WebGL2RenderingContext | null {
    if (this.version === 2 && this.gl) {
      return this.gl as WebGL2RenderingContext;
    }
    return null;
  }

  /**
   * 获取 WebGL 版本
   */
  getVersion(): 1 | 2 {
    return this.version;
  }

  /**
   * 检查是否支持 WebGL 2.0
   */
  isWebGL2(): boolean {
    return this.version === 2;
  }

  /**
   * 获取设备像素比
   */
  getDevicePixelRatio(): number {
    return this.devicePixelRatio;
  }

  /**
   * 调整画布大小以适应 HiDPI 显示
   * @param width 逻辑宽度（CSS 像素）
   * @param height 逻辑高度（CSS 像素）
   */
  resize(width: number, height: number): void {
    const dpr = this.devicePixelRatio;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (this.gl) {
      this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    }
  }

  /**
   * 获取画布的实际像素宽度
   */
  getActualWidth(): number {
    return this.canvas.width;
  }

  /**
   * 获取画布的实际像素高度
   */
  getActualHeight(): number {
    return this.canvas.height;
  }

  /**
   * 检查上下文是否可用
   */
  isAvailable(): boolean {
    return this.gl !== null;
  }

  /**
   * 添加上下文丢失回调
   * @param callback 回调函数
   */
  onContextLost(callback: () => void): void {
    this.onContextLostCallbacks.push(callback);
  }

  /**
   * 添加上下文恢复回调
   * @param callback 回调函数
   */
  onContextRestored(callback: () => void): void {
    this.onContextRestoredCallbacks.push(callback);
  }

  /**
   * 清除画布
   * @param color RGBA 颜色值 [r, g, b, a]，范围 0.0 - 1.0
   */
  clear(color: [number, number, number, number] = [0, 0, 0, 1]): void {
    if (!this.gl) return;

    this.gl.clearColor(color[0], color[1], color[2], color[3]);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }
}
