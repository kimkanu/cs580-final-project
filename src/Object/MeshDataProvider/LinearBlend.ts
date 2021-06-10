import linearBlendSkinningShader from "~/Shader/LinearBlendSkinning";
import { isShaderMaterial } from "~/Util/Three";
import { MeshDataProvider } from "./Types";

export class LinearBlend implements MeshDataProvider {
  setUniforms(skinnedMesh: THREE.SkinnedMesh) {
    [skinnedMesh.material].flat().map((material) => {
      if (isShaderMaterial(material)) {
        material.onBeforeCompile = (shader, r: THREE.WebGLRenderer) => {
          shader.vertexShader = linearBlendSkinningShader;
        };

        material.needsUpdate = true;
      }
    });
  }

  setAttributes() {}
}
