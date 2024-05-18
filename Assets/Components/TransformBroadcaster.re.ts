import { BaseModel } from '@RE/RogueEngine/rogue-croquet/BaseModel';
import * as RE from 'rogue-engine';
import * as THREE from 'three';
import TDSController from './TDSController.re';
import { RootModel } from '@RE/RogueEngine/rogue-croquet/RootModel';
import CroquetView from '@RE/RogueEngine/rogue-croquet/CroquetView.re';

class TransformBroadcasterModel extends BaseModel {
  pos = new THREE.Vector3();
  rot = new THREE.Quaternion();
}

TransformBroadcasterModel.register("TransformBroadcasterModel");
RootModel.modelClasses.set("TransformBroadcasterModel", TransformBroadcasterModel);

export default class TransformBroadcaster extends CroquetView {
  model: TransformBroadcasterModel;
  networkPos: THREE.Vector3 = new THREE.Vector3();
  networkRot: THREE.Quaternion = new THREE.Quaternion();
  lastPos = new THREE.Vector3(0, 1 , 0);
  lastRot = new THREE.Quaternion();

  @TDSController.require()
  tdsController: TDSController;

  @TransformBroadcasterModel.prop(true) 
  get pos() {
    return this.object3d.position;
  }

  set pos(v: THREE.Vector3) {
    const pos = this.networkPos || new THREE.Vector3();
    pos.copy(v);
  }

  private quaternion = new THREE.Quaternion();

  @TransformBroadcasterModel.prop(true) 
  get rot() {
    return this.quaternion;
  }

  set rot(q: THREE.Quaternion) {
    const rot = this.networkRot || new THREE.Quaternion();
    rot.copy(q);
  }

  init() {
    this.pos = this.model.pos;
    this.rot = this.model.rot;
  }

  update() {
    this.quaternion.copy(this.object3d.quaternion);

    if (!this.model) return;
    if (!this.initialized) return;

    if (!this.isMe) {
      const pos = this.object3d.position;

      pos.x = THREE.MathUtils.damp(pos.x, this.networkPos.x, 20, RE.Runtime.deltaTime);
      pos.y = THREE.MathUtils.damp(pos.y, this.networkPos.y, 20, RE.Runtime.deltaTime);
      pos.z = THREE.MathUtils.damp(pos.z, this.networkPos.z, 20, RE.Runtime.deltaTime);

      this.object3d.quaternion.slerp(this.networkRot, 30 * RE.Runtime.deltaTime);
    }

    if (!this.isMe) return;

    const posChanged = !this.object3d.position.equals(this.lastPos);
    const rotChanged = !this.object3d.quaternion.equals(this.lastRot);

    if ((posChanged || rotChanged)) {
      this.updateProp("pos");
      this.updateProp("rot");

      this.lastPos.copy(this.object3d.position);
      this.lastRot.copy(this.object3d.quaternion);
    }
  }
}

RE.registerComponent(TransformBroadcaster);
        