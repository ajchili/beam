import * as THREE from "three";

const map = new THREE.Group();
const whiteMesh = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0,
});
const redMesh = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0,
});

const buildPillarAt = (x: number, z: number) => {
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(1, 25, 1), whiteMesh);
  pillar.name = "pillar";
  pillar.position.set(x, 11.5, z);
  return pillar;
};

const buildEnemyAt = (x: number, z: number) => {
  const enemy = new THREE.Mesh(new THREE.TorusKnotGeometry(), redMesh);
  enemy.name = "enemy";
  enemy.position.set(x, 0, z);
  return enemy;
};

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000, 1, 1),
  whiteMesh
);
ground.rotation.x = -Math.PI / 2;
ground.position.y -= 1;
map.add(ground);

for (let i = 0; i < 1000; i++) {
  const pillar = buildPillarAt(
    Math.floor(-250 + 500 * Math.random()),
    Math.floor(-250 + 500 * Math.random())
  );
  map.add(pillar);
}

for (let i = 0; i < 10; i++) {
  const pillar = buildEnemyAt(
    Math.floor(-250 + 500 * Math.random()),
    Math.floor(-250 + 500 * Math.random())
  );
  map.add(pillar);
}

// map.add(buildEnemyAt(0, 0));

export { map };
