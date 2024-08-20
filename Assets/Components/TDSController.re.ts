import * as RE from 'rogue-engine';
import * as THREE from 'three';
import Weapon from './Weapon.re';
import RapierKinematicCharacterController from '@RE/RogueEngine/rogue-rapier/Components/RapierKinematicCharacterController.re';

@RE.registerComponent
export default class TDSController extends RE.Component {
  @RE.props.component(Weapon) weapon: Weapon;

  @RE.props.animation() idleClip: THREE.AnimationClip;
  idleAction: THREE.AnimationAction;
  @RE.props.animation() runClip: THREE.AnimationClip;
  runAction: THREE.AnimationAction;

  @RE.props.animation() idleShootClip: THREE.AnimationClip;
  idleShootAction: THREE.AnimationAction;
  @RE.props.animation() runShootClip: THREE.AnimationClip;
  runShootAction: THREE.AnimationAction;

  @RapierKinematicCharacterController.require()
  characterController: RapierKinematicCharacterController;

  @RE.props.num() speed = 8;
  @RE.props.num() aimSpeed = 5;

  isAiming = false;

  activeAction: THREE.AnimationAction;
  animationMixer = new THREE.AnimationMixer(this.object3d);

  isShooting = false;
  shootDir = new THREE.Vector3();

  movementDirection = new THREE.Vector3()

  isMoving() {
    const dir = this.movementDirection;
    return Math.abs(dir.x) > 0 || Math.abs(dir.z) > 0;
  }

  start() {
    this.idleAction = this.createAction(this.idleClip) as THREE.AnimationAction;
    this.runAction = this.createAction(this.runClip) as THREE.AnimationAction;
    this.idleShootAction = this.createAction(this.idleShootClip) as THREE.AnimationAction;
    this.runShootAction = this.createAction(this.runShootClip) as THREE.AnimationAction;

    this.weapon.isEquiped = true;
    this.weapon.parentObject = this.object3d;
  }

  createAction(clip: THREE.AnimationClip) {
    if (!clip) return;

    const action = this.animationMixer.clipAction(clip);
    action.play();
    this.setWeight(action, 0);

    return action;
  }

  setWeight(action: THREE.AnimationAction, weight: number) {
    action.enabled = true;
    action.time = 0;
    action.setEffectiveWeight(weight);
  }

  worldDir = new THREE.Vector3();

  afterUpdate() {
    if (this.isMoving()) {
      if (this.activeAction === this.runAction || this.activeAction === this.runShootAction) {
        this.activeAction.setEffectiveWeight(this.movementDirection.length());
      } else {
        this.mix(this.isShooting ? this.runShootAction : this.runAction);
      }
    }
    else if (!this.isShooting) {
      this.activeAction !== this.idleAction && this.mix(this.idleAction);
    } else if (this.isShooting) {
      this.activeAction !== this.idleShootAction && this.mix(this.idleShootAction, 0.001);
    }

    this.animationMixer.update(RE.Runtime.deltaTime);
  }

  mix(action: THREE.AnimationAction, transitionTime: number = 0.1, warp = true, weight = 1) {
    if (!this.activeAction) {
      this.activeAction = action;
    }

    this.activeAction.reset();
    this.activeAction.enabled = true;

    this.setWeight(action, weight);

    action.reset();
    action.crossFadeFrom(this.activeAction, transitionTime, warp);
    // action.setEffectiveTimeScale(1);

    this.activeAction = action;
  }
}
        