import * as THREE from "three";

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

export const buildMap = ({
  pillarPositions,
  enemyPositions,
}: {
  pillarPositions: [number, number][];
  enemyPositions: [number, number][];
}) => {
  const map = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000, 1, 1),
    whiteMesh
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y -= 1;
  map.add(ground);

  pillarPositions.forEach((position) => map.add(buildPillarAt(...position)));
  enemyPositions.forEach((position) => map.add(buildEnemyAt(...position)));

  return map;
};
