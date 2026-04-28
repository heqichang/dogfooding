export interface Plane {
  type: 'plane';
  normal: [number, number, number];
  distance: number;
  restitution: number;
  friction: number;
}

export interface Sphere {
  type: 'sphere';
  center: [number, number, number];
  radius: number;
  restitution: number;
  friction: number;
}

export type Collider = Plane | Sphere;

export interface CollisionConfig {
  enableCollision: boolean;
  colliders: Collider[];
}

export function createPlane(
  normal: [number, number, number],
  distance: number,
  restitution: number = 0.5,
  friction: number = 0.1
): Plane {
  const len = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
  const invLen = len > 0 ? 1 / len : 1;
  
  return {
    type: 'plane',
    normal: [
      normal[0] * invLen,
      normal[1] * invLen,
      normal[2] * invLen,
    ],
    distance: distance * invLen,
    restitution: Math.max(0, Math.min(1, restitution)),
    friction: Math.max(0, Math.min(1, friction)),
  };
}

export function createGroundPlane(
  y: number = 0,
  restitution: number = 0.5,
  friction: number = 0.2
): Plane {
  return createPlane([0, 1, 0], -y, restitution, friction);
}

export function createSphere(
  center: [number, number, number],
  radius: number,
  restitution: number = 0.6,
  friction: number = 0.05
): Sphere {
  return {
    type: 'sphere',
    center: [...center] as [number, number, number],
    radius: Math.max(0, radius),
    restitution: Math.max(0, Math.min(1, restitution)),
    friction: Math.max(0, Math.min(1, friction)),
  };
}

export function getCollisionShaderCode(colliderCount: number): string {
  if (colliderCount === 0) {
    return '';
  }

  return `
struct Plane {
    vec3 normal;
    float distance;
    float restitution;
    float friction;
};

struct Sphere {
    vec3 center;
    float radius;
    float restitution;
    float friction;
};

uniform Plane u_planes[${Math.ceil(colliderCount / 2)}];
uniform Sphere u_spheres[${Math.ceil(colliderCount / 2)}];
uniform int u_planeCount;
uniform int u_sphereCount;
uniform bool u_useCollision;

vec3 resolvePlaneCollision(vec3 position, vec3 velocity, Plane plane) {
    float dist = dot(position, plane.normal) + plane.distance;
    
    if (dist < 0.0) {
        float velDotNormal = dot(velocity, plane.normal);
        
        if (velDotNormal < 0.0) {
            vec3 velNormal = plane.normal * velDotNormal;
            vec3 velTangent = velocity - velNormal;
            
            velNormal = -velNormal * plane.restitution;
            velTangent = velTangent * (1.0 - plane.friction);
            
            velocity = velNormal + velTangent;
        }
        
        position = position - plane.normal * (dist - 0.001);
    }
    
    return velocity;
}

vec3 resolveSphereCollision(vec3 position, vec3 velocity, Sphere sphere) {
    vec3 toCenter = position - sphere.center;
    float dist = length(toCenter);
    float combinedRadius = sphere.radius;
    
    if (dist < combinedRadius && dist > 0.001) {
        vec3 normal = toCenter / dist;
        float velDotNormal = dot(velocity, normal);
        
        if (velDotNormal < 0.0) {
            vec3 velNormal = normal * velDotNormal;
            vec3 velTangent = velocity - velNormal;
            
            velNormal = -velNormal * sphere.restitution;
            velTangent = velTangent * (1.0 - sphere.friction);
            
            velocity = velNormal + velTangent;
        }
        
        float overlap = combinedRadius - dist;
        position = position + normal * (overlap + 0.001);
    }
    
    return velocity;
}
`;
}
