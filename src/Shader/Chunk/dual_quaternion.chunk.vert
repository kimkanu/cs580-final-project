#ifndef DUAL_QUATERNION
#define DUAL_QUATERNION

#include <quaternion>

struct DualQuat
{
  vec4 rot;
  vec4 transl;
};

float dualQuatAntipodality( DualQuat dq1, DualQuat dq2 ) {
  return quatAntipodality( dq1.rot, dq2.rot );
}

// Do the dual quaternion linear blending for 4 DQs
// and return the corresponding mat4 (instead of a DQ)
// which is more efficient
mat4 getDLBMat4(
  vec4 weights,
  DualQuat dqX,
  DualQuat dqY,
  DualQuat dqZ,
  DualQuat dqW
) {
  // b̂ in the paper
  DualQuat linearBlending;
  linearBlending.rot = weights.x * dqX.rot
      + weights.y * dqY.rot * dualQuatAntipodality( dqX, dqY )
      + weights.z * dqZ.rot * dualQuatAntipodality( dqX, dqZ )
      + weights.w * dqW.rot * dualQuatAntipodality( dqX, dqW );
  linearBlending.transl = weights.x * dqX.transl
      + weights.y * dqY.transl * dualQuatAntipodality( dqX, dqY )
      + weights.z * dqZ.transl * dualQuatAntipodality( dqX, dqZ )
      + weights.w * dqW.transl * dualQuatAntipodality( dqX, dqW );

  float linearBlendingNorm = length( linearBlending.rot );
  // c₀ in the paper
  vec4 r = linearBlending.rot / linearBlendingNorm;
  // c_ε in the paper
  vec4 e = linearBlending.transl / linearBlendingNorm;

  return mat4(
    // column 0
    1.0 - 2.0 * (r.y * r.y + r.z * r.z),
    2.0 * (r.x * r.y + r.w * r.z),
    2.0 * (r.x * r.z - r.w * r.y),
    0.0,
    // column 1
    2.0 * (r.x * r.y - r.w * r.z),
    1.0 - 2.0 * (r.x * r.x + r.z * r.z),
    2.0 * (r.y * r.z + r.w * r.x),
    0.0,
    // column 2
    2.0 * (r.x * r.z + r.w * r.y),
    2.0 * (r.y * r.z - r.w * r.x),
    1.0 - 2.0 * (r.x * r.x + r.y * r.y),
    0.0,
    // column 3
    2.0 * (-e.w * r.x + e.x * r.w - e.y * r.z + e.z * r.y),
    2.0 * (-e.w * r.y + e.x * r.z + e.y * r.w - e.z * r.x),
    2.0 * (-e.w * r.z - e.x * r.y + e.y * r.x + e.z * r.w),
    1.0
  );
}

#endif