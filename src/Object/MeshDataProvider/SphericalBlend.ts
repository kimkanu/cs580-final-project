import { DataTexture } from "three";

import sphericalBlendSkinningShader from "~/src/Shader/SphericalBlendSkinning";
import { isShaderMaterial } from "~/src/Util/Three";
import { MeshDataProvider } from "./Types";

export class SphericalBlend implements MeshDataProvider {
  constructor(
    public boneTexture: DataTexture | null = null,
    public boneCount: number = 0,
    public centerOfRotation: THREE.BufferAttribute | null = null
  ) {}

  setUniforms(skinnedMesh: THREE.SkinnedMesh) {
    if (this.boneTexture === null) return;

    [skinnedMesh.material].flat().map((material) => {
      if (isShaderMaterial(material)) {
        material.onBeforeCompile = (shader) => {
          shader.vertexShader = sphericalBlendSkinningShader;
        };

        material.uniforms.quatBoneTexture = {
          value: this.boneTexture,
        };
        material.uniforms.boneCount = {
          value: this.boneCount,
        };

        material.needsUpdate = true;
      }
    });
  }

  setAttributes(skinnedMesh: THREE.SkinnedMesh) {
    skinnedMesh.geometry.setAttribute(
      "centerOfRotation",
      this.centerOfRotation
    );
  }
}
