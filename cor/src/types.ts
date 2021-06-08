export type Vertex = [number, number, number];

export type SkinWeight = [
  number /* joint index */,
  number /* 0 <= skin weight value <= 1 */
][];

export interface MeshData {
  checkOnly: boolean;
  modelName: string;
  meshName: string;
  vertices: number[];
  triangleIndices: number[];
  skinWeights: SkinWeight[];
}

export interface WorkerReply {
  modelName: string;
  meshName: string;
  success: boolean;
  errorMessage?: string;
}
