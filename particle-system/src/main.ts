import './style.css';
import {
  WebGLContext,
  RenderLoop,
  validateMemoryCalculation,
  formatBytes,
  getTransformFeedbackVaryingNames,
  ParticleUpdateSystem,
} from './core';
import {
  EmitterFactory,
} from './emitters';

const particleUpdateVertexShader = `#version 300 es

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

const particleRenderVertexShader = `#version 300 es

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

const particleRenderFragmentShader = `#version 300 es

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

const PARTICLE_CONFIG = {
  maxParticles: 10000,
  useDoubleBuffer: true,
  emissionRate: 500,
};

function createOrthographicMatrix(
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

function createLookAtMatrix(
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

async function runTransformFeedbackDemo() {
  console.log('=== Transform Feedback 粒子系统演示 ===');

  try {
    const canvas = document.getElementById('particleCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('未找到 canvas 元素');
    }

    const webGLContext = new WebGLContext(canvas);
    const gl = webGLContext.getContext() as WebGL2RenderingContext;

    if (!webGLContext.isWebGL2()) {
      throw new Error('Transform Feedback 需要 WebGL 2.0 支持');
    }

    console.log('  WebGL 版本: 2.0');
    console.log('  ✅ WebGL 上下文创建成功');

    webGLContext.resize(window.innerWidth, window.innerHeight);

    console.log('\n=== 测试 P0: 内存计算验证 ===');
    const memoryValidation = validateMemoryCalculation();
    console.log(`  单粒子 float 数: ${memoryValidation.perParticleFloats}`);
    console.log(`  单粒子字节数: ${memoryValidation.perParticleBytes} bytes`);
    console.log(`  ${PARTICLE_CONFIG.maxParticles} 粒子单缓冲: ${formatBytes(memoryValidation.oneHundredThousandBytes * (PARTICLE_CONFIG.maxParticles / 100000))}`);

    if (memoryValidation.isValid) {
      console.log('  ✅ 内存计算验证通过');
    }

    console.log('\n=== 测试 P1: Transform Feedback 配置 ===');
    const varyings = getTransformFeedbackVaryingNames();
    console.log('  Transform Feedback Varyings:');
    varyings.forEach((v, i) => console.log(`    ${i + 1}. ${v}`));
    console.log('  ✅ Transform Feedback 配置完成');

    console.log('\n=== 测试 P2: 创建粒子更新系统 ===');
    const particleSystem = new ParticleUpdateSystem(gl, {
      maxParticles: PARTICLE_CONFIG.maxParticles,
      gravity: { x: 0, y: -5, z: 0 },
      drag: 0.1,
    });

    console.log(`  最大粒子数: ${particleSystem.getMaxParticles()}`);
    console.log('  ✅ 粒子更新系统创建成功');

    console.log('\n=== 测试 P3: 初始化着色器 ===');
    particleSystem.initialize(
      particleUpdateVertexShader,
      particleRenderVertexShader,
      particleRenderFragmentShader
    );
    console.log('  ✅ 着色器初始化成功');

    console.log('\n=== 测试 P4: 创建并设置发射器 ===');
    const emitter = EmitterFactory.createPoint({
      position: [0, 0, 0],
      direction: [0, 1, 0],
      emissionRate: PARTICLE_CONFIG.emissionRate,
      speedRange: { min: 3, max: 6 },
      lifeRange: { min: 3, max: 5 },
      sizeRange: { min: 15, max: 25 },
      emitDirection: 'omni',
      spreadAngle: Math.PI * 2,
      colorStart: [1, 1, 0.5, 1],
      colorEnd: [1, 0.3, 0, 0.8],
    });

    particleSystem.setEmitter(emitter);
    console.log('  ✅ 点发射器创建并设置成功');

    console.log('\n=== 测试 P4.2: 设置颜色渐变 ===');
    particleSystem.setColorGradient(
      [1, 1, 0.8, 1],
      [1, 0.3, 0, 0.8],
      true
    );
    particleSystem.setBlendMode('additiveAlpha');
    console.log('  ✅ 颜色渐变设置成功（火焰效果：黄->红）');

    console.log('\n=== 测试 P4.3: 启用地面碰撞 ===');
    particleSystem.setGroundCollision(
      true,
      -1.5,
      0.3,
      0.5
    );
    console.log('  ✅ 地面碰撞启用成功');

    console.log('\n=== 测试 P4.1: 初始爆发发射 ===');
    particleSystem.emitParticles(500);
    console.log('  ✅ 初始爆发发射完成');

    const viewMatrix = createLookAtMatrix(0, 2, 5, 0, 0, 0, 0, 1, 0);

    const renderLoop = new RenderLoop();
    let frameCount = 0;

    renderLoop.addCallback((deltaTime: number, elapsedTime: number) => {
      frameCount++;

      const clampedDeltaTime = Math.min(deltaTime, 0.05);

      particleSystem.update({
        deltaTime: clampedDeltaTime,
        elapsedTime: elapsedTime,
      });

      webGLContext.clear([0.05, 0.05, 0.1, 1.0]);

      const aspect = webGLContext.getActualWidth() / webGLContext.getActualHeight();
      const orthoHeight = 4;
      const orthoWidth = orthoHeight * aspect;
      const proj = createOrthographicMatrix(-orthoWidth, orthoWidth, -orthoHeight, orthoHeight, 0.1, 100);

      particleSystem.render(
        proj,
        viewMatrix,
        {
          particleSizeScale: 1.5,
          maxSize: 200.0,
          useCircularShape: true,
        }
      );

      if (frameCount % 300 === 0) {
        const stats = renderLoop.getFPSStats();
        console.log(`  运行中 - FPS: ${stats.fps.toFixed(1)}, 帧时间: ${stats.frameTimeMs.toFixed(2)}ms`);
      }
    });

    renderLoop.start();
    console.log('  ✅ 渲染循环启动成功');

    const appDiv = document.querySelector<HTMLDivElement>('#app')!;
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      min-width: 180px;
    `;
    appDiv.appendChild(statsDiv);

    setInterval(() => {
      const stats = renderLoop.getFPSStats();
      statsDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px; color: #0ff;">GPU 粒子系统</div>
        <div>FPS: ${stats.fps.toFixed(1)}</div>
        <div>平均 FPS: ${stats.averageFPS.toFixed(1)}</div>
        <div>帧时间: ${stats.frameTimeMs.toFixed(2)}ms</div>
        <div style="margin-top: 8px; color: #888;">粒子数: ${PARTICLE_CONFIG.maxParticles}</div>
        <div style="color: #888;">发射器: 点发射器</div>
        <div style="color: #888;">发射速率: ${PARTICLE_CONFIG.emissionRate}/秒</div>
      `;
    }, 500);

    window.addEventListener('resize', () => {
      webGLContext.resize(window.innerWidth, window.innerHeight);
    });

    console.log('\n=== 演示启动成功 ===');
    console.log('观察浏览器中的粒子效果。');
    console.log('粒子使用 GPU Transform Feedback 进行更新。');
    console.log('使用点发射器进行连续发射。');

  } catch (error) {
    console.error('❌ 演示失败:', error);

    const appDiv = document.querySelector<HTMLDivElement>('#app');
    if (appDiv) {
      appDiv.innerHTML += `<div style="color: red; margin-top: 20px; padding: 20px; background: rgba(255,0,0,0.1); border-radius: 8px;">
        <h3>演示失败</h3>
        <pre style="white-space: pre-wrap; font-size: 12px;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>`;
    }

    throw error;
  }
}

runTransformFeedbackDemo().catch(console.error);
