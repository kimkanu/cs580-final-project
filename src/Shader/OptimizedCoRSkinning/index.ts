import quaternionShaderChunk from "../Chunk/quaternion.chunk.vert";
import optimizedCoRSkinningShaderTemplate from "./Chunk/optimized_cor_skinning.vert";
import optimizedCoRParsShaderChunk from "./Chunk/optimized_cor_pars.chunk.vert";
import optimizedCoRSkinbaseShaderChunk from "./Chunk/optimized_cor_skinbase.chunk.vert";
import optimizedCoRSkinnormalShaderChunk from "./Chunk/optimized_cor_skinnormal.chunk.vert";
import optimizedCoRSkinningShaderChunk from "./Chunk/optimized_cor_skinning.chunk.vert";
import { substituteShader } from "..";

const substitutions = {
  quaternion: quaternionShaderChunk,
  optimized_cor_pars_vertex: optimizedCoRParsShaderChunk,
  optimized_cor_skinbase_vertex: optimizedCoRSkinbaseShaderChunk,
  optimized_cor_skinning_vertex: optimizedCoRSkinningShaderChunk,
  optimized_cor_skinnormal_vertex:
    optimizedCoRSkinnormalShaderChunk,
};


const optimizedCoRSkinningShader: string = substituteShader(
  optimizedCoRSkinningShaderTemplate,
  substitutions
);

export default optimizedCoRSkinningShader;
