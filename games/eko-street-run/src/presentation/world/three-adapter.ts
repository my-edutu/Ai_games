import * as THREE from "three";
import type { MainlandMorningPresentation, WorldNode } from "./types";

export interface ThreeMainlandMorningScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
}

function meshForNode(node: WorldNode): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(Math.max(0.02, node.width), Math.max(0.02, node.height), Math.max(0.02, node.depth));
  const material = new THREE.MeshStandardMaterial({
    color: node.color,
    roughness: node.kind.includes("road") ? 0.92 : 0.74,
    metalness: node.kind.includes("danfo") ? 0.12 : 0.02,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(node.x, node.y, node.z);
  mesh.name = `eko-${node.id}`;
  mesh.userData = { role: node.role, kind: node.kind, presentationOnly: true, critical: node.critical };
  mesh.castShadow = node.role === "player-anchor" || node.kind === "danfo-preview";
  mesh.receiveShadow = node.kind === "asphalt-road" || node.role === "safe-route";
  return mesh;
}

export function createThreeMainlandMorningScene(model: MainlandMorningPresentation): ThreeMainlandMorningScene {
  const scene = new THREE.Scene();
  scene.name = "eko-mainland-morning";
  scene.userData = { presentationOnly: true, authorityMutation: false, districtId: model.districtId, tick: model.tick };
  scene.background = new THREE.Color("#c8d9df");

  const camera = new THREE.PerspectiveCamera(model.camera.fov, model.camera.aspect, 0.1, 80);
  camera.name = "eko-game-camera";
  camera.position.set(model.camera.position.x, model.camera.position.y, model.camera.position.z);
  camera.lookAt(model.camera.target.x, model.camera.target.y, model.camera.target.z);
  camera.userData = { presentationOnly: true };

  const hemisphere = new THREE.HemisphereLight("#d9ecf2", "#8b735b", model.quality.tier === "low" ? 1.35 : 1.15);
  hemisphere.name = "eko-morning-hemi";
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight("#fff1cf", model.quality.tier === "low" ? 1.1 : 1.55);
  sun.name = "eko-morning-sun";
  sun.position.set(-5, 10, 6);
  sun.castShadow = model.quality.secondaryShadowScale > 0.5;
  scene.add(sun);

  for (const node of model.nodes) scene.add(meshForNode(node));

  return Object.freeze({ scene, camera });
}
