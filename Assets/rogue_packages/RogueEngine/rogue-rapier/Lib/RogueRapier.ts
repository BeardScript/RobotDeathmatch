import RAPIER from '@dimforge/rapier3d-compat';
import * as RE from 'rogue-engine';

export default class RogueRapier {
  static world: RAPIER.World;
  static eventQueue: RAPIER.EventQueue;
  static initialized = false;
  static onStop = () => {};

  static init(onDone: () => void = () => {}) {
    this.initialized = false;
    try {
      this.world?.free();
    } catch {};
    const done = this.doInit();
    done.then(() => {
      onDone();
      this.initialized = true;
    });

    this.onStop = RE.Runtime.onStop(() => {
      RogueRapier.onStop();
      RogueRapier.initialized = false;
    }).stop;
  }

  private static async doInit() {
    await RAPIER.init();
    this.world = new RAPIER.World({x: 0, y: -9.81, z: 0});
    this.eventQueue = new RAPIER.EventQueue(true);
  }
}
