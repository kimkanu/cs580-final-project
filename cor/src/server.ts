import fastifyFactory, { FastifySchema } from "fastify";
import { existsSync } from "fs";
import path from "path";
import { Worker } from "worker_threads";

import { MeshData, WorkerReply } from "./types";

const fastify = fastifyFactory({
  logger: {
    prettyPrint: {
      translateTime: "h:MM:ss TT",
      colorize: true,
      ignore: "pid,hostname",
    },
  },
});
fastify.register(require("fastify-cors"));
fastify.register(require("fastify-log"));

fastify.register(require("fastify-static"), {
  root: path.join(path.dirname(__dirname), "cache"),
  prefix: "/", // optional: default '/'
});

const isDataReady: {
  [modelName: string]: { [meshName: string]: boolean };
} = {};

const postOptions: { schema: FastifySchema } = {
  schema: {
    body: {
      type: "object",
      properties: {
        modelName: { type: "string" },
        meshName: { type: "string" },
        vertices: { type: "array" },
        triangleIndices: { type: "array" },
        skinWeights: { type: "array" },
      },
      required: [
        "modelName",
        "meshName",
        "vertices",
        "triangleIndices",
        "skinWeights",
      ],
    },
  },
};

fastify.post("/", postOptions, async (request, reply) => {
  const body = request.body as MeshData;

  // check if cache file exists
  const filepath = path.join(
    "cache",
    body.modelName,
    body.meshName + ".corbin",
  );

  if (!isDataReady.hasOwnProperty(body.modelName)) {
    isDataReady[body.modelName] = {};
  }

  if (existsSync(filepath)) {
    isDataReady[body.modelName][body.meshName] = true;
    return { success: false, present: true };
  }

  if (isDataReady[body.modelName].hasOwnProperty(body.meshName)) {
    return {
      success: false,
      present: isDataReady[body.modelName][body.meshName],
    };
  }

  if (body.checkOnly) {
    return {
      success: false,
      present: false,
    };
  }

  // Request to a worker
  runWorker(body)
    .then(({ modelName, meshName, success, errorMessage }) => {
      if (success) {
        isDataReady[modelName][meshName] = true;
      } else {
        console.warn(`Failed to process the mesh ${meshName}. ${errorMessage}`);
      }
    })
    .catch((e) => {
      console.error(e);
    });

  return { success: true, present: false };
});

/**
 * Check if any mesh is requested to be processed
 * and every mesh data is completely processed
 */
fastify.get("/:modelName", async (request, reply) => {
  const { modelName } = request.params as { modelName: string };
  if (!modelName) {
    return reply.code(200).send({});
  }

  if (
    !isDataReady.hasOwnProperty(modelName) ||
    Object.keys(isDataReady[modelName]).length === 0
  ) {
    return { completed: false };
  }

  return {
    completed: Object.values(isDataReady[modelName]).every((x) => x),
  };
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(9001);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

function runWorker(workerData: MeshData) {
  return new Promise<WorkerReply>((resolve, reject) => {
    const worker = new Worker("./src/worker.js", {
      workerData: {
        ...workerData,
        __path: "./worker.ts",
      },
    });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}
