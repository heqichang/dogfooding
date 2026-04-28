/**
 * 渲染回调函数类型
 * @param deltaTime 上一帧到当前帧的时间增量（秒）
 * @param elapsedTime 从渲染循环开始到当前的总时间（秒）
 */
export type RenderCallback = (deltaTime: number, elapsedTime: number) => void;

/**
 * FPS 统计信息
 */
export interface FPSStats {
  /** 当前 FPS */
  fps: number;
  /** 平均 FPS（最近 N 帧的平均） */
  averageFPS: number;
  /** 最小 FPS */
  minFPS: number;
  /** 最大 FPS */
  maxFPS: number;
  /** 帧时间（毫秒） */
  frameTimeMs: number;
}

/**
 * 渲染循环管理器
 * 封装 requestAnimationFrame，提供时间管理、暂停/继续/重置功能，以及 FPS 统计
 */
export class RenderLoop {
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  
  private lastTime: number = 0;
  private startTime: number = 0;
  private pauseStartTime: number = 0;
  private totalPausedTime: number = 0;
  
  private deltaTime: number = 0;
  private elapsedTime: number = 0;
  
  // FPS 统计
  private fpsHistory: number[] = [];
  private fpsHistorySize: number = 60;
  private frameCount: number = 0;
  private fpsUpdateInterval: number = 1000; // 毫秒
  private lastFPSUpdate: number = 0;
  private framesSinceLastUpdate: number = 0;
  
  // 统计数据
  private currentFPS: number = 60;
  private minFPS: number = 60;
  private maxFPS: number = 60;
  private averageFPS: number = 60;
  private currentFrameTimeMs: number = 16.67;
  
  private renderCallbacks: RenderCallback[] = [];

  constructor() {
    this.reset();
  }

  /**
   * 添加渲染回调
   * 回调会在每一帧被调用
   */
  addCallback(callback: RenderCallback): void {
    if (!this.renderCallbacks.includes(callback)) {
      this.renderCallbacks.push(callback);
    }
  }

  /**
   * 移除渲染回调
   */
  removeCallback(callback: RenderCallback): void {
    const index = this.renderCallbacks.indexOf(callback);
    if (index > -1) {
      this.renderCallbacks.splice(index, 1);
    }
  }

  /**
   * 开始渲染循环
   */
  start(): void {
    if (this.isRunning) {
      console.warn('渲染循环已经在运行中');
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    
    const now = performance.now();
    this.startTime = now;
    this.lastTime = now;
    this.lastFPSUpdate = now;
    this.totalPausedTime = 0;
    
    this.loop();
  }

  /**
   * 停止渲染循环
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 暂停渲染循环
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    this.isPaused = true;
    this.pauseStartTime = performance.now();
  }

  /**
   * 继续渲染循环
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }

    this.isPaused = false;
    const now = performance.now();
    this.totalPausedTime += now - this.pauseStartTime;
    this.lastTime = now;
  }

  /**
   * 重置渲染循环
   * 停止循环并重置所有时间统计
   */
  reset(): void {
    this.stop();
    
    this.lastTime = 0;
    this.startTime = 0;
    this.pauseStartTime = 0;
    this.totalPausedTime = 0;
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.frameCount = 0;
    this.framesSinceLastUpdate = 0;
    this.fpsHistory = [];
    this.currentFPS = 60;
    this.minFPS = 60;
    this.maxFPS = 60;
    this.averageFPS = 60;
    this.currentFrameTimeMs = 16.67;
    this.isPaused = false;
  }

  /**
   * 渲染循环主函数
   */
  private loop = (): void => {
    if (!this.isRunning) {
      return;
    }

    const now = performance.now();

    if (this.isPaused) {
      this.animationFrameId = requestAnimationFrame(this.loop);
      return;
    }

    // 计算时间增量（秒）
    this.deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // 计算总运行时间（扣除暂停时间）
    this.elapsedTime = (now - this.startTime - this.totalPausedTime) / 1000;

    // 更新 FPS 统计
    this.updateFPSStats(now);

    // 执行所有渲染回调
    this.renderCallbacks.forEach(callback => {
      try {
        callback(this.deltaTime, this.elapsedTime);
      } catch (error) {
        console.error('渲染回调执行出错:', error);
      }
    });

    this.frameCount++;
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * 更新 FPS 统计数据
   */
  private updateFPSStats(now: number): void {
    this.framesSinceLastUpdate++;
    this.currentFrameTimeMs = this.deltaTime * 1000;

    // 每秒更新一次 FPS 统计
    if (now - this.lastFPSUpdate >= this.fpsUpdateInterval) {
      // 计算当前 FPS
      const elapsedSeconds = (now - this.lastFPSUpdate) / 1000;
      this.currentFPS = this.framesSinceLastUpdate / elapsedSeconds;

      // 更新历史记录
      this.fpsHistory.push(this.currentFPS);
      if (this.fpsHistory.length > this.fpsHistorySize) {
        this.fpsHistory.shift();
      }

      // 计算平均值
      const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
      this.averageFPS = sum / this.fpsHistory.length;

      // 更新最小/最大值
      if (this.currentFPS < this.minFPS) {
        this.minFPS = this.currentFPS;
      }
      if (this.currentFPS > this.maxFPS) {
        this.maxFPS = this.currentFPS;
      }

      this.lastFPSUpdate = now;
      this.framesSinceLastUpdate = 0;
    }
  }

  /**
   * 获取帧时间增量（秒）
   */
  getDeltaTime(): number {
    return this.deltaTime;
  }

  /**
   * 获取总运行时间（秒）
   */
  getElapsedTime(): number {
    return this.elapsedTime;
  }

  /**
   * 获取总帧数
   */
  getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * 检查渲染循环是否在运行
   */
  isLoopRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 检查渲染循环是否已暂停
   */
  isLoopPaused(): boolean {
    return this.isPaused;
  }

  /**
   * 获取 FPS 统计信息
   */
  getFPSStats(): FPSStats {
    return {
      fps: this.currentFPS,
      averageFPS: this.averageFPS,
      minFPS: this.minFPS,
      maxFPS: this.maxFPS,
      frameTimeMs: this.currentFrameTimeMs
    };
  }

  /**
   * 设置 FPS 历史记录大小
   * 用于计算平均 FPS
   */
  setFPSHistorySize(size: number): void {
    this.fpsHistorySize = Math.max(1, size);
    while (this.fpsHistory.length > this.fpsHistorySize) {
      this.fpsHistory.shift();
    }
  }

  /**
   * 设置 FPS 更新间隔（毫秒）
   */
  setFPSUpdateInterval(intervalMs: number): void {
    this.fpsUpdateInterval = Math.max(100, intervalMs);
  }
}
