export function isSkinnedMesh(
  object: THREE.Object3D,
): object is THREE.SkinnedMesh {
  return object.type === "SkinnedMesh";
}

export function isShaderMaterial(
  // workaround to suppress TypeScript error
  object: {
    type: string;
  },
): object is THREE.ShaderMaterial {
  return object.type === "ShaderMaterial";
}

export function resizeRendererToDisplaySize(renderer: any) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
