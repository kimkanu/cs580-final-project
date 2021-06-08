import quaternionShaderChunk from "../Chunk/quaternion.chunk.vert";
import sphericalBlendSkinningShaderTemplate from "./src/spherical_blend_skinning.vert";
import sphericalBlendParsShaderChunk from "./src/spherical_blend_pars.chunk.vert";
import sphericalBlendSkinbaseShaderChunk from "./src/spherical_blend_skinbase.chunk.vert";
import sphericalBlendSkinnormalShaderChunk from "./src/spherical_blend_skinnormal.chunk.vert";
import sphericalBlendSkinningShaderChunk from "./src/spherical_blend_skinning.chunk.vert";
import { substituteShader } from "..";

const substitutions = {
  quaternion: quaternionShaderChunk,
  spherical_blend_pars_vertex: sphericalBlendParsShaderChunk,
  spherical_blend_skinbase_vertex: sphericalBlendSkinbaseShaderChunk,
  spherical_blend_skinning_vertex: sphericalBlendSkinningShaderChunk,
  spherical_blend_skinnormal_vertex:
    sphericalBlendSkinnormalShaderChunk,
};


const sphericalBlendSkinningShader: string = substituteShader(
  sphericalBlendSkinningShaderTemplate,
  substitutions
);

export default sphericalBlendSkinningShader;
