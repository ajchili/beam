import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";

import { Controls } from "./controls.js";

import { buildMap } from "./map2.js";

const getMapFromServer = async () => {
  const response = await fetch("/api/map");
  const mapData = await response.json();
  return buildMap(mapData);
};

getMapFromServer().then((map) => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0e0e0e, 0.05);
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    25
  );
  const stats = new Stats();
  document.body.childNodes.forEach((child) => document.body.removeChild(child));
  document.body.append(stats.dom);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  document.body.appendChild(renderer.domElement);
  const controls = new Controls(camera, renderer.domElement);

  scene.add(map);

  const players = new THREE.Group();
  scene.add(players);

  camera.position.z = 5;

  renderer.domElement.addEventListener("click", () => {
    if (!controls.isLocked) {
      controls.lock();
    } else {
      controls.unlock();
    }
  });

  const pointGeometry = new THREE.SphereGeometry(0.01, 1, 1);
  const maxPoints = 100_000;
  const vertexCount = 512;
  const indexCount = 1024;
  const batchedMesh = new THREE.BatchedMesh(
    maxPoints,
    vertexCount,
    indexCount,
    new THREE.MeshBasicMaterial()
  );
  batchedMesh.frustumCulled = false;
  const pointGeometryId = batchedMesh.addGeometry(pointGeometry);
  scene.add(batchedMesh);
  const instances: number[] = [];
  let offset = 0;

  const projectBatched = () => {
    const rows = 50;
    const cols = 50;

    const raycaster = new THREE.Raycaster();
    raycaster.far = camera.far;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (Math.random() > 0.05) continue;
        const x = (i / rows) * 2 - 1 + Math.random() * 0.05;
        const y = (j / cols) * 2 - 1 + Math.random() * 0.05;
        const coords = new THREE.Vector2(x, y);
        raycaster.setFromCamera(coords, camera);
        const hits = raycaster.intersectObjects(
          [...map.children, ...players.children],
          false
        );
        if (hits.length > 0) {
          const hit = hits[0];
          offset++;
          let id: number = offset;
          if (offset < batchedMesh.maxInstanceCount) {
            id = batchedMesh.addInstance(pointGeometryId);
          } else {
            id = offset % batchedMesh.maxInstanceCount;
          }
          if (offset > batchedMesh.maxInstanceCount * 2) {
            offset -= batchedMesh.maxInstanceCount;
          }
          if (
            "material" in hit.object &&
            // @ts-expect-error
            "color" in hit.object.material
          ) {
            // @ts-expect-error
            batchedMesh.setColorAt(id, hit.object.material.color);
          }
          instances.push(id);
          const matrix = new THREE.Matrix4();
          matrix.setPosition(hit.point);
          batchedMesh.setMatrixAt(id, matrix);
        }
      }
    }
  };

  function animate() {
    stats.update();

    if (controls.pressedKeys.has("Space")) {
      projectBatched();
    }
    controls.handleMovement();

    map.children
      .filter((child) => child.name === "enemy")
      .forEach((child) => {
        child.rotation.x += 0.01;
        child.rotation.y += 0.01;
      });

    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(animate);

  const connectToServer = () => {
    const { hostname, port } = window.location;
    const ws = new WebSocket(
      `ws://${hostname}:${hostname === "localhost" ? "8080" : port}`
    );
    let myId: string;
    ws.addEventListener("open", () => {
      players.children.forEach((child) => child.removeFromParent());
    });
    ws.addEventListener("close", () => connectToServer());
    ws.addEventListener("message", (event) => {
      const data = JSON.parse(event.data.toString());

      if ("id" in data) {
        myId = data.id;
      }

      if ("positions" in data) {
        for (const [id, { position }] of Object.entries(
          data.positions
        ) as any) {
          if (id === myId) {
            continue;
          }
          let player = players.children.find((child) => child.name === id);
          if (!player) {
            player = new THREE.Mesh(
              new THREE.SphereGeometry(),
              new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0,
              })
            );
            player.name = id;
            players.add(player);
          }
          player.position.set(position.x, position.y, position.z);
        }
      }
    });
    setInterval(() => {
      ws.send(
        JSON.stringify({
          position: camera.position,
        })
      );
    }, 100);
  };

  connectToServer();
});
