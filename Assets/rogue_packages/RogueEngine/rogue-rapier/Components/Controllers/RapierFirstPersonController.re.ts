import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RapierKinematicCharacterController from '@RE/RogueEngine/rogue-rapier/Components/RapierKinematicCharacterController.re';

export default class RapierFirstPersonController extends RE.Component {
  @RE.props.vector3() cameraOffset = new THREE.Vector3(0, 1.6, 0.2);
  @RE.props.num() minPolarAngle = -60;
  @RE.props.num() maxPolarAngle = 70;
  @RE.props.num() near = 0.1;
  @RE.props.num() far = 500;
  @RE.props.num() fov = 50;
  
  cameraHandle = new THREE.Object3D();
  camera = new THREE.PerspectiveCamera();

  private localFWD = new THREE.Vector3();
  private appliedDirection = new THREE.Vector3();
  private dummy = new THREE.Object3D();
  private camDirection = new THREE.Vector3();
  private targetDirection = new THREE.Vector3();
  private camRotationX = 0;
  private inputDirection = new THREE.Vector3();
  private inputVelocity = new THREE.Vector3();

  private _characterController: RapierKinematicCharacterController;

  get characterController() {
    if (!this._characterController) {
      return RapierKinematicCharacterController.get(this.object3d);
    }
    return this._characterController;
  }

  awake() {
    if (!RE.Runtime.isRunning) return;

    this.camera = new THREE.PerspectiveCamera();
    this.cameraHandle.add(this.camera);
    this.object3d.add(this.cameraHandle);
    this.camera.rotateY(THREE.MathUtils.degToRad(180));

    this.setCameraSettings();

    RE.App.activeCamera = this.camera.uuid;
  }

  start() {
    RE.Runtime.rogueDOMContainer.onclick = () => RE.Runtime.isRunning && RE.Input.mouse.lock();
  }

  update() {
    this.object3d.getWorldDirection(this.localFWD);

    this.characterController.movementDirection.x = 0
    this.characterController.movementDirection.y = 0
    this.characterController.movementDirection.z = 0

    this.moveCamera();
    this.setRotation();
    this.translate();

    this.setCameraSettings();
  }

  moveCamera() {
    if (!this.cameraHandle) return;

    this.cameraHandle.position.y = this.cameraOffset.y;
    this.cameraHandle.position.z = this.cameraOffset.z;

    let {y: rvAxis} = RE.Input.getAxes("Look");

    this.camRotationX = rvAxis * RE.Runtime.deltaTime;

    this.cameraHandle.rotateX(this.camRotationX);

    const maxPolarAngle = THREE.MathUtils.degToRad(this.maxPolarAngle);
    const minPolarAngle = THREE.MathUtils.degToRad(this.minPolarAngle);

    if (this.cameraHandle.rotation.x > maxPolarAngle) {
      this.cameraHandle.rotation.x = maxPolarAngle;
    }

    if (this.cameraHandle.rotation.x < minPolarAngle) {
      this.cameraHandle.rotation.x = minPolarAngle;
    }
  }

  setRotation() {
    let {x: hAxis, y: vAxis} = RE.Input.getAxes("Move");
    let {x: rhAxis} = RE.Input.getAxes("Look");

    this.inputDirection.set(-hAxis, 0, -vAxis);
    this.inputDirection.length() > 1 && this.inputDirection.normalize();

    if (this.inputDirection.length() === 0) {
      this.camDirection.set(0, 0, 1);
    } else {
      this.camDirection.copy(this.inputDirection);
    }

    this.object3d.localToWorld(this.camDirection);
    this.camDirection.sub(this.object3d.position);
    this.camDirection.normalize();

    this.appliedDirection.copy(this.object3d.position).add(this.camDirection);
    this.dummy.position.copy(this.object3d.position);
    this.dummy.lookAt(this.appliedDirection);
    this.dummy.getWorldDirection(this.targetDirection);

    this.object3d.rotateY(-rhAxis * RE.Runtime.deltaTime);

    this.characterController.body.setRotation(this.object3d.quaternion, true);
  }

  translate() {
    this.inputVelocity.z = this.inputDirection.length();
    this.targetDirection.multiplyScalar(this.inputVelocity.length());

    this.characterController.movementDirection.set(
      this.targetDirection.x,
      RE.Input.getDown("Jump") ? 1 : 0,
      this.targetDirection.z,
    );
  }

  setCameraSettings() {
    if (!this.camera) return;

    if (this.camera.near !== this.near) {
      this.camera.near = this.near;
      this.camera.updateProjectionMatrix();
    }

    if (this.camera.far !== this.far) {
      this.camera.far = this.far;
      this.camera.updateProjectionMatrix();
    }

    if (this.camera.fov !== this.fov) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }
}

RE.registerComponent(RapierFirstPersonController);
        