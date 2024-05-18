import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RogueRapier from '../Lib/RogueRapier';
import RapierBody from './RapierBody.re';
import RAPIER from '@dimforge/rapier3d-compat';

export default class RapierConfig extends RE.Component {
  @RE.props.vector3() gravity = new THREE.Vector3(0, -9.81, 0);

  private _debug = false;

  @RE.props.checkbox()  get debug() {return this._debug}

  set debug(value: boolean) {
    this._debug = value;

    RE.Runtime.isRunning && value ? 
    RE.App.currentScene.add(this.lines) : 
    RE.App.currentScene.remove(this.lines)
  }

  lines = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: new THREE.Color("#00FF00") })
  );

  awake() {
    this.lines.name = "Rapier Debug Lines";

    RogueRapier.init(() => {
      RogueRapier.world.gravity = this.gravity;
    });
  }

  start() {
    if (this.debug) {
      RE.App.currentScene.add(this.lines);
    }
  }

  beforeUpdate() {
    if (!RogueRapier.initialized) return;

    if (this.debug) {
      let buffers = RogueRapier.world.debugRender();

      this.lines.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(buffers.vertices, 3),
      );
  
      this.lines.geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(buffers.colors, 4),
      );
    }

    RogueRapier.world.timestep = RE.Runtime.deltaTime;
    RogueRapier.world.step(RogueRapier.eventQueue);

    RogueRapier.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      const col1 = RogueRapier.world.getCollider(handle1);
      const col2 = RogueRapier.world.getCollider(handle2);

      const body1 = col1.parent();
      const body2 = col2.parent();

      const components = RE.getComponents(RapierBody);

      let bodyComp1: RapierBody | undefined;
      let bodyComp2: RapierBody | undefined;

      for (let bodyComp of components) {
        if (bodyComp?.body?.handle === body1?.handle) {
          bodyComp1 = bodyComp;
        }
        else if (bodyComp?.body?.handle === body2?.handle) {
          bodyComp2 = bodyComp;
        }
      }

      if (bodyComp1 && col1.activeEvents() === RAPIER.ActiveEvents.COLLISION_EVENTS) {
        const colInfo = {ownCollider: col1, otherCollider: col2, otherBody: bodyComp2 as RapierBody}
        started ? bodyComp1.onCollisionStart(colInfo) : bodyComp1.onCollisionEnd(colInfo);
      }

      if (bodyComp2  && col2.activeEvents() === RAPIER.ActiveEvents.COLLISION_EVENTS) {
        const colInfo = {ownCollider: col1, otherCollider: col2, otherBody: bodyComp1 as RapierBody}
        started ? bodyComp2.onCollisionStart(colInfo) : bodyComp2.onCollisionEnd(colInfo);
      }
    });
  }
}

RE.registerComponent(RapierConfig);
