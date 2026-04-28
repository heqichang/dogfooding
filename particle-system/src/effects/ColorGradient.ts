export interface ColorKeyframe {
  time: number;
  color: [number, number, number, number];
}

export interface AlphaKeyframe {
  time: number;
  alpha: number;
}

export class ColorGradient {
  private keyframes: ColorKeyframe[];
  private alphaKeyframes: AlphaKeyframe[];

  constructor(keyframes: ColorKeyframe[] = []) {
    this.keyframes = [...keyframes].sort((a, b) => a.time - b.time);
    this.alphaKeyframes = [];
  }

  static fromColors(
    startColor: [number, number, number, number],
    endColor: [number, number, number, number]
  ): ColorGradient {
    const gradient = new ColorGradient();
    gradient.addKeyframe(0, startColor);
    gradient.addKeyframe(1, endColor);
    return gradient;
  }

  static fromPreset(preset: ColorGradientPreset): ColorGradient {
    switch (preset) {
      case 'fire':
        return ColorGradient.fromColors([1, 1, 0.5, 1], [1, 0.2, 0, 0]);
      case 'smoke':
        return ColorGradient.fromColors([0.6, 0.6, 0.6, 0.8], [0.2, 0.2, 0.2, 0]);
      case 'explosion':
        return ColorGradient.fromColors([1, 1, 1, 1], [1, 0.5, 0, 0]);
      case 'rain':
        return ColorGradient.fromColors([0.7, 0.8, 1, 0.9], [0.4, 0.5, 0.8, 0]);
      case 'snow':
        return ColorGradient.fromColors([1, 1, 1, 1], [0.9, 0.95, 1, 0.5]);
      case 'spark':
        return ColorGradient.fromColors([1, 0.9, 0.6, 1], [1, 0.3, 0, 0]);
      default:
        return ColorGradient.fromColors([1, 1, 1, 1], [1, 1, 1, 0]);
    }
  }

  addKeyframe(time: number, color: [number, number, number, number]): void {
    const clampedTime = Math.max(0, Math.min(1, time));
    const index = this.keyframes.findIndex((k) => k.time === clampedTime);
    
    if (index >= 0) {
      this.keyframes[index].color = color;
    } else {
      this.keyframes.push({ time: clampedTime, color });
      this.keyframes.sort((a, b) => a.time - b.time);
    }
  }

  addAlphaKeyframe(time: number, alpha: number): void {
    const clampedTime = Math.max(0, Math.min(1, time));
    const index = this.alphaKeyframes.findIndex((k) => k.time === clampedTime);
    
    if (index >= 0) {
      this.alphaKeyframes[index].alpha = alpha;
    } else {
      this.alphaKeyframes.push({ time: clampedTime, alpha });
      this.alphaKeyframes.sort((a, b) => a.time - b.time);
    }
  }

  evaluate(t: number): [number, number, number, number] {
    const clampedT = Math.max(0, Math.min(1, t));

    if (this.keyframes.length === 0) {
      return [1, 1, 1, 1];
    }

    if (this.keyframes.length === 1) {
      return [...this.keyframes[0].color] as [number, number, number, number];
    }

    if (clampedT <= this.keyframes[0].time) {
      return [...this.keyframes[0].color] as [number, number, number, number];
    }

    if (clampedT >= this.keyframes[this.keyframes.length - 1].time) {
      return [...this.keyframes[this.keyframes.length - 1].color] as [number, number, number, number];
    }

    for (let i = 0; i < this.keyframes.length - 1; i++) {
      const k1 = this.keyframes[i];
      const k2 = this.keyframes[i + 1];
      
      if (clampedT >= k1.time && clampedT <= k2.time) {
        const t2 = (clampedT - k1.time) / (k2.time - k1.time);
        return this.lerpColor(k1.color, k2.color, t2);
      }
    }

    return [...this.keyframes[this.keyframes.length - 1].color] as [number, number, number, number];
  }

  evaluateAlpha(t: number): number {
    const clampedT = Math.max(0, Math.min(1, t));

    if (this.alphaKeyframes.length === 0) {
      const color = this.evaluate(clampedT);
      return color[3];
    }

    if (this.alphaKeyframes.length === 1) {
      return this.alphaKeyframes[0].alpha;
    }

    if (clampedT <= this.alphaKeyframes[0].time) {
      return this.alphaKeyframes[0].alpha;
    }

    if (clampedT >= this.alphaKeyframes[this.alphaKeyframes.length - 1].time) {
      return this.alphaKeyframes[this.alphaKeyframes.length - 1].alpha;
    }

    for (let i = 0; i < this.alphaKeyframes.length - 1; i++) {
      const k1 = this.alphaKeyframes[i];
      const k2 = this.alphaKeyframes[i + 1];
      
      if (clampedT >= k1.time && clampedT <= k2.time) {
        const t2 = (clampedT - k1.time) / (k2.time - k1.time);
        return k1.alpha + t2 * (k2.alpha - k1.alpha);
      }
    }

    return this.alphaKeyframes[this.alphaKeyframes.length - 1].alpha;
  }

  private lerpColor(
    c1: [number, number, number, number],
    c2: [number, number, number, number],
    t: number
  ): [number, number, number, number] {
    return [
      c1[0] + t * (c2[0] - c1[0]),
      c1[1] + t * (c2[1] - c1[1]),
      c1[2] + t * (c2[2] - c1[2]),
      c1[3] + t * (c2[3] - c1[3]),
    ];
  }

  getKeyframes(): ColorKeyframe[] {
    return [...this.keyframes];
  }

  getAlphaKeyframes(): AlphaKeyframe[] {
    return [...this.alphaKeyframes];
  }

  toUniformArray(sampleCount: number = 16): Float32Array {
    const array = new Float32Array(sampleCount * 4);
    
    for (let i = 0; i < sampleCount; i++) {
      const t = i / (sampleCount - 1);
      const color = this.evaluate(t);
      const alpha = this.evaluateAlpha(t);
      
      array[i * 4] = color[0];
      array[i * 4 + 1] = color[1];
      array[i * 4 + 2] = color[2];
      array[i * 4 + 3] = alpha;
    }
    
    return array;
  }

  clone(): ColorGradient {
    const clone = new ColorGradient(this.keyframes);
    clone.alphaKeyframes = [...this.alphaKeyframes];
    return clone;
  }
}

export type ColorGradientPreset = 
  | 'fire'
  | 'smoke'
  | 'explosion'
  | 'rain'
  | 'snow'
  | 'spark';
