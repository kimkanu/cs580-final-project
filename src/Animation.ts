import { VRMPose, VRMSchema, RawVector4 } from "@pixiv/three-vrm";

import * as THREE from "three";

import { cosineRepeation } from "~/Util/Animation";

export type Type = (elapsed: number) => VRMPose;

export const sayHello: Type = (elapsed) => ({
  [VRMSchema.HumanoidBoneName.LeftUpperLeg]: {
    rotation: [0.0, 0.0, -0.1, 1],
  },
  [VRMSchema.HumanoidBoneName.LeftUpperArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          0,
          0,
          cosineRepeation(-Math.PI / 4, Math.PI / 4, Math.PI / 4)(elapsed),
          "XYZ",
        ),
      )
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftLowerArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          cosineRepeation(0, Math.PI / 1.3)(elapsed),
          0,
          cosineRepeation(0, Math.PI / 8)(elapsed),
          "XYZ",
        ),
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
          cosineRepeation(-Math.PI / 6, 0, 0)(elapsed),
          0,
          0,
          "XYZ",
        ),
      )
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftShoulder]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          0,
          0,
          cosineRepeation(-Math.PI / 6, 0, 0)(elapsed),
          "XYZ",
        ),
      )
      .toArray() as RawVector4,
    position: [
      cosineRepeation(-0.025, 0, 0)(elapsed),
      cosineRepeation(0, 0.08)(elapsed),
      0,
    ],
  },
  [VRMSchema.HumanoidBoneName.UpperChest]: {
    position: [cosineRepeation(0, 0.02)(elapsed), 0, 0],
  },
  [VRMSchema.HumanoidBoneName.Neck]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          0,
          0,
          cosineRepeation(-Math.PI / 24, 0, 0)(elapsed),
          "XYZ",
        ),
      )
      .toArray() as RawVector4,
  },
});

export const standOnOneLeg: Type = (elapsed) => ({
  [VRMSchema.HumanoidBoneName.LeftUpperLeg]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(-Math.PI / 6, 0, 0, "XYZ"))
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftLowerLeg]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          cosineRepeation(-Math.PI / 2, 0, 0)(elapsed),
          0,
          0,
          "XYZ",
        ),
      )
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.LeftUpperArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          0,
          0,
          cosineRepeation(0, Math.PI / 15, Math.PI / 24, 1.5)(elapsed),
          "XYZ",
        ),
      )
      .toArray() as RawVector4,
  },
  [VRMSchema.HumanoidBoneName.RightUpperArm]: {
    rotation: new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          0,
          0,
          cosineRepeation(-Math.PI / 15,0 , -Math.PI / 24, 1.5)(elapsed),
          "XYZ",
        ),
      )
      .toArray() as RawVector4,
  },
});
