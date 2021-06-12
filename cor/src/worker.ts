import { assert } from "console";
import fs from "fs/promises";
import _ from "lodash";
import mkdirp from "mkdirp";
import path from "path";
import toBuffer from "typedarray-to-buffer";
import { workerData, parentPort } from "worker_threads";

import { MeshData, SkinWeight, Vertex, WorkerReply } from "./types";

const EXP_KERNEL_BANDWIDTH = 0.1; // σ

function square(a: number) {
  return a * a;
}
function expCrossDiff(
  wpj: number,
  wpk: number,
  wvj: number,
  wvk: number,
): number {
  return Math.exp(
    -square(wpj * wvk - wpk * wvj) / square(EXP_KERNEL_BANDWIDTH),
  );
}

function averageVertex(va: Vertex, vb: Vertex, vc: Vertex): Vertex {
  return [
    (va[0] + vb[0] + vc[0]) / 3,
    (va[1] + vb[1] + vc[1]) / 3,
    (va[2] + vb[2] + vc[2]) / 3,
  ];
}

function getTriangleArea(va: Vertex, vb: Vertex, vc: Vertex): number {
  const ab = [va[0] - vb[0], va[1] - vb[1], va[2] - vb[2]] as Vertex;
  const ac = [va[0] - vc[0], va[1] - vc[1], va[2] - vc[2]] as Vertex;
  const crossProd = [
    ab[1] * ac[2] - ac[1] * ab[2],
    ab[2] * ac[0] - ac[2] * ab[0],
    ab[0] * ac[1] - ac[0] * ab[1],
  ];
  return Math.hypot(...crossProd) / 2;
}

function getWeightByIndex(w: SkinWeight, jointIndex: number) {
  const found = w.find(([j, x]) => j === jointIndex);
  if (found) {
    return found[1];
  }
  return 0;
}

function similarity(wp: SkinWeight, wv: SkinWeight): number {
  let result = 0;

  // pairs (j, k) with j ≠ k such that w_pj w_pk w_vj w_vk may be nonzero
  for (let _i = 0; _i < wp.length - 1; _i++) {
    for (let __i = _i + 1; __i < wp.length; __i++) {
      const [j, wpj] = wp[_i];
      const [k, wpk] = wp[_i];

      // if w_vj or w_vk is zero, (add zero and) break.
      const wvj = getWeightByIndex(wv, j);
      const wvk = getWeightByIndex(wv, k);
      if (wvj === 0 || wvk === 0) break;

      result += expCrossDiff(wpj, wpk, wvj, wvk);
    }
  }

  return result;
}

function averageSkinWeight(
  wa: SkinWeight,
  wb: SkinWeight,
  wc: SkinWeight,
): SkinWeight {
  const average = new Map<number, number>();
  for (const wx of [wa, wb, wc]) {
    for (const [j, w] of wx) {
      average.set(j, (average.get(j) ?? 0) + w / 3);
    }
  }
  return Array.from(average.entries());
}

async function main() {
  const {
    modelName,
    meshName,
    vertices,
    triangleIndices,
    skinWeights,
  } = workerData as MeshData;
  try {
    assert(skinWeights.length * 3 === vertices.length);

    const getVertex = (vertexIndex: number): Vertex => [
      vertices[3 * vertexIndex],
      vertices[3 * vertexIndex + 1],
      vertices[3 * vertexIndex + 2],
    ];

    const approxOptimalCoRArray = _.range(vertices.length / 3)
      .map((vertexIndex) => {
        const wi = skinWeights[vertexIndex];
        const numerator = [0, 0, 0];
        let denominator = 0;

        _.chunk(triangleIndices, 3).forEach(([ia, ib, ic]) => {
          const va = getVertex(ia);
          const vb = getVertex(ib);
          const vc = getVertex(ic);
          const wa = skinWeights[ia];
          const wb = skinWeights[ib];
          const wc = skinWeights[ic];
          const wav = averageSkinWeight(wa, wb, wc);
          const vav = averageVertex(va, vb, vc);

          const area = getTriangleArea(va, vb, vc);
          const coeff = similarity(wi, wav) * area;
          numerator[0] += coeff * vav[0];
          numerator[1] += coeff * vav[1];
          numerator[2] += coeff * vav[2];
          denominator += coeff;
        });

        if (denominator === 0) {
          return [0, 0, 0] as Vertex;
        }

        return numerator.map((x) => x / denominator) as Vertex;
      })
      .flat();

    const approxOptimalCoRBuffer = toBuffer(
      new Float32Array(approxOptimalCoRArray),
    );

    const filepath = path.join("cache", modelName, meshName + ".corbin");
    await mkdirp(path.dirname(filepath));
    await fs.writeFile(
      path.join("cache", modelName, meshName + ".corbin"),
      approxOptimalCoRBuffer,
    );

    console.log(modelName, meshName, approxOptimalCoRArray.slice(0, 50));

    parentPort?.postMessage({
      modelName,
      meshName,
      success: true,
    } as WorkerReply);
  } catch (e) {
    parentPort?.postMessage({
      modelName,
      meshName,
      success: false,
      errorMessage: e.toString(),
    } as WorkerReply);
  }
}

main();
