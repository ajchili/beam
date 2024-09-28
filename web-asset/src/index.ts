import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const raycaster = new THREE.Raycaster();
const raycasterOrigin = new THREE.Vector3();
const raycasterDirection = new THREE.Vector3();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

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
    color: 0xff0000,
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

function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  for (let child of scene.children) {
    if (child.name === "LiDAR") {
      const distance = child.position.distanceTo(camera.position);
      if (distance > 25) {
        child.removeFromParent();
      }
      child.getWorldPosition(raycasterOrigin);
      child.getWorldDirection(raycasterDirection);

      raycaster.set(raycasterOrigin, raycasterDirection);

      const hits = raycaster.intersectObjects([cube, wall], false);
      if (hits.length > 0) {
        child.name = "";
        continue;
      }

      child.position.add(raycasterDirection.multiplyScalar(-0.1));
    }
  }

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
renderer.domElement.addEventListener("click", () => {
  if (!controls.isLocked) {
    controls.lock();
  } else {
    controls.unlock();
  }
});

const createProjectile = () => {
  const pointDistance = 0.25;
  for (let i = 0; i < 3; i++) {
    const xOffset = -0.25 + i * pointDistance;
    for (let j = 0; j < 3; j++) {
      const yOffset = -0.25 + j * pointDistance;
      const geometry = new THREE.SphereGeometry(0.05);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const mesh = new THREE.Mesh(geometry, material);
      const vector = new THREE.Vector3(0, 0, -1);

      vector.applyQuaternion(camera.quaternion);
      camera.getWorldPosition(mesh.position);
      vector.applyQuaternion(mesh.quaternion);

      mesh.name = "LiDAR";
      mesh.applyQuaternion(camera.quaternion);
      mesh.position.x += xOffset;
      mesh.position.y += yOffset;
      scene.add(mesh);
    }
  }
};

// TODO: Figure out better key commands
window.addEventListener("keydown", (e) => {
  if (e.key === "a") {
    camera.translateX(-0.1);
  } else if (e.key === "d") {
    camera.translateX(0.1);
  }
  if (e.key === "w") {
    camera.translateZ(-0.1);
  } else if (e.key === "s") {
    camera.translateZ(0.1);
  }
});

window.addEventListener("keypress", (e) => {
  switch (e.key) {
    case " ":
      createProjectile();
      break;
  }
});
