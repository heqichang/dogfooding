import { Shader } from './Shader';
import { ShaderProgram } from './ShaderProgram';
import { VertexArray } from './VertexArray';
import { ParticleSystemBuffer } from './ParticleSystemBuffer';
import { TransformFeedbackManager, getTransformFeedbackVaryingNames } from './TransformFeedbackManager';
import {
  ParticleAttributeName,
  PARTICLE_ATTRIBUTES,
  PARTICLE_ATTRIBUTE_LIST,
} from './ParticleAttribute';
import { Emitter, ParticleInitialState } from '../emitters';
import { Texture } from './Texture';

export interface ParticleUpdateSystemConfig {
  maxParticles: number;
  gravity?: { x: number; y: number; z: number };
  drag?: number;
}

export interface ParticleUpdateState {
  deltaTime: number;
  elapsedTime: number;
}

export type BlendMode = 'alpha' | 'additive' | 'additiveAlpha';

export class ParticleUpdateSystem {
  private gl: WebGL2RenderingContext;
  private maxParticles: number;
  private particleBuffer: ParticleSystemBuffer;
  private updateProgram: ShaderProgram | null = null;
  private renderProgram: ShaderProgram | null = null;
  private tfManager: TransformFeedbackManager;
  private updateVAO: VertexArray;
  private renderVAO: VertexArray;
  private gravity: { x: number; y: number; z: number };
  private drag: number;
  private isInitialized: boolean = false;
  
  private emitter: Emitter | null = null;
  private nextParticleIndex: number = 0;
  private emissionCounter: number = 0;
  private colorStart: [number, number, number, number] = [1, 1, 1, 1];
  private colorEnd: [number, number, number, number] = [1, 1, 1, 1];
  private useColorGradient: boolean = false;
  private texture: Texture | null = null;
  private useTexture: boolean = false;
  private useGroundCollision: boolean = false;
  private groundY: number = -2;
  private groundRestitution: number = 0.5;
  private groundFriction: number = 0.2;
  private blendMode: BlendMode = 'alpha';

  constructor(
    gl: WebGL2RenderingContext,
    config: ParticleUpdateSystemConfig
  ) {
    this.gl = gl;
    this.maxParticles = config.maxParticles;
    this.gravity = config.gravity || { x: 0, y: -9.8, z: 0 };
    this.drag = config.drag || 0.0;

    this.particleBuffer = new ParticleSystemBuffer(gl, {
      maxParticles: config.maxParticles,
      useDoubleBuffer: true,
      usage: 'dynamic_copy',
    });

    this.tfManager = new TransformFeedbackManager(gl);
    this.updateVAO = new VertexArray(gl);
    this.renderVAO = new VertexArray(gl);
  }

  initialize(
    updateVertexShaderSource: string,
    renderVertexShaderSource: string,
    renderFragmentShaderSource: string
  ): void {
    if (this.isInitialized) {
      return;
    }

    const varyings = getTransformFeedbackVaryingNames(PARTICLE_ATTRIBUTE_LIST);

    this.tfManager.configure({
      varyings,
      bufferMode: 'separate',
    });

    const updateVS = new Shader(this.gl, 'vertex', updateVertexShaderSource);
    if (!updateVS.isCompiled()) {
      throw new Error(`更新顶点着色器编译失败: ${updateVS.getErrors().map(e => e.message).join('; ')}`);
    }

    this.updateProgram = ShaderProgram.createWithTransformFeedback(
      this.gl,
      updateVS,
      null,
      varyings,
      'separate'
    );

    this.renderProgram = ShaderProgram.fromSources(
      this.gl,
      renderVertexShaderSource,
      renderFragmentShaderSource
    );

    this.setupUpdateVAO();
    this.setupRenderVAO();

    this.isInitialized = true;
  }

  private setupUpdateVAO(): void {
    if (!this.updateProgram) {
      return;
    }

    const gl = this.gl;
    const buffers = this.particleBuffer.getBuffers();

    this.updateProgram.use();
    this.updateVAO.bind();

    PARTICLE_ATTRIBUTE_LIST.forEach((attrName) => {
      const particleBuffer = buffers[attrName];
      const attr = PARTICLE_ATTRIBUTES[attrName];
      const location = this.updateProgram!.getAttributeLocation(attr.name);

      if (location >= 0) {
        const inputBuffer = particleBuffer.getInputBuffer();

        this.updateVAO.addAttribute({
          nameOrIndex: location,
          size: attr.componentCount,
          type: 'float',
          normalized: false,
          stride: 0,
          offset: 0,
          buffer: inputBuffer,
        });

        gl.enableVertexAttribArray(location);
      }
    });

    this.updateVAO.unbind();
    this.updateProgram.unuse();
  }

  private setupRenderVAO(): void {
    if (!this.renderProgram) {
      return;
    }

    const gl = this.gl;
    const buffers = this.particleBuffer.getBuffers();

    const renderAttributes: ParticleAttributeName[] = ['position', 'life', 'size', 'rotation', 'color'];

    this.renderProgram.use();
    this.renderVAO.bind();

    renderAttributes.forEach((attrName) => {
      const particleBuffer = buffers[attrName];
      const attr = PARTICLE_ATTRIBUTES[attrName];
      const location = this.renderProgram!.getAttributeLocation(attr.name);

      if (location >= 0) {
        const inputBuffer = particleBuffer.getInputBuffer();

        this.renderVAO.addAttribute({
          nameOrIndex: location,
          size: attr.componentCount,
          type: 'float',
          normalized: false,
          stride: 0,
          offset: 0,
          buffer: inputBuffer,
        });

        gl.enableVertexAttribArray(location);
      }
    });

    this.renderVAO.unbind();
    this.renderProgram.unuse();
  }

  update(state: ParticleUpdateState): void {
    if (!this.isInitialized || !this.updateProgram) {
      return;
    }

    const clampedDeltaTime = Math.min(state.deltaTime, 0.05);

    if (this.emitter) {
      const emitCount = this.emitter.update(clampedDeltaTime);
      if (emitCount > 0) {
        this.emitParticles(emitCount);
      }
    }

    const gl = this.gl;

    gl.enable(gl.RASTERIZER_DISCARD);

    this.updateProgram.use();

    this.updateProgram.setFloat('u_deltaTime', clampedDeltaTime);
    this.updateProgram.setFloat('u_elapsedTime', state.elapsedTime);
    this.updateProgram.setVec3('u_gravity', this.gravity.x, this.gravity.y, this.gravity.z);
    this.updateProgram.setFloat('u_drag', this.drag);
    this.updateProgram.setInt('u_useGroundCollision', this.useGroundCollision ? 1 : 0);
    this.updateProgram.setFloat('u_groundY', this.groundY);
    this.updateProgram.setFloat('u_groundRestitution', this.groundRestitution);
    this.updateProgram.setFloat('u_groundFriction', this.groundFriction);

    const buffers = this.particleBuffer.getBuffers();

    this.updateVAO.bind();

    PARTICLE_ATTRIBUTE_LIST.forEach((attrName) => {
      const particleBuffer = buffers[attrName];
      const attr = PARTICLE_ATTRIBUTES[attrName];
      const location = this.updateProgram!.getAttributeLocation(attr.name);

      if (location >= 0) {
        const inputBuffer = particleBuffer.getInputBuffer();
        inputBuffer.bind();
        gl.vertexAttribPointer(
          location,
          attr.componentCount,
          gl.FLOAT,
          false,
          0,
          0
        );
        gl.enableVertexAttribArray(location);
      }
    });

    this.tfManager.bind();

    PARTICLE_ATTRIBUTE_LIST.forEach((attrName, index) => {
      const particleBuffer = buffers[attrName];
      const outputBuffer = particleBuffer.getOutputBuffer();
      this.tfManager.bindOutputBuffer(index, outputBuffer);
    });

    this.tfManager.beginPoints();
    gl.drawArrays(gl.POINTS, 0, this.maxParticles);
    this.tfManager.end();

    this.tfManager.unbind();
    this.updateVAO.unbind();

    gl.disable(gl.RASTERIZER_DISCARD);

    this.particleBuffer.swap();
  }

  render(
    projectionMatrix: Float32Array,
    viewMatrix: Float32Array,
    options: {
      particleSizeScale?: number;
      maxSize?: number;
      useCircularShape?: boolean;
    } = {}
  ): void {
    if (!this.isInitialized || !this.renderProgram) {
      return;
    }

    const gl = this.gl;
    const buffers = this.particleBuffer.getBuffers();

    const {
      particleSizeScale = 1.0,
      maxSize = 256.0,
      useCircularShape = true,
    } = options;

    gl.enable(gl.BLEND);
    
    switch (this.blendMode) {
      case 'additive':
        gl.blendFunc(gl.ONE, gl.ONE);
        break;
      case 'additiveAlpha':
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        break;
      case 'alpha':
      default:
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        break;
    }

    this.renderProgram.use();

    this.renderProgram.setMat4('u_projection', projectionMatrix);
    this.renderProgram.setMat4('u_view', viewMatrix);
    this.renderProgram.setFloat('u_particleSizeScale', particleSizeScale);
    this.renderProgram.setFloat('u_maxSize', maxSize);
    this.renderProgram.setInt('u_useCircularShape', useCircularShape ? 1 : 0);
    
    this.renderProgram.setVec4('u_colorStart', this.colorStart[0], this.colorStart[1], this.colorStart[2], this.colorStart[3]);
    this.renderProgram.setVec4('u_colorEnd', this.colorEnd[0], this.colorEnd[1], this.colorEnd[2], this.colorEnd[3]);
    this.renderProgram.setInt('u_useColorGradient', this.useColorGradient ? 1 : 0);
    
    this.renderProgram.setInt('u_useTexture', this.useTexture ? 1 : 0);
    if (this.useTexture && this.texture && this.texture.isReady()) {
      this.texture.bind(0);
      this.renderProgram.setInt('u_particleTexture', 0);
    }

    this.renderVAO.bind();

    const renderAttributes: ParticleAttributeName[] = ['position', 'life', 'size', 'rotation', 'color'];

    renderAttributes.forEach((attrName) => {
      const particleBuffer = buffers[attrName];
      const attr = PARTICLE_ATTRIBUTES[attrName];
      const location = this.renderProgram!.getAttributeLocation(attr.name);

      if (location >= 0) {
        const inputBuffer = particleBuffer.getInputBuffer();
        inputBuffer.bind();
        gl.vertexAttribPointer(
          location,
          attr.componentCount,
          gl.FLOAT,
          false,
          0,
          0
        );
        gl.enableVertexAttribArray(location);
      }
    });

    gl.drawArrays(gl.POINTS, 0, this.maxParticles);

    this.renderVAO.unbind();
    
    if (this.useTexture && this.texture) {
      this.texture.unbind();
    }

    this.renderProgram.unuse();

    gl.disable(gl.BLEND);
  }

  setParticle(
    index: number,
    data: {
      position?: number[];
      velocity?: number[];
      life?: number[];
      size?: number[];
      rotation?: number[];
      rotationSpeed?: number[];
      color?: number[];
    }
  ): void {
    this.particleBuffer.setParticle(index, data);
  }

  setGravity(x: number, y: number, z: number): void {
    this.gravity = { x, y, z };
  }

  setDrag(drag: number): void {
    this.drag = drag;
  }

  setColorGradient(
    startColor: [number, number, number, number],
    endColor: [number, number, number, number],
    enable: boolean = true
  ): void {
    this.colorStart = startColor;
    this.colorEnd = endColor;
    this.useColorGradient = enable;
  }

  enableColorGradient(enable: boolean = true): void {
    this.useColorGradient = enable;
  }

  setTexture(texture: Texture | null, enable: boolean = true): void {
    if (this.texture && this.texture !== texture) {
      this.texture.delete();
    }
    this.texture = texture;
    this.useTexture = enable && texture !== null && texture.isReady();
  }

  enableTexture(enable: boolean = true): void {
    this.useTexture = enable && this.texture !== null && this.texture.isReady();
  }

  getTexture(): Texture | null {
    return this.texture;
  }

  setBlendMode(mode: BlendMode): void {
    this.blendMode = mode;
  }

  setGroundCollision(
    enabled: boolean = true,
    groundY: number = -2,
    restitution: number = 0.5,
    friction: number = 0.2
  ): void {
    this.useGroundCollision = enabled;
    this.groundY = groundY;
    this.groundRestitution = Math.max(0, Math.min(1, restitution));
    this.groundFriction = Math.max(0, Math.min(1, friction));
  }

  enableGroundCollision(enable: boolean = true): void {
    this.useGroundCollision = enable;
  }

  setEmitter(emitter: Emitter | null): void {
    this.emitter = emitter;
    if (emitter) {
      emitter.reset();
    }
  }

  getEmitter(): Emitter | null {
    return this.emitter;
  }

  emitParticles(count: number): number {
    if (count <= 0) return 0;
    
    const actualCount = Math.min(count, this.maxParticles);
    
    for (let i = 0; i < actualCount; i++) {
      const particleIndex = this.nextParticleIndex;
      const globalIndex = this.emissionCounter + i;
      
      let state: ParticleInitialState;
      
      if (this.emitter) {
        state = this.emitter.getParticleInitialState(globalIndex, actualCount);
      } else {
        state = {
          position: [0, 0, 0],
          velocity: [0, 0, 0],
          life: [0, 1],
          size: 10,
          rotation: 0,
          rotationSpeed: 0,
          color: [1, 1, 1, 1],
        };
      }
      
      this.particleBuffer.setParticle(particleIndex, {
        position: state.position,
        velocity: state.velocity,
        life: state.life,
        size: [state.size],
        rotation: [state.rotation],
        rotationSpeed: [state.rotationSpeed],
        color: state.color,
      });
      
      this.nextParticleIndex = (this.nextParticleIndex + 1) % this.maxParticles;
    }
    
    this.emissionCounter += actualCount;
    
    return actualCount;
  }

  spawnParticle(state: ParticleInitialState): void {
    this.particleBuffer.setParticle(this.nextParticleIndex, {
      position: state.position,
      velocity: state.velocity,
      life: state.life,
      size: [state.size],
      rotation: [state.rotation],
      rotationSpeed: [state.rotationSpeed],
      color: state.color,
    });
    this.nextParticleIndex = (this.nextParticleIndex + 1) % this.maxParticles;
  }

  getParticleBuffer(): ParticleSystemBuffer {
    return this.particleBuffer;
  }

  getMaxParticles(): number {
    return this.maxParticles;
  }

  delete(): void {
    this.particleBuffer.delete();

    if (this.updateProgram) {
      this.updateProgram.delete();
    }

    if (this.renderProgram) {
      this.renderProgram.delete();
    }

    if (this.texture) {
      this.texture.delete();
      this.texture = null;
    }

    this.tfManager.delete();
    this.updateVAO.delete();
    this.renderVAO.delete();

    this.isInitialized = false;
  }
}
