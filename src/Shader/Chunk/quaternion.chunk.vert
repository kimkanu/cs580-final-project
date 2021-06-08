#ifndef QUATERNION
#define QUATERNION

mat3 quatToMat3( vec4 q ) {
  return mat3(
    // column 0
    1.0 - 2.0 * (q.y * q.y + q.z * q.z),
    2.0 * (q.x * q.y + q.w * q.z),
    2.0 * (q.x * q.z - q.w * q.y),
    // column 1
    2.0 * (q.x * q.y - q.w * q.z),
    1.0 - 2.0 * (q.x * q.x + q.z * q.z),
    2.0 * (q.y * q.z + q.w * q.x),
    // column 2
    2.0 * (q.x * q.z + q.w * q.y),
    2.0 * (q.y * q.z - q.w * q.x),
    1.0 - 2.0 * (q.x * q.x + q.y * q.y)
  );
}

mat4 quatToMat4( vec4 q ) {
  return mat4(
    // column 0
    1.0 - 2.0 * (q.y * q.y + q.z * q.z),
    2.0 * (q.x * q.y + q.w * q.z),
    2.0 * (q.x * q.z - q.w * q.y),
    0.0,
    // column 1
    2.0 * (q.x * q.y - q.w * q.z),
    1.0 - 2.0 * (q.x * q.x + q.z * q.z),
    2.0 * (q.y * q.z + q.w * q.x),
    0.0,
    // column 2
    2.0 * (q.x * q.z + q.w * q.y),
    2.0 * (q.y * q.z - q.w * q.x),
    1.0 - 2.0 * (q.x * q.x + q.y * q.y),
    0.0,
    // column 3
    0.0,
    0.0,
    0.0,
    1.0
  );
}

float quatAntipodality( vec4 q1, vec4 q2 ) {
  return dot( q1, q2 ) < 0.0 ? -1.0 : 1.0;
}

// Do the quaternion linear interpolation (QLERP) for 4 quaternions
vec4 getQLERP(
  vec4 weights,
  vec4 quatX,
  vec4 quatY,
  vec4 quatZ,
  vec4 quatW
) {
  vec4 linearBlending = weights.x * quatX
      + weights.y * quatY * quatAntipodality( quatX, quatY )
      + weights.z * quatZ * quatAntipodality( quatX, quatZ )
      + weights.w * quatW * quatAntipodality( quatX, quatW );
  return linearBlending / length( linearBlending );
}

#endif