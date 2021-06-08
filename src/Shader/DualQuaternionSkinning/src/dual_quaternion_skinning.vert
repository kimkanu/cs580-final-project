// This template is brought from the actual vertex shader
// for VRM models. Refer to
// https://github.com/pixiv/three-vrm/blob/dev/packages/three-vrm/src/material/shaders/mtoon.vert

// #define PHONG

varying vec3 vViewPosition;

#ifndef FLAT_SHADED
  varying vec3 vNormal;
#endif

#include <common>

// #include <uv_pars_vertex>
#ifdef MTOON_USE_UV
  #ifdef MTOON_UVS_VERTEX_ONLY
    vec2 vUv;
  #else
    varying vec2 vUv;
  #endif

  uniform vec4 mainTex_ST;
#endif

#include <uv2_pars_vertex>
// #include <displacementmap_pars_vertex>
// #include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef USE_OUTLINEWIDTHTEXTURE
  uniform sampler2D outlineWidthTexture;
#endif

uniform float outlineWidth;
uniform float outlineScaledMaxDistance;

// >>>>>>>> CHANGED!
#include <dual_quaternion_pars_vertex>

void main() {

  // #include <uv_vertex>
  #ifdef MTOON_USE_UV
    vUv = uv;
    vUv.y = 1.0 - vUv.y; // uv.y is opposite from UniVRM's
    vUv = mainTex_ST.st + mainTex_ST.pq * vUv;
    vUv.y = 1.0 - vUv.y; // reverting the previous flip
  #endif

  #include <uv2_vertex>
  #include <color_vertex>

  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  // >>>>>>>> CHANGED!
  // >>>>>>>>
  // >>>>>>>> skinbase_vertex and skinnormal_vertex shader chunks
  // >>>>>>>> are replaced by custom dual_quaternion_* ones.
  #include <dual_quaternion_skinbase_vertex>
  #include <dual_quaternion_skinnormal_vertex>

  // we need this to compute the outline properly
  objectNormal = normalize( objectNormal );

  #include <defaultnormal_vertex>

  #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
    vNormal = normalize( transformedNormal );
  #endif

  #include <begin_vertex>

  #include <morphtarget_vertex>
  // >>>>>>>> CHANGED!
  // >>>>>>>>
  // >>>>>>>> skinning_vertex shader chunk is replaced by custom
  // >>>>>>>> dual_quaternion_skinning_vertex shader chunk.
  #include <dual_quaternion_skinning_vertex>
  // #include <displacementmap_vertex>
  #include <project_vertex>
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>

  vViewPosition = - mvPosition.xyz;

  float outlineTex = 1.0;

  #ifdef OUTLINE
    #ifdef USE_OUTLINEWIDTHTEXTURE
      outlineTex = texture2D( outlineWidthTexture, vUv ).r;
    #endif

    #ifdef OUTLINE_WIDTH_WORLD
      float worldNormalLength = length( transformedNormal );
      vec3 outlineOffset = 0.01 * outlineWidth * outlineTex * worldNormalLength * objectNormal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( outlineOffset + transformed, 1.0 );
    #endif

    #ifdef OUTLINE_WIDTH_SCREEN
      vec3 clipNormal = ( projectionMatrix * modelViewMatrix * vec4( objectNormal, 0.0 ) ).xyz;
      vec2 projectedNormal = normalize( clipNormal.xy );
      projectedNormal *= min( gl_Position.w, outlineScaledMaxDistance );
      projectedNormal.x *= projectionMatrix[ 0 ].x / projectionMatrix[ 1 ].y;
      gl_Position.xy += 0.01 * outlineWidth * outlineTex * projectedNormal.xy;
    #endif

    // >>>>>>>> CHANGED!
    // >>>>>>>>
    // >>>>>>>> Originally, the coefficient for the anti-artifact magic below
    // >>>>>>>> was 1E-6, but this value was too small for the outlines of
    // >>>>>>>> some distorted parts such as discontinuities seen when
    // >>>>>>>> an upper arm is rotated 180 degrees around X-axis,
    // >>>>>>>> and too small value 1E-6 generated a super-thick outline artifact.
    // >>>>>>>> This is improved by increasing the coefficient, but the problem
    // >>>>>>>> still exists and it is visible when the camera is sufficiently
    // >>>>>>>> near the distorted part.
    gl_Position.z += 3E-4 * gl_Position.w; // anti-artifact magic
  #endif

  #include <worldpos_vertex>
  // #include <envmap_vertex>
  #include <shadowmap_vertex>
  #include <fog_vertex>

}