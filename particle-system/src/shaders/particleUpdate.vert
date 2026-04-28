#version 300 es

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

void main() {
    float age = a_life.x;
    float maxLife = a_life.y;

    float newAge = age + u_deltaTime;
    bool isAlive = newAge < maxLife;

    if (isAlive) {
        vec3 velocity = a_velocity;
        velocity += u_gravity * u_deltaTime;
        velocity *= 1.0 - u_drag * u_deltaTime;

        vec3 position = a_position + velocity * u_deltaTime;

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
        v_life = vec2(maxLife, maxLife);
        v_size = a_size;
        v_rotation = a_rotation;
        v_rotationSpeed = a_rotationSpeed;
        v_color = a_color;
    }
}
