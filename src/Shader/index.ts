import dualQuaternionSkinningShader from "./DualQuaternionSkinning";
import linearBlendSkinningShader from "./LinearBlendSkinning";
import optimizedCoRSkinningShader from "./OptimizedCoRSkinning";
import sphericalBlendSkinningShader from "./SphericalBlendSkinning";
import { SkinningType } from "./Types";

export function substituteShader(
  shaderTemplate: string,
  substitutions: { [chunkName: string]: string },
): string {
  let shader = shaderTemplate;

  while (true) {
    let isChanged = false;

    Object.entries(substitutions).forEach(([chunkName, replacement]) => {
      const regex = new RegExp(`#include <${chunkName}>`, "g");
      if (shader.match(regex)) {
        isChanged = true;
        shader = shader.replace(
          new RegExp(`#include <${chunkName}>`, "g"),
          replacement,
        );
      }
    });

    if (!isChanged) break;
  }

  return shader;
}

export function getVertexShader(type: SkinningType) {
  switch (type) {
    case SkinningType.LINEAR_BLEND:
      return linearBlendSkinningShader;
    case SkinningType.DUAL_QUATERNION:
      return dualQuaternionSkinningShader;
    case SkinningType.SPHERICAL_BLEND:
      return sphericalBlendSkinningShader;
    case SkinningType.OPTIMIZED_COR:
      return optimizedCoRSkinningShader;
  }
}
