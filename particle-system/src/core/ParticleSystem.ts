import { WebGLContext } from './WebGLContext';
import { RenderLoop, FPSStats } from './RenderLoop';
import { ParticleUpdateSystem } from './ParticleUpdateSystem';
import { Texture } from './Texture';
import { Emitter, EmitterFactory } from '../emitters';
import {
  getPresetConfig,
  PresetType,
} from '../effects';

export interface ParticleSystemConfig {
  maxParticles?: number;
  canvas?: HTMLCanvasElement;
  autoStart?: boolean;
  preset?: PresetType;
  useDefaultTexture?: boolean;
}

export interface ParticleSystemStats {
  fps: number;
  averageFPS: number;
  frameTimeMs: number;
  maxParticles: number;
}

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private webGLContext: WebGLContext;
  private particleSystem: ParticleUpdateSystem;
  private renderLoop: RenderLoop;
  private isRunning: boolean = false;
  private statsCallback?: (stats: ParticleSystemStats) => void;
  private onRenderCallback?: () => void;
  private texture: Texture | null = null;

  private particleUpdateVertexShader = `#version 300 es

precision highp float;

in vec3 a_position;
in vec3 a_velocity;
in vec2 a_life;
in float a_size;
in float a_rotation;
in float a_rotationSpeed;
in vec4 a_color;

out vec3 v_position;
out vec3 v_velocity;
out vec2 v_life;
out float v_size;
out float v_rotation;
out float v_rotationSpeed;
out vec4 v_color;

uniform float u_deltaTime;
uniform float u_elapsedTime;
uniform vec3 u_gravity;
uniform float u_drag;
uniform bool u_useGroundCollision;
uniform float u_groundY;
uniform float u_groundRestitution;
uniform float u_groundFriction;

void main() {
    float age = a_life.x;
    float maxLife = a_life.y;

    float newAge = age + u_deltaTime;
    bool isAlive = newAge < maxLife && maxLife > 0.0;

    if (isAlive) {
        vec3 velocity = a_velocity;
        velocity += u_gravity * u_deltaTime;
        velocity *= 1.0 - u_drag * u_deltaTime;

        vec3 position = a_position + velocity * u_deltaTime;
        
        if (u_useGroundCollision) {
            float particleRadius = a_size * 0.5;
            if (position.y < u_groundY + particleRadius) {
                if (velocity.y < 0.0) {
                    velocity.y = -velocity.y * u_groundRestitution;
                    velocity.x *= (1.0 - u_groundFriction);
                    velocity.z *= (1.0 - u_groundFriction);
                }
                position.y = u_groundY + particleRadius;
            }
        }

        float rotation = a_rotation + a_rotationSpeed * u_deltaTime;

        v_position = position;
        v_velocity = velocity;
        v_life = vec2(newAge, maxLife);
        v_size = a_size;
        v_rotation = rotation;
        v_rotationSpeed = a_rotationSpeed;
        v_color = a_color;
    } else {
        v_position = a_position;
        v_velocity = vec3(0.0);
        v_life = vec2(1.0, 1.0);
        v_size = a_size;
        v_rotation = a_rotation;
        v_rotationSpeed = a_rotationSpeed;
        v_color = a_color;
    }
}
`;

  private particleRenderVertexShader = `#version 300 es

precision highp float;

in vec3 a_position;
in vec2 a_life;
in float a_size;
in float a_rotation;
in vec4 a_color;

out vec4 v_color;
out float v_rotation;
out float v_lifeRatio;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform float u_particleSizeScale;
uniform float u_maxSize;
uniform vec4 u_colorStart;
uniform vec4 u_colorEnd;
uniform bool u_useColorGradient;

void main() {
    vec4 viewPos = u_view * vec4(a_position, 1.0);
    vec4 clipPos = u_projection * viewPos;

    gl_Position = clipPos;
    gl_PointSize = a_size * u_particleSizeScale;
    gl_PointSize = clamp(gl_PointSize, 1.0, u_maxSize);

    float lifeRatio = a_life.x / max(a_life.y, 0.001);
    v_lifeRatio = lifeRatio;

    if (u_useColorGradient) {
        float t = lifeRatio;
        v_color = mix(u_colorStart, u_colorEnd, t);
    } else {
        v_color = a_color;
    }
    
    v_rotation = a_rotation;
}
`;

  private particleRenderFragmentShader = `#version 300 es

precision highp float;

in vec4 v_color;
in float v_rotation;
in float v_lifeRatio;

out vec4 outColor;

uniform bool u_useCircularShape;
uniform bool u_useTexture;
uniform sampler2D u_particleTexture;

void main() {
    if (v_lifeRatio >= 1.0 || v_lifeRatio < 0.0) {
        discard;
    }

    vec2 coord = gl_PointCoord - vec2(0.5);
    
    vec2 uv = gl_PointCoord;
    
    if (abs(v_rotation) > 0.001) {
        float cosRot = cos(v_rotation);
        float sinRot = sin(v_rotation);
        vec2 rotatedCoord = vec2(
            coord.x * cosRot - coord.y * sinRot,
            coord.x * sinRot + coord.y * cosRot
        );
        uv = rotatedCoord + vec2(0.5);
    }

    if (u_useCircularShape && !u_useTexture) {
        float dist = length(coord);
        if (dist > 0.5) {
            discard;
        }
    }

    vec4 finalColor = v_color;
    
    if (u_useTexture) {
        vec4 texColor = texture(u_particleTexture, uv);
        finalColor *= texColor;
    }

    float alpha = finalColor.a;

    if (alpha <= 0.01) {
        discard;
    }

    outColor = vec4(finalColor.rgb, alpha);
}
`;

  constructor(config: ParticleSystemConfig) {
    const maxParticles = config.maxParticles ?? 10000;

    if (config.canvas) {
      this.canvas = config.canvas;
    } else {
      this.canvas = document.getElementById('particleCanvas') as HTMLCanvasElement;
      if (!this.canvas) {
        throw new Error('No canvas found or provided');
      }
    }

    this.webGLContext = new WebGLContext(this.canvas);
    const gl = this.webGLContext.getContext() as WebGL2RenderingContext;

    if (!this.webGLContext.isWebGL2()) {
      throw new Error('WebGL 2.0 is required');
    }

    this.particleSystem = new ParticleUpdateSystem(gl, {
      maxParticles,
      gravity: { x: 0, y: -9.8, z: 0 },
      drag: 0.1,
    });

    this.particleSystem.initialize(
      this.particleUpdateVertexShader,
      this.particleRenderVertexShader,
      this.particleRenderFragmentShader
    );

    this.renderLoop = new RenderLoop();

    if (config.preset) {
      this.applyPreset(config.preset);
    }

    if (config.useDefaultTexture ?? true) {
      this.setDefaultTexture();
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.setupRenderLoop();

    if (config.autoStart ?? true) {
      this.start();
    }
  }

  private resize(): void {
    this.webGLContext.resize(window.innerWidth, window.innerHeight);
  }

  private setupRenderLoop(): void {

    this.renderLoop.addCallback((deltaTime: number, elapsedTime: number) => {
      const clampedDeltaTime = Math.min(deltaTime, 0.05);

      this.particleSystem.update({
        deltaTime: clampedDeltaTime,
        elapsedTime: elapsedTime,
      });

      this.webGLContext.clear([0.05, 0.05, 0.1, 1.0]);

      const aspect = this.webGLContext.getActualWidth() / this.webGLContext.getActualHeight();
      const orthoHeight = 6;
      const orthoWidth = orthoHeight * aspect;
      const proj = this.createOrthographicMatrix(
        -orthoWidth,
        orthoWidth,
        -orthoHeight,
        orthoHeight,
        0.1,
        100
      );

      const view = this.createLookAtMatrix(0, 2, 5, 0, 0, 0, 0, 1, 0);

      this.particleSystem.render(
        proj,
        view,
        {
          particleSizeScale: 1.0,
          maxSize: 256.0,
          useCircularShape: true,
        }
      );

      if (this.onRenderCallback) {
        this.onRenderCallback();
      }

      if (this.statsCallback) {
        const stats = this.renderLoop.getFPSStats();
        this.statsCallback({
          fps: stats.fps,
          averageFPS: stats.averageFPS,
          frameTimeMs: stats.frameTimeMs,
          maxParticles: this.particleSystem.getMaxParticles(),
        });
      }
    });
  }

  private createOrthographicMatrix(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
  ): Float32Array {
    const m = new Float32Array(16);
    const tx = -(right + left) / (right - left);
    const ty = -(top + bottom) / (top - bottom);
    const tz = -(far + near) / (far - near);

    m[0] = 2 / (right - left); m[1] = 0; m[2] = 0; m[3] = 0;
    m[4] = 0; m[5] = 2 / (top - bottom); m[6] = 0; m[7] = 0;
    m[8] = 0; m[9] = 0; m[10] = -2 / (far - near); m[11] = 0;
    m[12] = tx; m[13] = ty; m[14] = tz; m[15] = 1;

    return m;
  }

  private createLookAtMatrix(
    eyeX: number, eyeY: number, eyeZ: number,
    centerX: number, centerY: number, centerZ: number,
    upX: number, upY: number, upZ: number
  ): Float32Array {
    const zAxisX = eyeX - centerX;
    const zAxisY = eyeY - centerY;
    const zAxisZ = eyeZ - centerZ;
    const zLen = Math.sqrt(zAxisX * zAxisX + zAxisY * zAxisY + zAxisZ * zAxisZ);
    const z0 = zAxisX / zLen;
    const z1 = zAxisY / zLen;
    const z2 = zAxisZ / zLen;

    const xAxisX = upY * z2 - upZ * z1;
    const xAxisY = upZ * z0 - upX * z2;
    const xAxisZ = upX * z1 - upY * z0;
    const xLen = Math.sqrt(xAxisX * xAxisX + xAxisY * xAxisY + xAxisZ * xAxisZ);
    const x0 = xAxisX / xLen;
    const x1 = xAxisY / xLen;
    const x2 = xAxisZ / xLen;

    const y0 = z1 * x2 - z2 * x1;
    const y1 = z2 * x0 - z0 * x2;
    const y2 = z0 * x1 - z1 * x0;

    const m = new Float32Array(16);
    m[0] = x0; m[1] = y0; m[2] = z0; m[3] = 0;
    m[4] = x1; m[5] = y1; m[6] = z1; m[7] = 0;
    m[8] = x2; m[9] = y2; m[10] = z2; m[11] = 0;
    m[12] = -(x0 * eyeX + x1 * eyeY + x2 * eyeZ);
    m[13] = -(y0 * eyeX + y1 * eyeY + y2 * eyeZ);
    m[14] = -(z0 * eyeX + z1 * eyeY + z2 * eyeZ);
    m[15] = 1;

    return m;
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.renderLoop.start();
    }
  }

  stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      this.renderLoop.stop();
    }
  }

  pause(): void {
    this.stop();
  }

  resume(): void {
    this.start();
  }

  reset(): void {
    const emitter = this.particleSystem.getEmitter();
    if (emitter) {
      emitter.reset();
    }
  }

  emit(count: number): void {
    this.particleSystem.emitParticles(count);
  }

  setEmitter(emitter: Emitter): void {
    this.particleSystem.setEmitter(emitter);
  }

  getEmitter(): Emitter | null {
    return this.particleSystem.getEmitter();
  }

  setGravity(x: number, y: number, z: number): void {
    this.particleSystem.setGravity(x, y, z);
  }

  setDrag(drag: number): void {
    this.particleSystem.setDrag(drag);
  }

  setBlendMode(mode: 'alpha' | 'additive' | 'additiveAlpha'): void {
    this.particleSystem.setBlendMode(mode);
  }

  setColorGradient(
    startColor: [number, number, number, number],
    endColor: [number, number, number, number],
    enable: boolean = true
  ): void {
    this.particleSystem.setColorGradient(startColor, endColor, enable);
  }

  setTexture(texture: Texture | null, enable: boolean = true): void {
    if (this.texture && this.texture !== texture) {
      this.texture.delete();
    }
    this.texture = texture;
    this.particleSystem.setTexture(texture, enable);
  }

  setDefaultTexture(): void {
    const gl = this.webGLContext.getContext() as WebGL2RenderingContext;
    const texture = Texture.createDefaultDot(gl, 64);
    this.setTexture(texture, true);
  }

  setGroundCollision(
    enabled: boolean = true,
    groundY: number = -2,
    restitution: number = 0.5,
    friction: number = 0.2
  ): void {
    this.particleSystem.setGroundCollision(enabled, groundY, restitution, friction);
  }

  applyPreset(preset: PresetType): void {
    const config = getPresetConfig(preset);
    
    const emitter = EmitterFactory.create(
      config.emitterType as any,
      config.emitterConfig as any
    );
    
    this.setEmitter(emitter);
    this.setColorGradient(config.colorStart, config.colorEnd, config.useColorGradient);
    this.setGravity(config.gravity.x, config.gravity.y, config.gravity.z);
    this.setDrag(config.drag);
    this.setGroundCollision(
      config.useGroundCollision,
      config.groundY,
      config.groundRestitution,
      config.groundFriction
    );
    
    if (config.useAdditiveBlending) {
      this.setBlendMode('additiveAlpha');
    } else {
      this.setBlendMode('alpha');
    }
  }

  onStats(callback: (stats: ParticleSystemStats) => void): void {
    this.statsCallback = callback;
  }

  onRender(callback: () => void): void {
    this.onRenderCallback = callback;
  }

  getFPSStats(): FPSStats {
    return this.renderLoop.getFPSStats();
  }

  isRunningState(): boolean {
    return this.isRunning;
  }

  getMaxParticles(): number {
    return this.particleSystem.getMaxParticles();
  }

  dispose(): void {
    this.stop();
    if (this.texture) {
      this.texture.delete();
      this.texture = null;
    }
    this.particleSystem.delete();
  }
}
