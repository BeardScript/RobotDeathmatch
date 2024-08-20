import { BaseModel } from '@RE/RogueEngine/rogue-croquet/BaseModel';
import * as RE from 'rogue-engine';
import * as THREE from 'three';
import CroquetView from '@RE/RogueEngine/rogue-croquet/CroquetView.re';
import { RogueCroquet } from '@RE/RogueEngine/rogue-croquet';
import RapierKinematicCharacterController from '@RE/RogueEngine/rogue-rapier/Components/RapierKinematicCharacterController.re';

@RogueCroquet.Model
export class TransformBroadcasterModel extends BaseModel {
  transform = {
    pos: new THREE.Vector3(0, 5, 10),
    rot: new THREE.Quaternion(),
  }

  speed = 8 * ((100 + 20)/1000);

  onBeforeUpdateProp(key: string, value: any) {
    if (key === "transform") {
      const pos = this.transform.pos.clone().setY(0);
      const newPos = value.pos.clone().setY(0);
      const dir = pos.sub(newPos);
      const moveAmt = dir.length();

      if (moveAmt > this.speed) {
        value.pos.addScaledVector(dir.normalize(), this.speed);
        return value;
      }
    }
  }
}

@RE.registerComponent
export default class TransformBroadcaster extends CroquetView {
  @RapierKinematicCharacterController.require()
  controller: RapierKinematicCharacterController;

  model: TransformBroadcasterModel;
  networkPos: THREE.Vector3 = new THREE.Vector3();
  networkRot: THREE.Quaternion = new THREE.Quaternion();
  lastPos = new THREE.Vector3(0, 1 , 0);
  lastRot = new THREE.Quaternion();

  private quaternion = new THREE.Quaternion();

  // @TransformBroadcasterModel.prop(60)
  get transform() {
    return {
      pos: this.object3d.position,
      rot: this.object3d.quaternion,
    }
  }

  set transform(v: {pos: THREE.Vector3, rot: THREE.Quaternion}) {
    const pos = this.networkPos || new THREE.Vector3();
    pos.copy(v.pos);

    const rot = this.networkRot || new THREE.Quaternion();
    rot.copy(v.rot);

    if (this.isMe) {
      this.controller.body.setNextKinematicTranslation(v.pos);
    }
  }

  init() {
    // this.transform = this.model.transform;
  }

  update() {
    return;
    this.quaternion.copy(this.object3d.quaternion);

    if (!this.model) return;
    if (!this.initialized) return;

    if (!this.isMe) {
      this.dampV3(this.object3d.position, this.networkPos, 20);
      this.object3d.quaternion.slerp(this.networkRot, 30 * RE.Runtime.deltaTime);
    }

    if (!this.isMe) return;

    const posChanged = !this.object3d.position.equals(this.lastPos);
    const rotChanged = !this.object3d.quaternion.equals(this.lastRot);

    if ((posChanged || rotChanged)) {
      this.updateProp("transform");

      this.lastPos.copy(this.object3d.position);
      this.lastRot.copy(this.object3d.quaternion);
    }
  }
}
