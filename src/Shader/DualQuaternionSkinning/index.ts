import quaternionShaderChunk from "../Chunk/quaternion.chunk.vert";
import dualQuaternionShaderChunk from "../Chunk/dual_quaternion.chunk.vert";
import dualQuaternionSkinningShaderTemplate from "./src/dual_quaternion_skinning.vert";
import dualQuaternionParsShaderChunk from "./src/dual_quaternion_pars.chunk.vert";
import dualQuaternionSkinbaseShaderChunk from "./src/dual_quaternion_skinbase.chunk.vert";
import dualQuaternionSkinnormalShaderChunk from "./src/dual_quaternion_skinnormal.chunk.vert";
import dualQuaternionSkinningShaderChunk from "./src/dual_quaternion_skinning.chunk.vert";
import { substituteShader } from "..";

const substitutions = {
  quaternion: quaternionShaderChunk,
  dual_quaternion: dualQuaternionShaderChunk,
  dual_quaternion_pars_vertex: dualQuaternionParsShaderChunk,
  dual_quaternion_skinbase_vertex: dualQuaternionSkinbaseShaderChunk,
  dual_quaternion_skinning_vertex: dualQuaternionSkinningShaderChunk,
  dual_quaternion_skinnormal_vertex:
    dualQuaternionSkinnormalShaderChunk,
};

const dualQuaternionSkinningShader: string = substituteShader(
  dualQuaternionSkinningShaderTemplate,
  substitutions
);

export default dualQuaternionSkinningShader;
