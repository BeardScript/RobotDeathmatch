import RAPIER from '@dimforge/rapier3d-compat';
import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RogueRapier from '../../Lib/RogueRapier';
import RapierCollider from './RapierCollider';

export default class RapierCone extends RapierCollider {
  private _halfHeight = 0.5;
  private _radius = 0.5;

  @RE.props.num() 
  get halfHeight() {
    return this._halfHeight;
  }

  set halfHeight(value: number) {
    const oldValue = this._halfHeight;
    this._halfHeight = value;
    if (oldValue !== value && this.collider && RogueRapier.world) {
      RogueRapier.world.removeCollider(this.collider, false);
      this.init();
    }
  }

  @RE.props.num()
  get radius() {
    return this._radius;
  }

  set radius(value: number) {
    const oldValue = this._radius;
    this._radius = value;
    if (oldValue !== value && this.collider && RogueRapier.world) {
      RogueRapier.world.removeCollider(this.collider, false);
      this.init();
    }
  }

  worldScale = new THREE.Vector3();

  protected createShape(): void {
    this.object3d.getWorldScale(this.worldScale);
    const maxSide = Math.max(this.worldScale.x, this.worldScale.z);

    let colliderDesc = RAPIER.ColliderDesc.cone(this.halfHeight * this.worldScale.y, this.radius * maxSide);
    this.collider = RogueRapier.world.createCollider(colliderDesc, this.body);
  }
}

RE.registerComponent(RapierCone);
