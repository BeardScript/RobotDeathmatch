import * as RE from 'rogue-engine';
import { RootModel } from '@RE/RogueEngine/rogue-croquet/RootModel';
import { BaseModel } from '@RE/RogueEngine/rogue-croquet/BaseModel';
import Player from './Player.re';
import * as THREE from 'three';
import RogueCSS2D from '@RE/RogueEngine/rogue-css2d/RogueCSS2D.re';
import UIComponent from './UIComponent.re';
import CroquetView from '@RE/RogueEngine/rogue-croquet/CroquetView.re';

function randomRange(min: number, max: number, floor = false) {
  let rand = Math.random() * (max - min);

  return floor ? Math.floor(rand) + min : rand + min;
}

export class GameLogicModel extends BaseModel {
  isStaticModel = true;
}

GameLogicModel.register("GameLogicModel");
RootModel.modelClasses.set("GameLogicModel", GameLogicModel);

export default class GameLogic extends CroquetView {
  isStaticModel = true;
  model: GameLogicModel;
  playerName = "";

  @RE.props.prefab() player: RE.Prefab;
  @RE.props.prefab() networkPlayer: RE.Prefab;

  @RE.props.component(RogueCSS2D) welcomeScreen: RogueCSS2D;
  @RE.props.component(UIComponent) respawnScreen: UIComponent;

  init() {
    this.view.subscribe(this.sessionId, "playerDestroyed", this.handlePlayerDestroyed);

    this.setUpWelcomeScreen();
    this.setupRespawnScreen();
  }

  handlePlayerDestroyed = (params: {modelId: string, viewId: string}) => {
    if (params.viewId === this.view.viewId) {
      this.respawnScreen.show();
    }
  }

  setUpWelcomeScreen() {
    RE.Runtime.camera.add(this.welcomeScreen.object3d);
    this.welcomeScreen.object3d.position.set(0,0,0);
    this.welcomeScreen.enabled = true;

    RE.onNextFrame(() => {
      RE.onNextFrame(() => {
        const input = document.getElementById("name-select") as HTMLInputElement;
        input.value = this.playerName;
        input.placeholder = this.viewId;
        const startBtn = document.getElementById("start-btn") as HTMLDivElement;
        
        if (!startBtn || !input) return;
  
        startBtn.onpointerdown = () => {
          this.onPlayerJoined({viewId: this.view.viewId, name: input.value || undefined});
          this.welcomeScreen.enabled = false;
        }
      });
    });
  }

  setupRespawnScreen() {
    const respawnBtn = this.respawnScreen.container.querySelector("#respawn-btn") as HTMLDivElement;
    respawnBtn.onpointerdown = () => {
      this.onPlayerJoined({viewId: this.view.viewId, name: this.playerName});
      this.respawnScreen.hide();
    }
  }

  onPlayerJoined = (params: {viewId: string, name?: string}) => {
    this.playerName = params.name || params.viewId;
    const player = this.player.instantiate();

    const playerComp = Player.get(player);
    playerComp.playerName = params.name || params.viewId;

    player.position.copy(this.getSpawnPosition());
  }

  raycaster = new THREE.Raycaster();

  getSpawnPosition() {
    const x = randomRange(-20, 20);
    const z = randomRange(-20, 20);

    this.raycaster.set({x, y: 100, z} as THREE.Vector3, {x: 0, y: -1, z: 0} as THREE.Vector3);
    this.raycaster.far = 200;

    const targetArea = RE.Runtime.scene.getObjectByName("Environment") as THREE.Object3D;

    const res = this.raycaster.intersectObject(targetArea, true);

    if (res.length > 0) {
      if (res[0].object.name === "Floor") {
        if (this.hitSomethingOnRadius({x, y: 100, z} as THREE.Vector3, 2)) return this.getSpawnPosition();

        return {x, y: 5,  z} as THREE.Vector3;
      }
    }

    return this.getSpawnPosition();
  }

  private hitSomethingOnRadius(v: THREE.Vector3, radius: number) {
    const targetArea = RE.Runtime.scene.getObjectByName("Environment") as THREE.Object3D;
    const raycastDir = {x: 0, y: -1, z: 0} as THREE.Vector3;
    const hasHitSomething = () => this.raycaster.intersectObject(targetArea, true)?.[0].object.name !== "Floor";

    for (let i = v.x - radius; i <  v.x + radius; i += 0.05) {
      this.raycaster.set({x: i, y: 100, z: v.z} as THREE.Vector3, raycastDir);
      if (hasHitSomething()) return true;
    }

    for (let i = v.z - radius; i <  v.z + radius; i += 0.05) {
      this.raycaster.set({x: v.x, y: 100, z: i} as THREE.Vector3, raycastDir);
      if (hasHitSomething()) return true;
    }

    return false;
  }
}

RE.registerComponent(GameLogic);
        