#include <quaternion>

uniform highp sampler2D quatBoneTexture;
uniform int boneCount;

attribute vec3 centerOfRotation;

vec4 getQuatBone( const in float i ) {
  // assuming 0 <= i <= boneCount - 1
  float y = ( 0.5 + float( i ) ) / float( boneCount );

  return texture2D( quatBoneTexture, vec2( 0.5, y ) );
}
