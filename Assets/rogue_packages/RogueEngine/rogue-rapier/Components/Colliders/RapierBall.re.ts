import RAPIER from '@dimforge/rapier3d-compat';
import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RogueRapier from '../../Lib/RogueRapier';
import RapierCollider from './RapierCollider';

export default class RapierBall extends RapierCollider {
  private _radiusOffset = 0;

  @RE.props.num()
  get radiusOffset() {
    return this._radiusOffset;
  }

  set radiusOffset(value: number) {
    const oldValue = this._radiusOffset;
    this._radiusOffset = value;
    if (oldValue !== value && this.collider && RogueRapier.world) {
      RogueRapier.world.removeCollider(this.collider, false);
      this.init();
    }
  }

  worldScale = new THREE.Vector3();

  protected createShape(): void {
    this.object3d.getWorldScale(this.worldScale);
    const maxSide = Math.max(this.worldScale.x, this.worldScale.y, this.worldScale.z);

    let colliderDesc = RAPIER.ColliderDesc.ball(this.radiusOffset + maxSide);
    this.collider = RogueRapier.world.createCollider(colliderDesc, this.body);
  }
}

RE.registerComponent(RapierBall);
