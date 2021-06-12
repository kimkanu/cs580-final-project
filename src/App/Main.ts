import { RawVector3, VRM, VRMUtils } from "@pixiv/three-vrm";

import { pipe } from "fp-ts/function";
import * as _ from "lodash";
import { SVD } from "svd-js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import * as A from "./Types";

import * as Ani from "~/Animation";
import { getVertexShader } from "~/Shader";
import { SkinningType } from "~/Shader/Types";
import { store } from "~/Store";
import { delay } from "~/Util/Delay";
import { DualQuaternion } from "~/Util/DualQuaternion";
import { combinations } from "~/Util/Iteration";
import {
  isShaderMaterial,
  isSkinnedMesh,
  resizeRendererToDisplaySize,
} from "~/Util/Three";

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
  backgroundColor: { [modelName: string]: string } = {
    kazuki: "#FDF6E3",
    ramune: "#1a3a6e",
  };

  // basic things
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  camera!: THREE.PerspectiveCamera;
  controls!: OrbitControls;
  scene: THREE.Scene;

  _mainModelName: string = "kazuki";

  skinningType: SkinningType = SkinningType.LINEAR_BLEND;
  isRenderStopped: boolean = false;
  vrms: {
    [modelName: string]: [
      VRM,
      {
        [meshUUID: string]: [
          THREE.SkinnedMesh,
          {
            [materialUUID: string]: THREE.ShaderMaterial;
          },
        ];
      },
    ];
  } = {};
  animation: Ani.Type = Ani.sayHello;
  recommendedAnimationSpeed = {
    [SkinningType.LINEAR_BLEND]: 2.5,
    [SkinningType.DUAL_QUATERNION]: 2.5,
    [SkinningType.SPHERICAL_BLEND]: 0.25,
    [SkinningType.OPTIMIZED_COR]: 0.9,
  };

  optimizedCoRBuffers: {
    [modelName: string]: {
      [meshName: string]: Float32Array;
    };
  } = {};
  optimizedCoRLoaded = false;

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
    scene.background = new THREE.Color(
      this.backgroundColor[this.mainModelName],
    );
    this.scene = scene;
  }

  async initialize() {
    this.setLights();

    await this.loadVRM(`/static/${this.mainModelName}.vrm`, this.mainModelName);

    this.attachButtonClickHandlers();
  }

  setLights() {
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
  }

  get mainModelName(): string {
    return this._mainModelName;
  }

  set mainModelName(name: string) {
    this.scene.remove(this.vrms[this.mainModelName][0].scene);

    this._mainModelName = name;
    this.scene.background = new THREE.Color(
      this.backgroundColor[this.mainModelName],
    );
    this.loadVRM(`/static/${name}.vrm`, name);
    document.querySelector(".btn-cor")?.classList.add("disabled");

    if (this.skinningType === SkinningType.OPTIMIZED_COR) {
      this.updateSkinningType(SkinningType.LINEAR_BLEND);

      document
        .querySelector(".btn-skinning-method.selected")
        ?.classList.remove("selected");
      document.querySelector(".btn-lbs")?.classList.add("selected");
    }
  }

  async loadVRM(url: string, modelName: string): Promise<VRM> {
    if (!this.vrms.hasOwnProperty(modelName)) {
      const gltfLoader = new GLTFLoader();
      const gltf = await gltfLoader.loadAsync(url);
      VRMUtils.removeUnnecessaryJoints(gltf.scene);
      const vrm = await VRM.from(gltf);
      this.vrms[modelName] = [vrm, {}];
    }

    const vrm = this.vrms[modelName][0];
    const root = vrm.scene;
    this.scene.add(vrm.scene);

    // compute the box that contains all the stuff
    // from root and below
    const box = new THREE.Box3().setFromObject(this.scene);
    const boxSize = box.getSize(new THREE.Vector3()).length();
    const boxCenter = box.getCenter(new THREE.Vector3());

    // set the camera to frame the box
    this.setCameraFitToFrame(boxSize, boxSize, boxCenter);

    // update the Trackball controls to handle the new size
    this.controls.maxDistance = boxSize * 10;
    this.controls.target.copy(boxCenter);
    this.controls.update();

    root.traverse((mesh: THREE.Object3D) => {
      if (isSkinnedMesh(mesh)) {
        this.vrms[modelName][1][mesh.uuid] = [
          mesh,
          Object.fromEntries(
            [mesh.material]
              .flat()
              .filter(isShaderMaterial)
              .map((material) => [material.uuid, material]),
          ),
        ];
      }
    });

    root.traverse(this.sendOptimizedCoRDataRequests(true));
    this.updateSkinningType(this.skinningType);

    this.checkOptimizedCoRLongPolling(modelName);

    return vrm;
  }

  async updateSkinningType(to: SkinningType) {
    this.isRenderStopped = true;

    const vertexShader = getVertexShader(to);

    // basic cleanup
    for (const [vrm, meshes] of Object.values(this.vrms)) {
      for (const [mesh, materials] of Object.values(meshes)) {
        for (const material of Object.values(materials)) {
          switch (this.skinningType) {
            case SkinningType.DUAL_QUATERNION: {
              material.uniforms.dualQuatBoneTexture?.value.dispose();
              delete material.uniforms.dualQuatBoneTexture;
              delete material.uniforms.boneCount;
              break;
            }
            case SkinningType.OPTIMIZED_COR:
            case SkinningType.SPHERICAL_BLEND: {
              material.uniforms.quatBoneTexture?.value.dispose();
              delete material.uniforms.quatBoneTexture;
              delete material.uniforms.boneCount;
              break;
            }
          }
        }
      }
    }

    for (const [modelName, [vrm, meshes]] of Object.entries(this.vrms)) {
      for (const [mesh, materials] of Object.values(meshes)) {
        // set uniform placeholders
        switch (to) {
          case SkinningType.DUAL_QUATERNION: {
            const boneArrayBuffer = new ArrayBuffer(
              4 * 4 * 2 * mesh.skeleton.bones.length,
            );
            const boneArray = new Float32Array(boneArrayBuffer);

            const boneTexture = new THREE.DataTexture(
              boneArray,
              2,
              mesh.skeleton.bones.length,
              THREE.RGBAFormat,
              THREE.FloatType,
            );

            for (const material of Object.values(materials)) {
              material.uniforms.dualQuatBoneTexture = {
                value: boneTexture,
              };
              material.uniforms.boneCount = {
                value: mesh.skeleton.bones.length,
              };
            }
            break;
          }
          case SkinningType.OPTIMIZED_COR:
          case SkinningType.SPHERICAL_BLEND: {
            const BYTES_IN_FLOAT = 4;
            const FLOATS_IN_RGBA = 4;
            const COR_ATTR_DIM = 3;

            const boneArrayBuffer = new ArrayBuffer(
              FLOATS_IN_RGBA * BYTES_IN_FLOAT * mesh.skeleton.bones.length,
            );
            const boneArray = new Float32Array(boneArrayBuffer);

            const boneTexture = new THREE.DataTexture(
              boneArray,
              1,
              mesh.skeleton.bones.length,
              THREE.RGBAFormat,
              THREE.FloatType,
            );

            // set uniforms
            for (const material of Object.values(materials)) {
              material.uniforms.quatBoneTexture = {
                value: boneTexture,
              };
              material.uniforms.boneCount = {
                value: mesh.skeleton.bones.length,
              };
            }

            // set attributes
            const centerOfRotationBuffer = new ArrayBuffer(
              COR_ATTR_DIM *
                BYTES_IN_FLOAT *
                mesh.geometry.attributes.position.count,
            );
            mesh.geometry.setAttribute(
              "centerOfRotation",
              new THREE.BufferAttribute(
                new Float32Array(centerOfRotationBuffer),
                COR_ATTR_DIM,
                false,
              ),
            );

            break;
          }
        }

        if (to === SkinningType.OPTIMIZED_COR) {
          const attr = mesh.geometry.attributes.centerOfRotation;
          (attr.array as Float32Array).set(
            this.optimizedCoRBuffers[modelName][mesh.name],
          );
        }

        for (const material of Object.values(materials)) {
          material.vertexShader = vertexShader;
          material.needsUpdate = true;
        }
      }
    }

    this.skinningType = to;

    this.isRenderStopped = false;
    this.updateUniformsAndAttributes();
  }

  updateUniformsAndAttributes() {
    if (this.isRenderStopped) return;

    // update uniforms
    if (this.skinningType !== SkinningType.LINEAR_BLEND) {
      for (const [vrm, meshes] of Object.values(this.vrms)) {
        for (const [mesh, materials] of Object.values(meshes)) {
          for (const material of Object.values(materials)) {
            switch (this.skinningType) {
              case SkinningType.DUAL_QUATERNION: {
                const dualQuatBoneArray = _.range(mesh.skeleton.bones.length)
                  .map((i) =>
                    DualQuaternion.fromMat4(
                      new THREE.Matrix4()
                        .fromArray(mesh.skeleton.boneMatrices, 16 * i)
                        .premultiply(mesh.bindMatrix)
                        .multiply(mesh.bindMatrixInverse),
                    ),
                  )
                  .map((dq) => dq.toArray())
                  .flat();

                const dataTexture = material.uniforms.dualQuatBoneTexture
                  ?.value as THREE.DataTexture;

                dataTexture.image.data.set(dualQuatBoneArray);
                dataTexture.needsUpdate = true;

                break;
              }

              case SkinningType.SPHERICAL_BLEND:
              case SkinningType.OPTIMIZED_COR: {
                const quatBoneArray = _.range(mesh.skeleton.bones.length)
                  .map((i) =>
                    new THREE.Quaternion().setFromRotationMatrix(
                      new THREE.Matrix4()
                        .fromArray(mesh.skeleton.boneMatrices, 16 * i)
                        .premultiply(mesh.bindMatrix)
                        .multiply(mesh.bindMatrixInverse),
                    ),
                  )
                  .map((q) => q.toArray())
                  .flat();

                const dataTexture = material.uniforms.quatBoneTexture
                  ?.value as THREE.DataTexture;

                dataTexture.image.data.set(quatBoneArray);
                dataTexture.needsUpdate = true;

                break;
              }
            }
          }

          if (this.skinningType === SkinningType.SPHERICAL_BLEND) {
            const centerOfRotationTable = new Map<number, RawVector3>();
            const skinIndexAttr = mesh.geometry.getAttribute("skinIndex");
            const skinIndexArray = Array.from(
              skinIndexAttr.array as Uint16Array,
            );
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
                    (s, i) => skinWeightAttr.array[4 * vertexIndex + i] !== 0,
                  ),
                (l) => _.sortBy(l),
                (l) => _.sortedUniq(l),
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
                    [amb(2), amb(6), amb(10)],
                  );
                  svdConst.push(-amb(12), -amb(13), -amb(14));
                }
              }

              const leastSquares = (() => {
                if (svdCoeff.length === 0) return [0, 0, 0] as RawVector3;

                const dot = (a: number[], b: number[]) => {
                  if (a.length !== b.length)
                    throw new Error(
                      "Dot product of two vectors of different dimensions.",
                    );
                  return _.range(a.length)
                    .map((i) => a[i] * b[i])
                    .reduce((x, y) => x + y, 0);
                };

                // XXX: 0.1 is enough to get a seemingly good result
                const { u, v, q } = SVD(svdCoeff, true, true, 0.1);
                return q
                  .map((qi, i) => {
                    return qi > 1e-4
                      ? new THREE.Vector3(...v.map((r) => r[i]))
                          .multiplyScalar(
                            dot(
                              u.map((r) => r[i]), // i-th column of u
                              svdConst,
                            ) / qi,
                          )
                          .toArray()
                      : [0, 0, 0];
                  })
                  .reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [
                    0,
                    0,
                    0,
                  ]) as RawVector3;
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

            const attr = mesh.geometry.attributes.centerOfRotation;
            (attr.array as Float32Array).set(centerOfRotation.flat());
            attr.needsUpdate = true;
          }
        }
      }
    }
  }

  sendOptimizedCoRDataRequests = (checkOnly: boolean) => async (
    mesh: THREE.Object3D,
  ) => {
    if (
      this.optimizedCoRBuffers.hasOwnProperty(this.mainModelName) &&
      Object.keys(this.optimizedCoRBuffers[this.mainModelName]).length > 0 // XXX: Not precise
    ) {
      return;
    }
    if (isSkinnedMesh(mesh)) {
      mesh.skeleton.update();

      const skinIndex = Array.from(
        mesh.geometry.getAttribute("skinIndex").array,
      );
      const skinWeight = Array.from(
        mesh.geometry.getAttribute("skinWeight").array,
      );

      const body: OptimizedCoRRequestBody = {
        checkOnly,
        modelName: this.mainModelName,
        meshName: mesh.name,
        vertices: Array.from(mesh.geometry.getAttribute("position").array),
        triangleIndices: Array.from(mesh.geometry.index?.array ?? []),
        skinWeights: _.chunk(
          skinWeight,
          4,
        ).map((singleVertexSkinWeight, vertexCount) =>
          singleVertexSkinWeight
            .map(
              (weight, weightCount) =>
                [skinIndex[4 * vertexCount + weightCount], weight] as [
                  number,
                  number,
                ],
            )
            .filter(([index, weight]) => weight !== 0),
        ),
      };
      const response = await fetch(process.env.SERVER!, {
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
        }`,
      );
    }
  };

  checkOptimizedCoRLongPolling = async (modelName: string): Promise<void> => {
    if (!store.getState().server.isAlive) {
      await delay(1000);
      return this.checkOptimizedCoRLongPolling(modelName);
    }
    if (!document.querySelector(".btn-cor")) {
      await delay(1000);
      return this.checkOptimizedCoRLongPolling(modelName);
    }
    if (
      this.optimizedCoRBuffers.hasOwnProperty(modelName) &&
      Object.keys(this.optimizedCoRBuffers[modelName]).length > 0 // XXX: Not precise
    ) {
      setTimeout(() => {
        document.querySelector(".btn-cor")?.classList.remove("disabled");
      }, 100);
      return;
    }

    fetch(`${process.env.SERVER!}/${modelName}`)
      .then((r) => r.json())
      .then(async ({ completed }: { completed: boolean }) => {
        try {
          if (!completed) {
            console.log("Not completed");
            await delay(10000);
            await this.checkOptimizedCoRLongPolling(modelName);
          } else {
            console.log("Optimized CoR data generation completed!");
            await this.fetchOptimizedCoRData(modelName);

            // XXX: wait for an enough amount of time for data textures
            // XXX: to be loaded
            await delay(1500);

            // Enable COR button
            document.querySelector(".btn-cor")?.classList.remove("disabled");
          }
        } catch (e) {
          console.error(e);
        }
      });
  };

  fetchOptimizedCoRData = async (modelName: string) => {
    if (this.optimizedCoRBuffers.hasOwnProperty(modelName)) {
      return;
    }

    this.optimizedCoRBuffers[modelName] = {};

    this.vrms[modelName]?.[0].scene.traverse(async (mesh: THREE.Object3D) => {
      if (isSkinnedMesh(mesh)) {
        const buffer = await (
          await fetch(`${process.env.SERVER!}/${modelName}/${mesh.name}.corbin`)
        ).arrayBuffer();
        try {
          this.optimizedCoRBuffers[modelName][mesh.name] = new Float32Array(
            buffer,
          );
        } catch (e) {
          throw new Error(
            `Mesh data for ${mesh.name} is corrupted. Please try to regenerate.`,
          );
        }

        console.log(
          `Optimized CoR buffer for the mesh ${mesh.name} was fetched.`,
        );
      }
    });
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
      direction.multiplyScalar(distance).add(boxCenter),
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

    const btnModel = document.querySelector(".btn-model");
    if (btnModel) {
      btnModel.addEventListener("click", () => {
        if (btnModel.textContent === "Kazuki") {
          this.mainModelName = "ramune";
          btnModel.textContent = "Ramune";
        } else {
          this.mainModelName = "kazuki";
          btnModel.textContent = "Kazuki";
        }
      });
    }

    const btnAni = document.querySelector(".btn-ani");
    if (btnAni) {
      btnAni.addEventListener("click", () => {
        if (btnAni.textContent === "Hello") {
          this.animation = Ani.standOnOneLeg;
          btnAni.textContent = "One Leg";
        } else {
          this.animation = Ani.sayHello;
          btnAni.textContent = "Hello";
        }
      });
    }

    document.querySelector(".btn-gencor")?.addEventListener("click", () => {
      if (
        !document.querySelector(".btn-gencor")?.classList.contains("disabled")
      ) {
        this.vrms[this.mainModelName][0].scene.traverse(
          this.sendOptimizedCoRDataRequests(false),
        );
      }
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
            this.updateSkinningType(SkinningType.LINEAR_BLEND);
            break;
          }
          case "DQS": {
            this.updateSkinningType(SkinningType.DUAL_QUATERNION);
            break;
          }
          case "SBS": {
            this.updateSkinningType(SkinningType.SPHERICAL_BLEND);
            break;
          }
          case "COR": {
            this.updateSkinningType(SkinningType.OPTIMIZED_COR);
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
    elapsed *= this.recommendedAnimationSpeed[this.skinningType];
    this.controls.update();

    if (this.isRenderStopped) return;

    const renderer = this.renderer;

    const camera = this.camera;
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    this.vrms[this.mainModelName]?.[0].humanoid?.resetPose();
    this.vrms[this.mainModelName]?.[0].humanoid?.setPose(
      this.animation(elapsed),
    );
    this.updateUniformsAndAttributes();

    renderer.render(this.scene, camera);
  }
}
