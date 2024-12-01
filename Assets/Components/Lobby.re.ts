import { RogueCroquet } from '@RE/RogueEngine/rogue-croquet';
import { CroquetLobby, CroquetLobbyModel } from '@RE/RogueEngine/rogue-croquet/CroquetLobby.re';
import RogueCSS2D from '@RE/RogueEngine/rogue-css2d/RogueCSS2D.re';
import * as RE from 'rogue-engine';

@RogueCroquet.Model
export class LobbyModel extends CroquetLobbyModel {
  roomMinPlayers = 1;
  roomMaxPlayers = 6;
}

@RE.registerComponent
export default class Lobby extends CroquetLobby {
  @RE.props.component(RogueCSS2D) matchmakingMessage: RogueCSS2D;

  roomScene: string = "AridLands";

  onJoinedLobby() {
    if (!CroquetLobby.gameStarted) {
      RE.Runtime.camera.add(this.matchmakingMessage.object3d);
      this.matchmakingMessage.object3d.position.set(0,0,0);
      this.matchmakingMessage.enabled = true;
    } else {
      this.matchmakingMessage.enabled = false;
    }
  }
}
