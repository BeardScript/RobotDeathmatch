import RAPIER from '@dimforge/rapier3d-compat';
import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RogueRapier from '../../Lib/RogueRapier';
import RapierCollider from './RapierCollider';

export default class RapierCuboid extends RapierCollider {
  private _sizeOffsetX = 1;
  private _sizeOffsetY = 1;
  private _sizeOffsetZ = 1;

  @RE.props.num()
  get sizeOffsetX() {
    return this._sizeOffsetX;
  }

  set sizeOffsetX(value: number) {
    const oldValue = this._sizeOffsetX;
    this._sizeOffsetX = value;

    if (oldValue !== value && this.collider && RogueRapier.world) {
      RogueRapier.world.removeCollider(this.collider, false);
      this.init();
    }
  }

  @RE.props.num()
  get sizeOffsetY() {
    return this._sizeOffsetY;
  }

  set sizeOffsetY(value: number) {
    const oldValue = this._sizeOffsetY;
    this._sizeOffsetY = value;

    if (oldValue !== value && this.collider && RogueRapier.world) {
      RogueRapier.world.removeCollider(this.collider, false);
      this.init();
    }
  }

  @RE.props.num()
  get sizeOffsetZ() {
    return this._sizeOffsetZ;
  }

  set sizeOffsetZ(value: number) {
    const oldValue = this._sizeOffsetZ;
    this._sizeOffsetZ = value;

    if (oldValue !== value && this.collider && RogueRapier.world) {
      RogueRapier.world.removeCollider(this.collider, false);
      this.init();
    }
  }

  worldScale = new THREE.Vector3();

  protected createShape(): void {
    this.object3d.getWorldScale(this.worldScale);

    let colliderDesc = RAPIER.ColliderDesc.cuboid(
      this._sizeOffsetX * (this.worldScale.x/2),
      this._sizeOffsetY * (this.worldScale.y/2),
      this._sizeOffsetZ * (this.worldScale.z/2)
    );

    this.collider = RogueRapier.world.createCollider(colliderDesc, this.body);
  }
}

RE.registerComponent(RapierCuboid);
