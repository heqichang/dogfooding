import { Buffer } from './Buffer';
import { ParticleBuffer } from './ParticleBuffer';
import { ParticleAttributeName, PARTICLE_ATTRIBUTE_LIST } from './ParticleAttribute';

export interface TransformFeedbackConfig {
  varyings: string[];
  bufferMode: 'interleaved' | 'separate';
}

export interface TransformFeedbackBuffers {
  inputBuffers: Record<ParticleAttributeName, Buffer>;
  outputBuffers: Record<ParticleAttributeName, Buffer>;
}

export class TransformFeedbackManager {
  private gl: WebGL2RenderingContext;
  private tf: WebGLTransformFeedback | null = null;
  private varyings: string[] = [];
  private bufferMode: 'interleaved' | 'separate' = 'separate';
  private isBound: boolean = false;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.createTransformFeedback();
  }

  private createTransformFeedback(): void {
    const gl = this.gl;
    this.tf = gl.createTransformFeedback();
    if (!this.tf) {
      throw new Error('无法创建 Transform Feedback 对象');
    }
  }

  configure(config: TransformFeedbackConfig): void {
    this.varyings = [...config.varyings];
    this.bufferMode = config.bufferMode;
  }

  getVaryings(): string[] {
    return [...this.varyings];
  }

  getBufferMode(): 'interleaved' | 'separate' {
    return this.bufferMode;
  }

  bind(): void {
    const gl = this.gl;
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf);
    this.isBound = true;
  }

  unbind(): void {
    const gl = this.gl;
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    this.isBound = false;
  }

  bindOutputBuffer(index: number, buffer: Buffer): void {
    this.ensureBound();
    const gl = this.gl;
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, index, buffer.getBuffer());
  }

  bindOutputBuffers(buffers: Buffer[]): void {
    this.ensureBound();
    const gl = this.gl;
    buffers.forEach((buffer, index) => {
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, index, buffer.getBuffer());
    });
  }

  bindOutputBuffersFromParticleBuffers(
    particleBuffers: Record<ParticleAttributeName, ParticleBuffer>,
    attributeOrder: ParticleAttributeName[] = PARTICLE_ATTRIBUTE_LIST
  ): void {
    this.ensureBound();
    const gl = this.gl;

    attributeOrder.forEach((attrName, index) => {
      const particleBuffer = particleBuffers[attrName];
      if (particleBuffer) {
        const outputBuffer = particleBuffer.getOutputBuffer();
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, index, outputBuffer.getBuffer());
      }
    });
  }

  unbindOutputBuffer(index: number): void {
    const gl = this.gl;
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, index, null);
  }

  unbindAllOutputBuffers(count: number): void {
    const gl = this.gl;
    for (let i = 0; i < count; i++) {
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, i, null);
    }
  }

  begin(primitiveMode: number): void {
    this.ensureBound();
    const gl = this.gl;
    gl.beginTransformFeedback(primitiveMode);
  }

  end(): void {
    const gl = this.gl;
    gl.endTransformFeedback();
  }

  beginPoints(): void {
    this.begin(this.gl.POINTS);
  }

  executeUpdate(
    updateFunc: () => void,
    primitiveMode: number = this.gl.POINTS
  ): void {
    const gl = this.gl;

    gl.enable(gl.RASTERIZER_DISCARD);

    this.bind();
    this.begin(primitiveMode);

    try {
      updateFunc();
    } finally {
      this.end();
      this.unbind();
      gl.disable(gl.RASTERIZER_DISCARD);
    }
  }

  private ensureBound(): void {
    if (!this.isBound) {
      throw new Error('Transform Feedback 未绑定，请先调用 bind()');
    }
  }

  getTransformFeedback(): WebGLTransformFeedback {
    if (!this.tf) {
      throw new Error('Transform Feedback 对象已被删除');
    }
    return this.tf;
  }

  delete(): void {
    if (this.tf) {
      this.gl.deleteTransformFeedback(this.tf);
      this.tf = null;
    }
    this.isBound = false;
    this.varyings = [];
  }
}

export function getTransformFeedbackVaryingNames(
  attributeNames: ParticleAttributeName[] = PARTICLE_ATTRIBUTE_LIST
): string[] {
  const varyingMap: Record<ParticleAttributeName, string> = {
    position: 'v_position',
    velocity: 'v_velocity',
    life: 'v_life',
    size: 'v_size',
    rotation: 'v_rotation',
    rotationSpeed: 'v_rotationSpeed',
    color: 'v_color',
  };

  return attributeNames.map((name) => varyingMap[name] || '');
}
