export type TextureMagFilter = 'nearest' | 'linear';
export type TextureMinFilter = 'nearest' | 'linear' | 'nearestMipmapNearest' | 'linearMipmapNearest' | 'nearestMipmapLinear' | 'linearMipmapLinear';
export type TextureWrapMode = 'repeat' | 'clampToEdge' | 'mirroredRepeat';

export interface TextureConfig {
  magFilter?: TextureMagFilter;
  minFilter?: TextureMinFilter;
  wrapS?: TextureWrapMode;
  wrapT?: TextureWrapMode;
  generateMipmaps?: boolean;
}

const DEFAULT_CONFIG: Required<TextureConfig> = {
  magFilter: 'linear',
  minFilter: 'linearMipmapLinear',
  wrapS: 'clampToEdge',
  wrapT: 'clampToEdge',
  generateMipmaps: true,
};

export class Texture {
  private gl: WebGL2RenderingContext;
  private texture: WebGLTexture | null = null;
  private width: number = 0;
  private height: number = 0;
  private config: Required<TextureConfig>;
  private isInitialized: boolean = false;

  constructor(gl: WebGL2RenderingContext, config: TextureConfig = {}) {
    this.gl = gl;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static createDefaultDot(gl: WebGL2RenderingContext, size: number = 64): Texture {
    const texture = new Texture(gl, {
      magFilter: 'linear',
      minFilter: 'linear',
      wrapS: 'clampToEdge',
      wrapT: 'clampToEdge',
      generateMipmaps: false,
    });
    
    const data = new Uint8Array(size * size * 4);
    const center = size / 2;
    const radius = size / 2 - 2;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const dx = x - center;
        const dy = y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= radius) {
          const edgeSoftness = 2;
          const alpha = dist > radius - edgeSoftness
            ? 1.0 - (dist - (radius - edgeSoftness)) / edgeSoftness
            : 1.0;
          
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = Math.floor(alpha * 255);
        } else {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        }
      }
    }
    
    texture.setData(data, size, size);
    return texture;
  }

  static createDefaultCircle(gl: WebGL2RenderingContext, size: number = 64): Texture {
    return Texture.createDefaultDot(gl, size);
  }

  static createDefaultSquare(gl: WebGL2RenderingContext, size: number = 64): Texture {
    const texture = new Texture(gl, {
      magFilter: 'linear',
      minFilter: 'linear',
      wrapS: 'clampToEdge',
      wrapT: 'clampToEdge',
      generateMipmaps: false,
    });
    
    const data = new Uint8Array(size * size * 4);
    
    for (let i = 0; i < size * size; i++) {
      const idx = i * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
    
    texture.setData(data, size, size);
    return texture;
  }

  static createDefaultGlow(gl: WebGL2RenderingContext, size: number = 64): Texture {
    const texture = new Texture(gl, {
      magFilter: 'linear',
      minFilter: 'linear',
      wrapS: 'clampToEdge',
      wrapT: 'clampToEdge',
      generateMipmaps: false,
    });
    
    const data = new Uint8Array(size * size * 4);
    const center = size / 2;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const dx = x - center;
        const dy = y - center;
        const dist = Math.sqrt(dx * dx + dy * dy) / (size / 2);
        
        const alpha = Math.max(0, 1.0 - dist);
        const glowAlpha = alpha * alpha;
        
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = Math.floor(glowAlpha * 255);
      }
    }
    
    texture.setData(data, size, size);
    return texture;
  }

  private createTexture(): void {
    if (this.texture) {
      return;
    }
    
    this.texture = this.gl.createTexture();
    if (!this.texture) {
      throw new Error('Failed to create WebGL texture');
    }
  }

  setData(data: ArrayBufferView, width: number, height: number): void {
    this.createTexture();
    
    const gl = this.gl;
    
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data
    );
    
    this.applyTextureParameters();
    
    if (this.config.generateMipmaps) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    this.width = width;
    this.height = height;
    this.isInitialized = true;
  }

  private applyTextureParameters(): void {
    const gl = this.gl;
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.getWrapMode(this.config.wrapS));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.getWrapMode(this.config.wrapT));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.getMinFilter(this.config.minFilter));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.getMagFilter(this.config.magFilter));
  }

  private getWrapMode(mode: TextureWrapMode): number {
    const gl = this.gl;
    switch (mode) {
      case 'repeat': return gl.REPEAT;
      case 'mirroredRepeat': return gl.MIRRORED_REPEAT;
      case 'clampToEdge':
      default: return gl.CLAMP_TO_EDGE;
    }
  }

  private getMinFilter(filter: TextureMinFilter): number {
    const gl = this.gl;
    switch (filter) {
      case 'nearest': return gl.NEAREST;
      case 'linear': return gl.LINEAR;
      case 'nearestMipmapNearest': return gl.NEAREST_MIPMAP_NEAREST;
      case 'linearMipmapNearest': return gl.LINEAR_MIPMAP_NEAREST;
      case 'nearestMipmapLinear': return gl.NEAREST_MIPMAP_LINEAR;
      case 'linearMipmapLinear':
      default: return gl.LINEAR_MIPMAP_LINEAR;
    }
  }

  private getMagFilter(filter: TextureMagFilter): number {
    const gl = this.gl;
    switch (filter) {
      case 'nearest': return gl.NEAREST;
      case 'linear':
      default: return gl.LINEAR;
    }
  }

  bind(unit: number = 0): void {
    if (!this.texture || !this.isInitialized) {
      return;
    }
    
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  unbind(): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getTexture(): WebGLTexture | null {
    return this.texture;
  }

  isReady(): boolean {
    return this.isInitialized && this.texture !== null;
  }

  delete(): void {
    if (this.texture) {
      this.gl.deleteTexture(this.texture);
      this.texture = null;
    }
    this.isInitialized = false;
  }
}
