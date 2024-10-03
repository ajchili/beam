import * as THREE from "three";

const buildPillarAt = (x: number, z: number) => {
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 1), whiteMesh);
  pillar.name = "pillar";
  pillar.position.set(x, 4, z);
  return pillar;
};

const map = new THREE.Group();
const whiteMesh = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0,
});

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000, 1, 1),
  whiteMesh
);
ground.rotation.x = -Math.PI / 2;
ground.position.y -= 1;
map.add(ground);

for (let i = 0; i < 100; i++) {
  const pillar = buildPillarAt(
    -50 + 100 * Math.random(),
    -50 + 100 * Math.random()
  );
  map.add(pillar);
}

export { map };
