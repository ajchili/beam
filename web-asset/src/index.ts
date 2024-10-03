import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

let scan = false;
let moveLeft = false;
let moveRight = false;
let moveForward = false;
let moveBackwards = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

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
const controls = new PointerLockControls(camera, renderer.domElement);

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
const maxPoints = 25_000;
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

const projectBatched = () => {
  const rows = 75;
  const cols = 75;

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

const onKeyDown = (event: KeyboardEvent) => {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = true;
      break;

    case "ArrowLeft":
    case "KeyA":
      moveLeft = true;
      break;

    case "ArrowDown":
    case "KeyS":
      moveBackwards = true;
      break;

    case "ArrowRight":
    case "KeyD":
      moveRight = true;
      break;

    case "Space":
      scan = true;
      break;
  }
};
const onKeyUp = (event: KeyboardEvent) => {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = false;
      break;

    case "ArrowLeft":
    case "KeyA":
      moveLeft = false;
      break;

    case "ArrowDown":
    case "KeyS":
      moveBackwards = false;
      break;

    case "ArrowRight":
    case "KeyD":
      moveRight = false;
      break;

    case "Space":
      scan = false;
      break;
  }
};

document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

let prevTime = performance.now();

function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  stats.update();

  if (scan) {
    projectBatched();
  }

  const delta = (performance.now() - prevTime) / 1000;

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  direction.z = Number(moveForward) - Number(moveBackwards);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize(); // this ensures consistent movements in all directions

  if (moveForward || moveBackwards) velocity.z -= direction.z * 100.0 * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  renderer.render(scene, camera);
  prevTime = performance.now();
}
renderer.setAnimationLoop(animate);
