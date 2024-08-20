import * as RE from 'rogue-engine';
import { BaseModel } from '@RE/RogueEngine/rogue-croquet/BaseModel';
import Player from './Player.re';
import * as THREE from 'three';
import RogueCSS2D from '@RE/RogueEngine/rogue-css2d/RogueCSS2D.re';
import UIComponent from './UIComponent.re';
import CroquetView from '@RE/RogueEngine/rogue-croquet/CroquetView.re';
import { RogueCroquet } from '@RE/RogueEngine/rogue-croquet';

function randomRange(min: number, max: number, floor = false) {
  let rand = Math.random() * (max - min);

  return floor ? Math.floor(rand) + min : rand + min;
}

@RogueCroquet.Model
export class GameLogicModel extends BaseModel {
  isStaticModel = true;
  spawnPoints = [
    [0, 5, 21], [9, 5, 21], [18, 5, 21], [25, 5, 10], [25, 5, 0], [25, 5, -12],
    [12, 5, -15], [4, 5, -15], [-6, 5, -15], [-17, 5, -13], [-20, 5, 2], [-20, 5, 16],
  ];

  selectSpawnPoint() {
    return this.spawnPoints[(Math.floor(Math.random() * this.spawnPoints.length))];
  }
}

@RE.registerComponent
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
    playerComp.playerName = this.playerName;
  }
}
        