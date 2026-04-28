#version 300 es

precision highp float;

in vec4 v_color;
in float v_rotation;
in float v_lifeRatio;

out vec4 outColor;

uniform bool u_useCircularShape;
uniform float u_alphaFadeStart;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);

    if (u_useCircularShape) {
        float dist = length(coord);
        if (dist > 0.5) {
            discard;
        }
    }

    float alpha = v_color.a;

    if (v_lifeRatio > u_alphaFadeStart) {
        float fadeFactor = 1.0 - (v_lifeRatio - u_alphaFadeStart) / (1.0 - u_alphaFadeStart);
        alpha *= fadeFactor;
    }

    if (v_lifeRatio < 0.1) {
        alpha *= v_lifeRatio * 10.0;
    }

    outColor = vec4(v_color.rgb, alpha);
}
