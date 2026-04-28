export const GPURandomShaderFunctions = `
uint hash(uint x) {
    x += (x << 10u);
    x ^= (x >>  6u);
    x += (x <<  3u);
    x ^= (x >> 11u);
    x += (x << 15u);
    return x;
}

uint hash(uvec2 v) {
    return hash(v.x ^ hash(v.y));
}

uint hash(uvec3 v) {
    return hash(v.x ^ hash(v.y) ^ hash(v.z));
}

uint hash(uvec4 v) {
    return hash(v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w));
}

float floatConstruct(uint m) {
    const uint ieeeMantissa = 0x007FFFFFu;
    const uint ieeeOne      = 0x3F800000u;

    m &= ieeeMantissa;
    m |= ieeeOne;

    float f = uintBitsToFloat(m);
    return f - 1.0;
}

float random(float x) {
    return floatConstruct(hash(floatBitsToUint(x)));
}

float random(vec2 v) {
    return floatConstruct(hash(floatBitsToUint(v)));
}

float random(vec3 v) {
    return floatConstruct(hash(floatBitsToUint(v)));
}

float random(vec4 v) {
    return floatConstruct(hash(floatBitsToUint(v)));
}

vec2 random2(float seed) {
    float a = random(seed);
    float b = random(seed + 1.0);
    return vec2(a, b);
}

vec2 random2(vec2 seed) {
    float a = random(seed);
    float b = random(seed + vec2(1.0, 2.0));
    return vec2(a, b);
}

vec3 random3(float seed) {
    float a = random(seed);
    float b = random(seed + 1.0);
    float c = random(seed + 2.0);
    return vec3(a, b, c);
}

vec3 random3(vec3 seed) {
    float a = random(seed);
    float b = random(seed + vec3(1.0, 2.0, 3.0));
    float c = random(seed + vec3(4.0, 5.0, 6.0));
    return vec3(a, b, c);
}

float randomRange(float seed, float minVal, float maxVal) {
    return minVal + random(seed) * (maxVal - minVal);
}

vec2 randomRange2(vec2 seed, vec2 minVal, vec2 maxVal) {
    return minVal + random2(seed) * (maxVal - minVal);
}

vec3 randomRange3(vec3 seed, vec3 minVal, vec3 maxVal) {
    return minVal + random3(seed) * (maxVal - minVal);
}

vec3 randomDirection(float seed) {
    float theta = random(seed) * 6.28318530718;
    float phi = acos(2.0 * random(seed + 1.0) - 1.0);
    
    float sinPhi = sin(phi);
    return vec3(
        sinPhi * cos(theta),
        sinPhi * sin(theta),
        cos(phi)
    );
}

vec2 randomDirection2D(float seed) {
    float angle = random(seed) * 6.28318530718;
    return vec2(cos(angle), sin(angle));
}

vec3 randomDirectionInCone(float seed, vec3 direction, float angle) {
    vec3 dir = normalize(direction);
    vec3 up = abs(dir.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 right = normalize(cross(up, dir));
    up = cross(dir, right);
    
    float u1 = random(seed);
    float u2 = random(seed + 1.0);
    
    float cosAngle = cos(angle);
    float z = u1 * (1.0 - cosAngle) + cosAngle;
    float sqrtZ = sqrt(1.0 - z * z);
    float azimuth = 6.28318530718 * u2;
    
    vec3 randomDir = vec3(
        sqrtZ * cos(azimuth),
        sqrtZ * sin(azimuth),
        z
    );
    
    return randomDir.x * right + randomDir.y * up + randomDir.z * dir;
}
`;

export const GPURandomUniforms = `
uniform float u_seed;
uniform float u_time;
`;

export function createGPURandomShaderCode(includeFunctions: boolean = true): string {
  let code = '';
  
  if (includeFunctions) {
    code += GPURandomShaderFunctions;
  }
  
  return code;
}

export function injectGPURandomIntoShader(shaderCode: string): string {
  const versionMatch = shaderCode.match(/^#version\s+\d+\s+es\s*$/m);
  
  if (versionMatch) {
    const versionLine = versionMatch[0];
    const insertIndex = shaderCode.indexOf(versionLine) + versionLine.length;
    
    return (
      shaderCode.slice(0, insertIndex) +
      '\n\n' +
      GPURandomShaderFunctions +
      '\n' +
      shaderCode.slice(insertIndex)
    );
  }
  
  return GPURandomShaderFunctions + '\n' + shaderCode;
}
