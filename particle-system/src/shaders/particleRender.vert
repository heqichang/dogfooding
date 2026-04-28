#version 300 es

precision highp float;

in vec3 a_position;
in vec2 a_life;
in float a_size;
in float a_rotation;
in vec4 a_color;

out vec4 v_color;
out float v_rotation;
out float v_lifeRatio;
out vec4 v_initialColor;

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
    
    v_initialColor = a_color;
    v_rotation = a_rotation;
}
