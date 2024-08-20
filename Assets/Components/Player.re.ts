import * as RE from 'rogue-engine';
import * as THREE from 'three';
import TDSController from './TDSController.re';
import RogueCSS2D from '@RE/RogueEngine/rogue-css2d/RogueCSS2D.re';
import CroquetPawn from '@RE/RogueEngine/rogue-croquet/CroquetPawn.re';
import { Actor } from '@RE/RogueEngine/rogue-croquet/Actor';
import { RogueCroquet } from '@RE/RogueEngine/rogue-croquet';
import { GameLogicModel } from './GameLogic.re';

@RogueCroquet.Model
export class PlayerModel extends Actor {
  playerName = "";
  hp = 200;
  curHP = 200;
  damage = 20;
  isShooting = new THREE.Vector3();
  speed = 8 * ((100 + 20)/1000);
  transform = {
    pos: new THREE.Vector3(),
    rot: new THREE.Quaternion(),
  };

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

  onInit() {
    const gameLogicModel = this.wellKnownModel("GameLogic") as GameLogicModel;
    const spawnPoint = gameLogicModel.selectSpawnPoint();
    this.transform.pos.fromArray(spawnPoint);
  }

  onRemoved() {
    this.publish(this.sessionId, "playerDestroyed", {model: this, viewId: this.viewId});
  }
}

@RE.registerComponent
export default class Player extends CroquetPawn {
  @PlayerModel.prop() 
  hp = 200;

  private _curHP = this.hp;

  @PlayerModel.prop() 
  get curHP() {
    return this._curHP;
  }

  set curHP(v: number) {
    this._curHP = v;

    if (this.healthbar) {
      this.healthbar.style.width = (this._curHP * 100) / this.hp + "%";
    }

    if (v <= 0) {
      const explosion = this.explosion.instantiate();
      explosion.position.copy(this.object3d.position);
    }
  }

  @PlayerModel.prop()
  damage = 20;

  @RE.props.component(RogueCSS2D) infoUI: RogueCSS2D;
  @RE.props.prefab() explosion: RE.Prefab;

  @PlayerModel.prop(true) 
  get isShooting() {
    return this.tdsController.shootDir;
  }

  set isShooting(value: THREE.Vector3) {
    if (this.isMe) return;
    this.tdsController.weapon.fireRateCounter = 0;
    this.tdsController.weapon.loadedRounds = 1000;

    if (value.length() > 0)
    this.tdsController.weapon.shoot(value);
  }

  private _playerName = "";

  @PlayerModel.prop(true)
  get playerName() {
    return this._playerName;
  }

  set playerName(v: string) {
    if (this.nameDiv) {
      this.nameDiv.textContent = v;
    }

    this._playerName = v;
  }

  model: PlayerModel;

  @TDSController.require()
  tdsController: TDSController;

  networkPos = new THREE.Vector3();
  networkRot = new THREE.Quaternion();

  @PlayerModel.prop(60)
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
      this.tdsController.characterController.body.setNextKinematicTranslation(v.pos);
    }
  }

  prevShootDir = new THREE.Vector3();

  nameDiv: HTMLDivElement;
  healthbar: HTMLDivElement;

  init() {
    this.view.subscribe(this.sessionId, "playerDestroyed", this.playerLeft);
    
    this.infoUI.div.style.pointerEvents = "none";

    this.nameDiv = this.infoUI.div.querySelector(".player-name-field") as HTMLDivElement;
    this.healthbar = this.infoUI.div.querySelector(".health-bar-inner") as HTMLDivElement;

    this.curHP = this.model.curHP;

    if (this.isMe) {
      this.playerName = this.playerName;
      this.updateProp("playerName");
    } else {
      this.playerName = this.model.playerName;
    }

    this.transform = this.model.transform;
  }

  playerLeft = (data: {modelId: string, viewId: string}) => {
    if (data.viewId === this.viewId) {
      this.object3d.parent?.remove(this.object3d);
    }
  }

  afterUpdate() {
    if (!this.initialized) return;

    if (this.isMe) {
      if (!this.tdsController.shootDir.equals(this.prevShootDir)) {
        this.updateProp("isShooting");
        this.prevShootDir.copy(this.tdsController.shootDir);
      }

      const posChanged = !this.transform.pos.equals(this.model.transform.pos);
      const rotChanged = !this.transform.rot.equals(this.model.transform.rot);

      if (posChanged || rotChanged) this.updateProp("transform");
    } else {
      this.object3d.quaternion.slerp(this.networkRot, 30 * RE.Runtime.deltaTime);
      this.dampV3(this.object3d.position, this.networkPos, 20);
    }
  }

  @PlayerModel.action()
  applyDamage() {
    this.curHP = Math.max(this.curHP - this.damage, 0);
    if (this instanceof PlayerModel) {
      this.curHP === 0 && this.remove();
    } else {
      if (this.curHP === 0) {
        const explosion = this.explosion.instantiate();
        explosion.position.copy(this.object3d.position);
      }
    }
  }
}
