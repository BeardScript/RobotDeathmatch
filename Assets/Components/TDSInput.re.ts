import RapierThirdPersonController from '@RE/RogueEngine/rogue-rapier/Components/Controllers/RapierThirdPersonController.re';
import * as RE from 'rogue-engine';
import * as THREE from 'three';
import TDSController from './TDSController.re';

RE.Input.bindButton("Fire", {Mouse: 0});
RE.Input.bindButton("Aim", {Mouse: 2});
RE.Input.bindAxes("Gamepad.Aim", {Gamepad: {x: 2, y: 3}});
RE.Input.bindAxes("Touch.Aim", {Touch: {area: "right", normalize: [7, 7]}});

export default class TDSInput extends RE.Component {
  @TDSController.require()
  tdsController: TDSController;

  @RapierThirdPersonController.require()
  tpController: RapierThirdPersonController;

  get characterController() {
    return this.tpController.characterController;
  }

  isShooting = new THREE.Vector3();

  raycaster = new THREE.Raycaster();
  floor: THREE.Mesh;
  tgt = new THREE.Object3D();

  mousePos = new THREE.Vector2();

  worldDir = new THREE.Vector3();

  start() {
    RE.Runtime.rogueDOMContainer.onclick = () => {};
    RE.Runtime.rogueDOMContainer.oncontextmenu = e => e.preventDefault();

    this.floor = RE.Runtime.scene.getObjectByName("TargetArea") as THREE.Mesh;
    RE.Runtime.scene.add(this.tgt);

    RE.Runtime.uiContainer.style.cursor = "crosshair";
  }

  update() {
    if (!this.characterController?.body) return;

    this.characterController.speed = this.tdsController.isAiming ? this.tdsController.aimSpeed : this.tdsController.speed;

    this.tdsController.movementDirection.copy(this.characterController.movementDirection);

    let shootInput = Boolean(RE.Input.getPressed("Fire"));
    let aimInput = Boolean(RE.Input.getPressed("Aim"));
    let look = RE.Input.getAxes("Gamepad.Aim");
    let touchAim = RE.Input.getAxes("Touch.Aim");

    RE.Input.gamepads.forEach(gp => gp.deadZone = 0.2);

    if (Math.abs(touchAim.x) > 0 || Math.abs(touchAim.y) > 0) {
      this.tdsController.isAiming = true;
      this.tgt.position.copy(this.object3d.position);
      this.tgt.position.x -= touchAim.x;
      this.tgt.position.z -= touchAim.y;
      this.tgt.position.y = this.floor.position.y;
      this.tpController.target = this.tgt;

      const length = Math.abs(touchAim.x) + Math.abs(touchAim.y);

      if (length < 7) {
        this.tdsController.isShooting.set(0,0,0);
        return;
      }

      this.shoot();
    }
    else if (Math.abs(look.x) >= 0.2 || Math.abs(look.y) >= 0.2) {
      this.tdsController.isAiming = true;
      this.tgt.position.copy(this.object3d.position);
      this.tgt.position.x -= look.x;
      this.tgt.position.z -= look.y;
      this.tgt.position.y = this.floor.position.y;
      this.tpController.target = this.tgt;

      if (!shootInput) {
        this.tdsController.isShooting.set(0,0,0);
        return;
      }

      this.shoot();
    }
    else if ((shootInput || aimInput) && this.floor) {
      this.tdsController.isAiming = true;
      this.updateMousePosition();

      this.raycaster.setFromCamera(this.mousePos, RE.Runtime.camera);

      const res = this.raycaster.intersectObject(this.floor, true);

      if (res.length > 0) {
        this.tgt.position.copy(res[0].point);
        this.tpController.target = this.tgt;

        if (!shootInput && aimInput) {
        this.tdsController.isShooting.set(0,0,0);
          return;
        }

        this.shoot();
      }
    } else {
      this.tdsController.isAiming = false;
      this.tpController.target = undefined;
      this.tdsController.isShooting.set(0,0,0);
    }
  }

  shoot() {
    RE.onNextFrame(() => RE.onNextFrame(() => {
      const qDot = this.object3d.quaternion.dot(this.tpController.targetRotation);

      if (this.tdsController.isShooting.length() > 0 || Math.abs(qDot) >= 1) {
        this.object3d.getWorldDirection(this.tdsController.isShooting);
      } else {
        this.tdsController.isShooting.set(0,0,0);
      }
    }));
  }

  updateMousePosition() {
    const rect = RE.App.sceneController.domRect;

    const mouseX = RE.Input.mouse.x;
    const mouseY = RE.Input.mouse.y;

    if( mouseX > ( rect.left + rect.width ) || mouseX < rect.left )
      return;
      
    if( mouseY > ( rect.top + rect.height ) || mouseY < rect.top )
      return;

    this.mousePos.set(
      ( ( mouseX - rect.left ) / rect.width ) * 2 - 1,
      -( ( mouseY - rect.top ) / rect.height ) * 2 + 1
    );
  }
}

RE.registerComponent(TDSInput);
        