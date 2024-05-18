import RAPIER from '@dimforge/rapier3d-compat';

export default class RogueRapier {
  static world: RAPIER.World;
  static eventQueue: RAPIER.EventQueue;
  static initialized = false;

  static init(onDone: () => void) {
    this.initialized = false;
    const done = this.doInit();
    done.then(() => onDone());
  }

  private static async doInit() {
    await RAPIER.init();
    this.world = new RAPIER.World({x: 0, y: -9.81, z: 0});
    this.eventQueue && this.eventQueue.clear();
    this.eventQueue = this.eventQueue || new RAPIER.EventQueue(true);
    this.initialized = true;
  }
}
