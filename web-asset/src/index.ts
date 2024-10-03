import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";

import { Controls } from "./controls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const stats = new Stats();
document.body.append(stats.dom);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new Controls(camera, renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const createRoomObjects = () => {
  const geometry = new THREE.BoxGeometry(5, 5, 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
  });
  const wall = new THREE.Mesh(geometry, material);
  wall.translateZ(-1);
  scene.add(wall);
  return wall;
};

const wall = createRoomObjects();

camera.position.z = 5;

renderer.domElement.addEventListener("click", () => {
  if (!controls.isLocked) {
    controls.lock();
  } else {
    controls.unlock();
  }
});

const pointGeometry = new THREE.SphereGeometry(0.01, 1, 1);
const maxPoints = 50_000;
const vertexCount = 512;
const indexCount = 1024;
const batchedMesh = new THREE.BatchedMesh(
  maxPoints,
  vertexCount,
  indexCount,
  new THREE.MeshBasicMaterial()
);
const pointGeometryId = batchedMesh.addGeometry(pointGeometry);
batchedMesh.frustumCulled = false;
scene.add(batchedMesh);
const instances: number[] = [];
let offset = 0;

let lastProjection = 0;

const projectBatched = () => {
  const rows = 75;
  const cols = 75;

  if (Date.now() - lastProjection < 1000) {
    return;
  }
  lastProjection = Date.now();

  const raycaster = new THREE.Raycaster();
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = (i / rows) * 2 - 1 + Math.random() * 0.05;
      const y = (j / cols) * 2 - 1 + Math.random() * 0.05;
      const coords = new THREE.Vector2(x, y);
      raycaster.setFromCamera(coords, camera);
      const hits = raycaster.intersectObjects([cube, wall], false);
      if (hits.length > 0) {
        offset++;
        let id: number = offset;
        if (offset < batchedMesh.maxInstanceCount) {
          id = batchedMesh.addInstance(pointGeometryId);
        } else {
          id = offset % batchedMesh.maxInstanceCount;
        }
        if (
          "material" in hits[0].object &&
          // @ts-expect-error
          "color" in hits[0].object.material
        ) {
          // @ts-expect-error
          batchedMesh.setColorAt(id, hits[0].object.material.color);
        }
        instances.push(id);
        const matrix = new THREE.Matrix4();
        matrix.setPosition(hits[0].point);
        batchedMesh.setMatrixAt(id, matrix);
      }
    }
  }
};

function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  stats.update();

  if (controls.pressedKeys.has("Space")) {
    projectBatched();
  }
  controls.handleMovement();

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
