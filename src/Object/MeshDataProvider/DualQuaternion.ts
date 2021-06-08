import { DataTexture } from "three";
import dualQuaternionSkinningShader from "~/src/Shader/DualQuaternionSkinning";
import { isShaderMaterial } from "~/src/Util/Three";
import { MeshDataProvider } from "./Types";

export class DualQuaternion implements MeshDataProvider {
  constructor(
    public boneTexture: DataTexture | null = null,
    public boneCount: number = 0
  ) {}

  setUniforms(skinnedMesh: THREE.SkinnedMesh) {
    if (this.boneTexture === null) return;

    [skinnedMesh.material].flat().map((material) => {
      if (isShaderMaterial(material)) {
        material.onBeforeCompile = (shader) => {
          shader.vertexShader = dualQuaternionSkinningShader;
        };

        material.uniforms.dualQuaternionizedBoneTexture = {
          value: this.boneTexture,
        };
        material.uniforms.boneCount = {
          value: this.boneCount,
        };

        material.needsUpdate = true;
      }
    });
  }

  setAttributes() {}
}
