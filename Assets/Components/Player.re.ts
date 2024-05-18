import * as RE from 'rogue-engine';
import * as THREE from 'three';
import { RootModel } from '@RE/RogueEngine/rogue-croquet/RootModel';
import TDSController from './TDSController.re';
import RogueCSS2D from '@RE/RogueEngine/rogue-css2d/RogueCSS2D.re';
import CroquetPawn from '@RE/RogueEngine/rogue-croquet/CroquetPawn.re';
import { Actor } from '@RE/RogueEngine/rogue-croquet/Actor';

export class PlayerModel extends Actor {
  playerName = "";
  hp = 200;
  curHP = 200;
  isShooting = new THREE.Vector3();

  onInit() {
    this.publish(this.sessionId, "playerSpawned", {model: this, viewId: this.viewId});
  }

  onRemoved() {
    this.publish(this.sessionId, "playerDestroyed", {model: this, viewId: this.viewId});
  }
}

PlayerModel.register("PlayerModel");
RootModel.modelClasses.set("PlayerModel", PlayerModel);

export default class Player extends CroquetPawn {
  @PlayerModel.prop() 
  @RE.props.num() hp = 200;

  private _curHP = this.hp;

  @PlayerModel.prop() 
  @RE.props.num()
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
    return this.tdsController?.isShooting ? this.tdsController.isShooting : new THREE.Vector3();
  }

  set isShooting(value: THREE.Vector3) {
    if (!(value instanceof THREE.Vector3)) value = new THREE.Vector3();
    this.tdsController.isShooting.copy(value);
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

  wasShooting = new THREE.Vector3();

  posWasFixed = false;

  nameDiv: HTMLDivElement;
  healthbar: HTMLDivElement;

  init() {
    this.view.subscribe(this.sessionId, "playerDestroyed", this.playerLeft);
    
    this.infoUI.div.style.pointerEvents = "none";

    this.nameDiv = this.infoUI.div.querySelector(".player-name-field") as HTMLDivElement;
    this.healthbar = this.infoUI.div.querySelector(".health-bar-inner") as HTMLDivElement;

    this.curHP = this.model.curHP;
    this.playerName = this.model.playerName;
  }

  playerLeft = (data: {modelId: string, viewId: string}) => {
    if (data.viewId === this.viewId) {
      this.object3d.parent?.remove(this.object3d);
    }
  }

  update() {
    if (!this.initialized) return;
    if (!this.isMe) return;

    if (!this.tdsController.isShooting.equals(this.wasShooting)) {
      this.updateProp("isShooting");
      this.wasShooting.copy(this.tdsController.isShooting);
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

RE.registerComponent(Player);
