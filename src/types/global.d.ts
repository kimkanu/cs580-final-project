declare module "*.vert" {
  const content: string;
  export default content;
}
declare module "*.frag" {
  const content: string;
  export default content;
}

// // For babel plugin
// declare module "gl-matrix" {
//   export function mat2(m00: number, m01: number, m10: number, m11: number): mat2;
//   export function mat2d(a: number, b: number, c: number, d: number, tx: number, ty: number): mat2d;
//   export function mat3(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): mat3;
//   export function mat4(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): mat4;
//   export function vec2(x: number, y: number): vec2;
//   export function vec3(x: number, y: number, z: number): vec3;
//   export function vec4(x: number, y: number, z: number, w: number): vec4;
//   export function quat(x: number, y: number, z: number, w: number): quat;
//   export function quat2(x1: number, y1: number, z1: number, w1: number, x2: number, y2: number, z2: number, w2: number): quat;

//   export function mat2(m: mat2): any;
//   export function mat2d(m: mat2d): any;
//   export function mat3(m: mat3): any;
//   export function mat4(m: mat4): any;
//   export function vec2(v: vec2): any;
//   export function vec3(v: vec3): any;
//   export function vec4(v: vec4): any;
//   export function quat(v: quat): any;
//   export function quat2(v: quat2): any;
  
//   export module mat2 {
//     export function identity(): mat2;
//   }
//   export module mat2d {
//     export function identity(): mat2d;
//   }
//   export module mat3 {
//     export function identity(): mat3;
//   }
//   export module mat4 {
//     export function identity(): mat4;
//     export function fromRotationTranslationScale(rot: quat, tran: vec3, scale: vec3): mat4;
//     export function ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): mat4;
//     export function fromTranslation(v: ReadonlyVec3): mat4;
//     export function invert(m: ReadonlyMat4): mat4;
//   }
//   export module quat {
//     export function identity(): quat;
//   }
//   export module quat2 {
//     export function identity(): quat2;
//   }
// }