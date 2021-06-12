import { substituteShader } from "..";
import dualQuaternionShaderChunk from "../Chunk/dual_quaternion.chunk.vert";
import quaternionShaderChunk from "../Chunk/quaternion.chunk.vert";
import dualQuaternionParsShaderChunk from "./Chunk/dual_quaternion_pars.chunk.vert";
import dualQuaternionSkinbaseShaderChunk from "./Chunk/dual_quaternion_skinbase.chunk.vert";
import dualQuaternionSkinningShaderChunk from "./Chunk/dual_quaternion_skinning.chunk.vert";
import dualQuaternionSkinningShaderTemplate from "./Chunk/dual_quaternion_skinning.vert";
import dualQuaternionSkinnormalShaderChunk from "./Chunk/dual_quaternion_skinnormal.chunk.vert";

const substitutions = {
  quaternion: quaternionShaderChunk,
  dual_quaternion: dualQuaternionShaderChunk,
  dual_quaternion_pars_vertex: dualQuaternionParsShaderChunk,
  dual_quaternion_skinbase_vertex: dualQuaternionSkinbaseShaderChunk,
  dual_quaternion_skinning_vertex: dualQuaternionSkinningShaderChunk,
  dual_quaternion_skinnormal_vertex: dualQuaternionSkinnormalShaderChunk,
};

const dualQuaternionSkinningShader: string = substituteShader(
  dualQuaternionSkinningShaderTemplate,
  substitutions,
);

export default dualQuaternionSkinningShader;
