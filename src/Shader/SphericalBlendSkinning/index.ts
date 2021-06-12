import { substituteShader } from "..";
import quaternionShaderChunk from "../Chunk/quaternion.chunk.vert";
import sphericalBlendParsShaderChunk from "./Chunk/spherical_blend_pars.chunk.vert";
import sphericalBlendSkinbaseShaderChunk from "./Chunk/spherical_blend_skinbase.chunk.vert";
import sphericalBlendSkinningShaderChunk from "./Chunk/spherical_blend_skinning.chunk.vert";
import sphericalBlendSkinningShaderTemplate from "./Chunk/spherical_blend_skinning.vert";
import sphericalBlendSkinnormalShaderChunk from "./Chunk/spherical_blend_skinnormal.chunk.vert";

const substitutions = {
  quaternion: quaternionShaderChunk,
  spherical_blend_pars_vertex: sphericalBlendParsShaderChunk,
  spherical_blend_skinbase_vertex: sphericalBlendSkinbaseShaderChunk,
  spherical_blend_skinning_vertex: sphericalBlendSkinningShaderChunk,
  spherical_blend_skinnormal_vertex: sphericalBlendSkinnormalShaderChunk,
};

const sphericalBlendSkinningShader: string = substituteShader(
  sphericalBlendSkinningShaderTemplate,
  substitutions,
);

export default sphericalBlendSkinningShader;
