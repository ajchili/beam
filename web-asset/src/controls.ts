import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export class Controls extends PointerLockControls {
  public pressedKeys = new Set<string>();
  protected velocity = new THREE.Vector3();
  protected direction = new THREE.Vector3();
  protected prevTime = performance.now();

  constructor(camera: THREE.Camera, domElement: HTMLElement) {
    super(camera, domElement);
    domElement.addEventListener("click", this.lockEventListener);
    document.addEventListener("keydown", this.keyDownEventListener);
    document.addEventListener("keyup", this.keyUpEventListener);
  }

  protected lockEventListener = () => {
    if (!this.isLocked) {
      this.lock();
    } else {
      this.unlock();
    }
  };

  protected keyDownEventListener = (event: KeyboardEvent) => {
    this.pressedKeys.add(event.code);
  };

  protected keyUpEventListener = (event: KeyboardEvent) => {
    this.pressedKeys.delete(event.code);
  };

  protected get shouldMoveLeft(): boolean {
    return this.pressedKeys.has("KeyA") || this.pressedKeys.has("ArrowLeft");
  }

  protected get shouldMoveRight(): boolean {
    return this.pressedKeys.has("KeyD") || this.pressedKeys.has("ArrowRight");
  }

  protected get shouldMoveForward(): boolean {
    return this.pressedKeys.has("KeyW") || this.pressedKeys.has("ArrowU[");
  }

  protected get shouldMoveBackward(): boolean {
    return this.pressedKeys.has("KeyS") || this.pressedKeys.has("ArrowDown");
  }

  public handleMovement() {
    const delta = (performance.now() - this.prevTime) / 1000;

    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    this.direction.z =
      Number(this.shouldMoveForward) - Number(this.shouldMoveBackward);
    this.direction.x =
      Number(this.shouldMoveRight) - Number(this.shouldMoveLeft);
    this.direction.normalize();

    if (this.shouldMoveForward || this.shouldMoveBackward) {
      this.velocity.z -= this.direction.z * 100.0 * delta;
    }
    if (this.shouldMoveLeft || this.shouldMoveRight) {
      this.velocity.x -= this.direction.x * 100.0 * delta;
    }

    this.moveRight(-this.velocity.x * delta);
    this.moveForward(-this.velocity.z * delta);

    this.prevTime = performance.now();
  }
}
