/**
 * 粒子系统状态
 * 管理粒子系统的运行时状态
 */

/**
 * 粒子系统运行状态
 */
export type ParticleSystemStatus = 'idle' | 'running' | 'paused' | 'stopped';

/**
 * 粒子系统状态配置
 */
export interface ParticleSystemStateOptions {
  /** 最大粒子数量 */
  maxParticles: number;
  /** 发射速率（粒子/秒） */
  emissionRate?: number;
  /** 初始随机种子 */
  seed?: number;
  /** 初始时间 */
  startTime?: number;
}

/**
 * 粒子系统状态类
 * 管理粒子系统的运行时状态
 */
export class ParticleSystemState {
  /** 最大粒子数量 */
  private maxParticles: number;

  /** 活跃粒子计数 */
  private activeParticleCount: number = 0;

  /** 发射速率（粒子/秒） */
  private emissionRate: number = 0;

  /** 发射累积器
   * 用于控制发射速率
   * 当累积到 1 时发射一个粒子
   */
  private emissionAccumulator: number = 0;

  /** 随机种子（用于 GPU 端随机数生成） */
  private seed: number;

  /** 系统是否在运行 */
  private status: ParticleSystemStatus = 'idle';

  /** 时间状态 */
  private time: {
    /** 启动时间戳 */
    startTime: number;
    /** 总运行时间（秒） */
    elapsedTime: number;
    /** 上一帧时间戳 */
    lastFrameTime: number;
    /** 当前帧时间戳 */
    currentFrameTime: number;
    /** 帧间隔时间（秒） */
    deltaTime: number;
    /** 帧计数 */
    frameCount: number;
  };

  /** 最大活跃粒子计数（用于发射控制） */
  private maxActiveParticles: number = Infinity;

  constructor(options: ParticleSystemStateOptions) {
    this.maxParticles = options.maxParticles;
    this.emissionRate = options.emissionRate || 0;
    this.seed = options.seed || this.generateSeed();
    this.maxActiveParticles = options.maxParticles;

    const now = options.startTime || performance.now();
    this.time = {
      startTime: now,
      elapsedTime: 0,
      lastFrameTime: now,
      currentFrameTime: now,
      deltaTime: 0,
      frameCount: 0,
    };
  }

  /**
   * 生成随机种子
   */
  private generateSeed(): number {
    return Math.random() * 10000;
  }

  /**
   * 获取最大粒子数量
   */
  getMaxParticles(): number {
    return this.maxParticles;
  }

  /**
   * 获取活跃粒子计数
   */
  getActiveParticleCount(): number {
    return this.activeParticleCount;
  }

  /**
   * 设置活跃粒子计数
   */
  setActiveParticleCount(count: number): void {
    this.activeParticleCount = Math.min(Math.max(0, count), this.maxParticles);
  }

  /**
   * 增加活跃粒子计数
   */
  incrementActiveCount(delta: number = 1): number {
    this.activeParticleCount = Math.min(
      this.activeParticleCount + delta,
      this.maxParticles
    );
    return this.activeParticleCount;
  }

  /**
   * 减少活跃粒子计数
   */
  decrementActiveCount(delta: number = 1): number {
    this.activeParticleCount = Math.max(this.activeParticleCount - delta, 0);
    return this.activeParticleCount;
  }

  /**
   * 获取发射速率
   */
  getEmissionRate(): number {
    return this.emissionRate;
  }

  /**
   * 设置发射速率
   */
  setEmissionRate(rate: number): void {
    this.emissionRate = Math.max(0, rate);
  }

  /**
   * 获取发射累积器
   */
  getEmissionAccumulator(): number {
    return this.emissionAccumulator;
  }

  /**
   * 计算当前帧应该发射的粒子数量
   * @param deltaTime 帧间隔时间（秒）
   * @returns 应该发射的粒子数量
   */
  calculateEmissionCount(deltaTime: number): number {
    if (this.emissionRate <= 0) {
      return 0;
    }

    this.emissionAccumulator += deltaTime * this.emissionRate;

    const count = Math.floor(this.emissionAccumulator);
    this.emissionAccumulator -= count;

    const availableSlots = this.maxParticles - this.activeParticleCount;
    return Math.min(count, availableSlots);
  }

  /**
   * 重置发射累积器
   */
  resetEmissionAccumulator(): void {
    this.emissionAccumulator = 0;
  }

  /**
   * 获取随机种子
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * 设置随机种子
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }

  /**
   * 重新生成随机种子
   */
  regenerateSeed(): number {
    this.seed = this.generateSeed();
    return this.seed;
  }

  /**
   * 获取当前状态
   */
  getStatus(): ParticleSystemStatus {
    return this.status;
  }

  /**
   * 检查是否在运行
   */
  isRunning(): boolean {
    return this.status === 'running';
  }

  /**
   * 检查是否已暂停
   */
  isPaused(): boolean {
    return this.status === 'paused';
  }

  /**
   * 开始粒子系统
   */
  start(): void {
    if (this.status === 'stopped') {
      this.reset();
    }
    this.status = 'running';
  }

  /**
   * 暂停粒子系统
   */
  pause(): void {
    if (this.status === 'running') {
      this.status = 'paused';
    }
  }

  /**
   * 恢复粒子系统
   */
  resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
    }
  }

  /**
   * 停止粒子系统
   */
  stop(): void {
    this.status = 'stopped';
  }

  /**
   * 重置粒子系统状态
   */
  reset(): void {
    this.activeParticleCount = 0;
    this.emissionAccumulator = 0;
    this.time.elapsedTime = 0;
    this.time.frameCount = 0;

    const now = performance.now();
    this.time.startTime = now;
    this.time.lastFrameTime = now;
    this.time.currentFrameTime = now;
    this.time.deltaTime = 0;
  }

  /**
   * 更新时间状态
   * @param currentTime 当前时间戳（可选，默认使用 performance.now()）
   * @returns deltaTime 秒
   */
  updateTime(currentTime?: number): number {
    const now = currentTime ?? performance.now();

    if (this.status === 'paused') {
      this.time.lastFrameTime = now;
      this.time.deltaTime = 0;
      return 0;
    }

    this.time.currentFrameTime = now;
    this.time.deltaTime = (now - this.time.lastFrameTime) / 1000;

    if (this.status === 'running') {
      this.time.elapsedTime += this.time.deltaTime;
      this.time.frameCount++;
    }

    this.time.lastFrameTime = now;

    return this.time.deltaTime;
  }

  /**
   * 获取时间信息
   */
  getTimeInfo(): {
    startTime: number;
    elapsedTime: number;
    deltaTime: number;
    frameCount: number;
  } {
    return {
      startTime: this.time.startTime,
      elapsedTime: this.time.elapsedTime,
      deltaTime: this.time.deltaTime,
      frameCount: this.time.frameCount,
    };
  }

  /**
   * 获取 GPU 可用的时间参数
   * 用于传递给着色器的 uniform
   */
  getGPUUniforms(): {
    u_time: number;
    u_deltaTime: number;
    u_seed: number;
    u_frame: number;
  } {
    return {
      u_time: this.time.elapsedTime,
      u_deltaTime: this.time.deltaTime,
      u_seed: this.seed,
      u_frame: this.time.frameCount,
    };
  }

  /**
   * 检查是否可以发射更多粒子
   */
  canEmitMore(): boolean {
    return (
      this.status === 'running' &&
      this.activeParticleCount < this.maxParticles &&
      this.activeParticleCount < this.maxActiveParticles
    );
  }

  /**
   * 设置最大活跃粒子数量
   */
  setMaxActiveParticles(max: number): void {
    this.maxActiveParticles = Math.min(max, this.maxParticles);
  }

  /**
   * 获取最大活跃粒子数量
   */
  getMaxActiveParticles(): number {
    return this.maxActiveParticles;
  }

  /**
   * 获取完整状态快照
   */
  getStateSnapshot(): {
    status: ParticleSystemStatus;
    maxParticles: number;
    activeParticleCount: number;
    emissionRate: number;
    emissionAccumulator: number;
    seed: number;
    time: {
      elapsedTime: number;
      deltaTime: number;
      frameCount: number;
    };
  } {
    return {
      status: this.status,
      maxParticles: this.maxParticles,
      activeParticleCount: this.activeParticleCount,
      emissionRate: this.emissionRate,
      emissionAccumulator: this.emissionAccumulator,
      seed: this.seed,
      time: {
        elapsedTime: this.time.elapsedTime,
        deltaTime: this.time.deltaTime,
        frameCount: this.time.frameCount,
      },
    };
  }
}
