export function isSkinnedMesh(
  object: THREE.Object3D
): object is THREE.SkinnedMesh {
  return object.type === "SkinnedMesh";
}

export function isShaderMaterial(
  // workaround to suppress TypeScript error
  object: {
    type: string;
  }
): object is THREE.ShaderMaterial {
  return object.type === "ShaderMaterial";
}
