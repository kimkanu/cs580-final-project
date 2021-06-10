import { DataTexture } from "three";
import optimizedCoRSkinningShader from "~/Shader/OptimizedCoRSkinning";
import { isShaderMaterial } from "~/Util/Three";
import { MeshDataProvider } from "./Types";

export class OptimizedCoR implements MeshDataProvider {
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
          shader.vertexShader = optimizedCoRSkinningShader;
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
    if (this.centerOfRotation) {
      skinnedMesh.geometry.setAttribute(
        "centerOfRotation",
        this.centerOfRotation
      );
    }
  }
}
