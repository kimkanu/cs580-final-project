import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  RawVector3,
  RawVector4,
  VRM,
  VRMPose,
  VRMSchema,
} from "@pixiv/three-vrm";

import { pipe } from "fp-ts/function";
import * as _ from "lodash";
import { SVD } from "svd-js";

import * as A from "./Types";
import { delay } from "~/Util/Delay";
import { DualQuaternion } from "~/Util/DualQuaternion";
import { isSkinnedMesh } from "~/Util/Three";
import { combinations } from "~/Util/Iteration";
import { SkinningType } from "~/Shader/Types";
import * as MDP from "~/Object/MeshDataProvider";

const animation1 = (elapsed: number): VRMPose => ({
  [VRMSchema.HumanoidBoneName.LeftUpperLeg]: {
    rotation: [0.0, 0.0, -0.1, 1],
    position: [0.0, 0.0, 0.0], // position is not required though
  },
  [VRMSchema.HumanoidBoneName.LeftUpperArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          0,
          0,
          ((Math.cos(elapsed) + 1) / 2) * (Math.PI / 2) - Math.PI / 4,
          "XYZ"
        )
      )
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftLowerArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          ((-Math.cos(elapsed) + 1) / 2) * (Math.PI / 1.3),
          0,
          ((Math.cos(elapsed) - 1) / 2) * (-Math.PI / 8),
          "XYZ"
        )
      )
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.RightUpperArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(0, 0, -Math.PI / 4, "XYZ"))
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.RightLowerArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2.3, "XYZ"))
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftHand]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          ((-Math.cos(elapsed) + 1) / 2) * (-Math.PI / 6),
          0.02,
          0.02,
          "XYZ"
        )
      )
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftShoulder]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          0,
          0,
          ((Math.cos(elapsed) - 1) / 2) * (Math.PI / 6),
          "XYZ"
        )
      )
      .toArray() as RawVector4,
    position: [
      -0.025 * ((-Math.cos(elapsed) + 1) / 2),
      0.08 * ((-Math.cos(elapsed) + 1) / 2),
      0,
    ],
  },
  [VRMSchema.HumanoidBoneName.UpperChest]: {
    position: [0.02 * ((-Math.cos(elapsed) + 1) / 2), 0, 0],
  },
});

const animation2 = (elapsed: number): VRMPose => ({
  [VRMSchema.HumanoidBoneName.LeftUpperLeg]: {
    rotation: [0.0, 0.0, -0.1, 1],
    position: [0.0, 0.0, 0.0], // position is not required though
  },
  [VRMSchema.HumanoidBoneName.LeftLittleDistal]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          0,
          0,
          ((Math.cos(elapsed) + 1) / 2) * (Math.PI / 1.4) - Math.PI / 2.5,
          "XYZ"
        )
      )
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftLittleIntermediate]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          0,
          0,
          ((Math.cos(elapsed) + 1) / 2) * (Math.PI / 1.4) - Math.PI / 2.5,
          "XYZ"
        )
      )
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftUpperArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          0,
          0,
          ((Math.cos(elapsed) + 1) / 2) * (Math.PI / 2) - Math.PI / 4,
          "XYZ"
        )
      )
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftLowerArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          ((-Math.cos(elapsed) + 1) / 2) * (Math.PI / 2),
          0,
          ((Math.cos(elapsed) - 1) / 2) * (-Math.PI / 8),
          "XYZ"
        )
      )
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.RightUpperArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(0, 0, -Math.PI / 4, "XYZ"))
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.RightLowerArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2.3, "XYZ"))
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftHand]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(0.02, 0.02, 0.02, "XYZ"))
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftShoulder]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          0,
          0,
          ((Math.cos(elapsed) - 1) / 2) * (Math.PI / 6),
          "XYZ"
        )
      )
      .toArray() as RawVector4,
    position: [
      -0.025 * ((-Math.cos(elapsed) + 1) / 2),
      0.08 * ((-Math.cos(elapsed) + 1) / 2),
      0,
    ],
  },
  [VRMSchema.HumanoidBoneName.UpperChest]: {
    position: [0.02 * ((-Math.cos(elapsed) + 1) / 2), 0, 0],
  },
});

function resizeRendererToDisplaySize(renderer: any) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

interface OptimizedCoRRequestBody {
  checkOnly: boolean;
  modelName: string;
  meshName: string;
  vertices: number[];
  triangleIndices: number[];
  skinWeights: [number, number][][];
}

export class MainApp extends A.App {
  // constants
  backgroundColor = "#FDF6E3";

  // basic things
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  camera!: THREE.PerspectiveCamera;
  controls!: OrbitControls;
  scene: THREE.Scene;

  skinningType: SkinningType = SkinningType.LINEAR_BLEND;
  meshDataProviders: {
    [skinningType in SkinningType]: MDP.MeshDataProvider;
  };
  vrms: { [modelName: string]: VRM } = {};
  animation: (elapsed: number) => VRMPose;

  skinnedMeshCount = 0;
  optimizedCoRBuffers: {
    [modelName: string]: {
      [meshName: string]: Float32Array;
    };
  } = {};
  optimizedCoRLoaded = false;

  pressedKeys: Set<string> = new Set();

  debug: boolean = false;

  constructor() {
    super();

    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer = renderer;

    this.setCameraAndControls();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(this.backgroundColor);
    this.scene = scene;

    this.meshDataProviders = {
      [SkinningType.LINEAR_BLEND]: new MDP.LinearBlend(),
      [SkinningType.DUAL_QUATERNION]: new MDP.DualQuaternion(),
      [SkinningType.SPHERICAL_BLEND]: new MDP.SphericalBlend(),
      [SkinningType.OPTIMIZED_COR]: new MDP.OptimizedCoR(),
    };

    this.animation = animation1;
  }

  async initialize() {
    const { scene } = this;

    {
      const skyColor = 0xb1e1ff; // light blue
      const groundColor = 0xb97a20; // brownish orange
      const intensity = 1;
      const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
      scene.add(light);
    }

    {
      const color = 0xffffff;
      const intensity = 1;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(5, 10, 2);
      scene.add(light);
      scene.add(light.target);
    }

    await this.loadVRM("/static/kazuki.vrm");

    this.attachButtonClickHandlers();
  }

  async loadVRM(url: string) {
    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync(url);
    const vrm = await VRM.from(gltf);
    const root = vrm.scene;

    this.scene.add(root);
    this.vrms.kazuki = vrm;

    // compute the box that contains all the stuff
    // from root and below
    const box = new THREE.Box3().setFromObject(root);

    const boxSize = box.getSize(new THREE.Vector3()).length();
    const boxCenter = box.getCenter(new THREE.Vector3());

    // set the camera to frame the box
    this.setCameraFitToFrame(boxSize, boxSize, boxCenter);

    // update the Trackball controls to handle the new size
    this.controls.maxDistance = boxSize * 10;
    this.controls.target.copy(boxCenter);
    this.controls.update();

    this.vrms.kazuki?.scene.traverse((mesh: THREE.Object3D) => {
      if (isSkinnedMesh(mesh)) {
        this.skinnedMeshCount++;
      }
    });

    this.vrms.kazuki?.scene.traverse(this.sendOptimizedCoRDataRequests(true));
    this.vrms.kazuki?.scene.traverse(this.traverseCallback);

    await delay(500);
    this.checkOptimizedCoRLongPolling("kazuki");
  }

  sendOptimizedCoRDataRequests =
    (checkOnly: boolean) => async (mesh: THREE.Object3D) => {
      if (isSkinnedMesh(mesh)) {
        mesh.skeleton.update();

        const skinIndex = Array.from(
          mesh.geometry.getAttribute("skinIndex").array
        );
        const skinWeight = Array.from(
          mesh.geometry.getAttribute("skinWeight").array
        );

        const body: OptimizedCoRRequestBody = {
          checkOnly,
          modelName: "kazuki",
          meshName: mesh.name,
          vertices: Array.from(mesh.geometry.getAttribute("position").array),
          triangleIndices: Array.from(mesh.geometry.index?.array ?? []),
          skinWeights: _.chunk(skinWeight, 4).map(
            (singleVertexSkinWeight, vertexCount) =>
              singleVertexSkinWeight
                .map(
                  (weight, weightCount) =>
                    [skinIndex[4 * vertexCount + weightCount], weight] as [
                      number,
                      number
                    ]
                )
                .filter(([index, weight]) => weight !== 0)
          ),
        };
        const response = await fetch("http://localhost:9001", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        const json = (await response.json()) as {
          success: boolean;
          present: boolean;
        };
        console.log(
          `Sent the mesh '${mesh.name}'. The data is ${
            json.present ? "present." : "not present."
          }`
        );
      }
    };

  checkOptimizedCoRLongPolling = async (modelName: string) => {
    fetch(`http://localhost:9001/${modelName}`)
      .then((r) => r.json())
      .then(async ({ completed }: { completed: boolean }) => {
        if (!completed) {
          console.log("Not completed");
          await delay(10000);
          await this.checkOptimizedCoRLongPolling(modelName);
        } else {
          console.log("Optimized CoR data generation completed!");
          await this.fetchOptimizedCoRData(modelName);

          // XXX: wait for an enough amount of time for data textures
          // XXX: to be loaded
          await delay(1000);

          // Enable COR button
          document
            .querySelector(".btn-skinning-method.disabled")
            ?.classList.remove("disabled");
        }
      });
  };

  fetchOptimizedCoRData = async (modelName: string) => {
    if (this.optimizedCoRBuffers.hasOwnProperty(modelName)) {
      return;
    }

    this.optimizedCoRBuffers[modelName] = {};
    console.log("Generating...");

    this.vrms[modelName].scene.traverse(async (mesh: THREE.Object3D) => {
      if (isSkinnedMesh(mesh)) {
        const buffer = await (
          await fetch(`http://localhost:9001/${modelName}/${mesh.name}.corbin`)
        ).arrayBuffer();

        this.optimizedCoRBuffers[modelName][mesh.name] = new Float32Array(
          buffer
        );

        console.log(
          `Optimized CoR buffer for the mesh ${mesh.name} was fetched.`
        );
      }
    });
  };

  traverseCallback = (mesh: THREE.Object3D) => {
    if (isSkinnedMesh(mesh)) {
      mesh.skeleton.update();

      switch (this.skinningType) {
        case SkinningType.LINEAR_BLEND: {
          const meshDataProvider = this.meshDataProviders[
            SkinningType.LINEAR_BLEND
          ] as MDP.LinearBlend;

          meshDataProvider.setUniforms(mesh);

          break;
        }

        case SkinningType.DUAL_QUATERNION: {
          const meshDataProvider = this.meshDataProviders[
            SkinningType.DUAL_QUATERNION
          ] as MDP.DualQuaternion;
          const boneTexture = new THREE.DataTexture(
            new Float32Array(
              _.range(mesh.skeleton.bones.length)
                .map((i) =>
                  DualQuaternion.fromMat4(
                    new THREE.Matrix4()
                      .fromArray(mesh.skeleton.boneMatrices, 16 * i)
                      .premultiply(mesh.bindMatrix)
                      .multiply(mesh.bindMatrixInverse)
                  )
                )
                .map((dq) => dq.toArray())
                .flat()
            ),
            2,
            mesh.skeleton.bones.length,
            THREE.RGBAFormat,
            THREE.FloatType
          );
          // Interpolate the texture with nearest filter
          boneTexture.minFilter = THREE.NearestFilter;
          boneTexture.magFilter = THREE.NearestFilter;

          // the data texture should be updated once it has been set up
          boneTexture.needsUpdate = true;

          meshDataProvider.boneTexture = boneTexture;
          meshDataProvider.boneCount = mesh.skeleton.bones.length;

          meshDataProvider.setUniforms(mesh);

          break;
        }

        case SkinningType.SPHERICAL_BLEND: {
          // Extract quat from bone matrices
          const boneTexture = new THREE.DataTexture(
            new Float32Array(
              _.range(mesh.skeleton.bones.length)
                .map((i) => {
                  const mat = new THREE.Matrix4()
                    .fromArray(mesh.skeleton.boneMatrices, 16 * i)
                    .premultiply(mesh.bindMatrix)
                    .multiply(mesh.bindMatrixInverse);
                  return new THREE.Quaternion()
                    .setFromRotationMatrix(mat)
                    .toArray();
                })
                .flat()
            ),
            1,
            mesh.skeleton.bones.length,
            THREE.RGBAFormat,
            THREE.FloatType
          );
          // Interpolate the texture with nearest filter
          boneTexture.minFilter = THREE.NearestFilter;
          boneTexture.magFilter = THREE.NearestFilter;

          // the data texture should be updated once it has been set up
          boneTexture.needsUpdate = true;

          const centerOfRotationTable = new Map<number, RawVector3>();
          const skinIndexAttr = mesh.geometry.getAttribute("skinIndex");
          const skinIndexArray = Array.from(skinIndexAttr.array as Uint16Array);
          const skinWeightAttr = mesh.geometry.getAttribute("skinWeight");

          // Encode a skin index into a single integer.
          // XXX: the number of total bones (for each SkinnedMesh)
          // XXX: are restricted by 99.
          const MAX_BONE_COUNT = 99;
          const encodeSkinIndex = (l: number[]) =>
            l
              .map((x) => x + 1)
              .reduce((a, b) => (MAX_BONE_COUNT + 1) * a + b, 0);

          const centerOfRotation: RawVector3[] = [];

          _.range(skinIndexAttr.count).forEach((vertexIndex) => {
            const skinIndex = pipe(
              skinIndexArray.slice(4 * vertexIndex, 4 * (vertexIndex + 1)),
              (l) =>
                l.filter(
                  (s, i) => skinWeightAttr.array[4 * vertexIndex + i] !== 0
                ),
              (l) => _.sortBy(l),
              (l) => _.sortedUniq(l)
            );
            const skinIndexKey = encodeSkinIndex(skinIndex);

            // if the skinIndex has been investigated before,
            // just seek the entry in the table
            if (centerOfRotationTable.has(skinIndexKey)) {
              // append
              centerOfRotation.push(centerOfRotationTable.get(skinIndexKey)!);
              return;
            }

            // otherwise, run SVD
            const svdCoeff: RawVector3[] = [];
            const svdConst: number[] = []; // column vector

            if (skinIndex.length < 2) {
              centerOfRotationTable.set(skinIndexKey, [0, 0, 0]);
              centerOfRotation.push([0, 0, 0]);
              return;
            }

            for (const [a, b] of combinations(skinIndex, 2)) {
              const aMatrix = new THREE.Matrix4()
                .fromArray(mesh.skeleton.boneMatrices, 16 * a)
                .premultiply(mesh.bindMatrix)
                .multiply(mesh.bindMatrixInverse);
              const bMatrix = new THREE.Matrix4()
                .fromArray(mesh.skeleton.boneMatrices, 16 * b)
                .premultiply(mesh.bindMatrix)
                .multiply(mesh.bindMatrixInverse);

              // Append `mat3( aMatrix ) - mat( bMatrix )`
              const amb = (i: number) =>
                aMatrix.elements[i] - bMatrix.elements[i];
              if (_.range(11).some((i) => amb(i) !== 0)) {
                svdCoeff.push(
                  [amb(0), amb(4), amb(8)],
                  [amb(1), amb(5), amb(9)],
                  [amb(2), amb(6), amb(10)]
                );
                svdConst.push(-amb(12), -amb(13), -amb(14));
              }
            }

            const leastSquares = (() => {
              if (svdCoeff.length === 0) return [0, 0, 0] as RawVector3;

              const dot = (a: number[], b: number[]) => {
                if (a.length !== b.length)
                  throw new Error(
                    "Dot product of two vectors of different dimensions."
                  );
                return _.range(a.length)
                  .map((i) => a[i] * b[i])
                  .reduce((x, y) => x + y, 0);
              };

              const { u, v, q } = SVD(svdCoeff);
              return q
                .map((qi, i) => {
                  return qi > 1e-4
                    ? new THREE.Vector3(...v.map((r) => r[i]))
                        .multiplyScalar(
                          dot(
                            u.map((r) => r[i]), // i-th column of u
                            svdConst
                          ) / qi
                        )
                        .toArray()
                    : [0, 0, 0];
                })
                .reduce(
                  (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
                  [0, 0, 0]
                ) as RawVector3;
            })();

            // If resulting least squares solution is zero, give table index 0.
            if (
              leastSquares[0] === 0 &&
              leastSquares[1] === 0 &&
              leastSquares[2] === 0
            ) {
              centerOfRotationTable.set(skinIndexKey, [0, 0, 0]);
              centerOfRotation.push([0, 0, 0]);
              return;
            }

            // New center of rotation data
            centerOfRotationTable.set(skinIndexKey, leastSquares);
            centerOfRotation.push(leastSquares);
          });

          const meshDataProvider = this.meshDataProviders[
            SkinningType.SPHERICAL_BLEND
          ] as MDP.SphericalBlend;

          meshDataProvider.boneTexture = boneTexture;
          meshDataProvider.boneCount = mesh.skeleton.bones.length;

          // Attribute `centerOfRotation`
          const centerOfRotationAttr = new THREE.BufferAttribute(
            new Float32Array(centerOfRotation.flat()),
            3,
            false
          );

          meshDataProvider.centerOfRotation = centerOfRotationAttr;

          meshDataProvider.setUniforms(mesh);
          meshDataProvider.setAttributes(mesh);

          break;
        }

        case SkinningType.OPTIMIZED_COR: {
          // Extract quat from bone matrices
          const boneTexture = new THREE.DataTexture(
            new Float32Array(
              _.range(mesh.skeleton.bones.length)
                .map((i) => {
                  const mat = new THREE.Matrix4()
                    .fromArray(mesh.skeleton.boneMatrices, 16 * i)
                    .premultiply(mesh.bindMatrix)
                    .multiply(mesh.bindMatrixInverse);
                  return new THREE.Quaternion()
                    .setFromRotationMatrix(mat)
                    .toArray();
                })
                .flat()
            ),
            1,
            mesh.skeleton.bones.length,
            THREE.RGBAFormat,
            THREE.FloatType
          );
          // Interpolate the texture with nearest filter
          boneTexture.minFilter = THREE.NearestFilter;
          boneTexture.magFilter = THREE.NearestFilter;

          // the data texture should be updated once it has been set up
          boneTexture.needsUpdate = true;

          const meshDataProvider = this.meshDataProviders[
            SkinningType.OPTIMIZED_COR
          ] as MDP.OptimizedCoR;

          meshDataProvider.boneTexture = boneTexture;
          meshDataProvider.boneCount = mesh.skeleton.bones.length;

          // Attribute `centerOfRotation`
          const centerOfRotationAttr = new THREE.BufferAttribute(
            this.optimizedCoRBuffers.kazuki[mesh.name],
            3,
            false
          );
          meshDataProvider.centerOfRotation = centerOfRotationAttr;

          meshDataProvider.setUniforms(mesh);
          meshDataProvider.setAttributes(mesh);
        }
      }
    }
  };

  keydownHandler = (e: KeyboardEvent) => {
    this.pressedKeys.add(e.key);
  };

  keyupHandler = (e: KeyboardEvent) => {
    this.pressedKeys.delete(e.key);
  };

  setCameraAndControls() {
    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(0, 10, -20);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(0, 5, 0);
    this.controls.update();

    document.addEventListener("keydown", this.keydownHandler);
    document.addEventListener("keyup", this.keyupHandler);
  }

  setCameraFitToFrame(sizeToFitOnScreen: any, boxSize: any, boxCenter: any) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(this.camera.fov * 0.5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
    // compute a unit vector that points in the direction the camera is now
    // in the xz plane from the center of the box
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, boxCenter)
      .multiply(new THREE.Vector3(1, 0, 1))
      .normalize();

    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    this.camera.position.copy(
      direction.multiplyScalar(distance).add(boxCenter)
    );

    // pick some near and far values for the frustum that
    // will contain the box.
    this.camera.near = boxSize / 100;
    this.camera.far = boxSize * 100;

    this.camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    this.camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  }

  attachButtonClickHandlers() {
    const btnPause = document.querySelector(".btn-pause");
    if (btnPause) {
      btnPause.addEventListener("click", () => {
        if (btnPause.textContent === "Pause") {
          this.isPaused = true;
          btnPause.textContent = "Play";
        } else {
          this.isPaused = false;
          btnPause.textContent = "Pause";
        }
      });
    }

    document.querySelector(".btn-gencor")?.addEventListener("click", () => {
      this.vrms.kazuki?.scene.traverse(this.sendOptimizedCoRDataRequests(true));
    });

    document.querySelectorAll(".btn-skinning-method").forEach((el: Element) => {
      el.addEventListener("click", () => {
        if (
          el.classList.contains("selected") ||
          el.classList.contains("disabled")
        )
          return;

        switch (el.textContent) {
          case "LBS": {
            this.skinningType = SkinningType.LINEAR_BLEND;
            break;
          }
          case "DQS": {
            this.skinningType = SkinningType.DUAL_QUATERNION;
            break;
          }
          case "SBS": {
            this.skinningType = SkinningType.SPHERICAL_BLEND;
            break;
          }
          case "COR": {
            this.skinningType = SkinningType.OPTIMIZED_COR;
            break;
          }
        }

        document
          .querySelector(".btn-skinning-method.selected")
          ?.classList.remove("selected");
        el.classList.add("selected");
      });
    });
  }

  update(elapsed: number, dt: number) {
    elapsed *= 2.3;

    if (this.pressedKeys.has("ArrowRight")) {
      this.controls.target.x -= 0.01;
      this.camera.position.x -= 0.01;
    }
    if (this.pressedKeys.has("ArrowLeft")) {
      this.controls.target.x += 0.01;
      this.camera.position.x += 0.01;
    }
    if (this.pressedKeys.has("ArrowUp")) {
      this.controls.target.y += 0.01;
      this.camera.position.y += 0.01;
    }
    if (this.pressedKeys.has("ArrowDown")) {
      this.controls.target.y -= 0.01;
      this.camera.position.y -= 0.01;
    }
    this.controls.update();

    const renderer = this.renderer;

    const camera = this.camera;
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    this.vrms.kazuki?.humanoid?.setPose(this.animation(elapsed));
    this.vrms.kazuki?.scene.traverse(this.traverseCallback);

    renderer.render(this.scene, camera);
  }
}
