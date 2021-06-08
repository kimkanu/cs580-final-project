/**
 * The interface that provides uniform and attributes
 * to a THREE.SkinnedMesh instance.
 */
export interface MeshDataProvider {
  setUniforms(skinnedMesh: THREE.SkinnedMesh): void;
  setAttributes(skinnedMesh: THREE.SkinnedMesh): void;
}
