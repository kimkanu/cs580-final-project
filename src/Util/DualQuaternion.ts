import * as THREE from "three";

function _scaleQuat(quat: THREE.Quaternion, scale: number): void {
  quat.x *= scale;
  quat.y *= scale;
  quat.z *= scale;
  quat.w *= scale;
}

export class DualQuaternion {
  constructor(public rot: THREE.Quaternion, public transl: THREE.Quaternion) {}

  static fromMat4(mat: THREE.Matrix4): DualQuaternion {
    const rot = new THREE.Quaternion().setFromRotationMatrix(mat);
    const transl = new THREE.Quaternion(
      mat.elements[12],
      mat.elements[13],
      mat.elements[14],
      0,
    ).multiply(rot);
    // scale by 1 / 2
    transl.x /= 2;
    transl.y /= 2;
    transl.z /= 2;
    transl.w /= 2;
    return new DualQuaternion(rot, transl);
  }

  scale(scale: number): DualQuaternion {
    _scaleQuat(this.rot, scale);
    _scaleQuat(this.transl, scale);
    return this;
  }

  negate(): DualQuaternion {
    return this.scale(-1);
  }

  toArray(): number[] {
    return [...this.rot.toArray(), ...this.transl.toArray()];
  }

  toMat4(): THREE.Matrix4 {
    const r = this.rot;
    const e = this.transl;
    const transl = e.clone().multiply(r.clone().invert());
    return new THREE.Matrix4().fromArray([
      // column 0
      1 - 2 * (r.y * r.y + r.z * r.z),
      2 * (r.x * r.y + r.w * r.z),
      2 * (r.x * r.z - r.w * r.y),
      0,
      // column 1
      2 * (r.x * r.y - r.w * r.z),
      1 - 2 * (r.x * r.x + r.z * r.z),
      2 * (r.y * r.z + r.w * r.x),
      0,
      // column 2
      2 * (r.x * r.z + r.w * r.y),
      2 * (r.y * r.z - r.w * r.x),
      1 - 2 * (r.x * r.x + r.y * r.y),
      0,
      // column 3
      ...transl.toArray(),
      1,
    ]);
  }
}
