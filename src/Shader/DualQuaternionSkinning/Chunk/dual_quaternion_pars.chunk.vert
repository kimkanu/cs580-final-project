#include <dual_quaternion>

uniform highp sampler2D dualQuatBoneTexture;
uniform int boneCount;

DualQuat getDualQuaternionizedBone( const in float i ) {
  // assuming 0 <= i <= boneCount - 1
  float rx = 0.25;
  float tx = 0.75;
  float y = ( 0.5 + float( i ) ) / float( boneCount );

  DualQuat dq;
  dq.rot = texture2D( dualQuatBoneTexture, vec2( rx, y ) );
  dq.transl = texture2D( dualQuatBoneTexture, vec2( tx, y ) );
  return dq;
}
