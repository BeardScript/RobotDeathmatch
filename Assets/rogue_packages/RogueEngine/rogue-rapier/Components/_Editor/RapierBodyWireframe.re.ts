import * as RE from 'rogue-engine';
import * as THREE from 'three';

import RapierCollider from '../Colliders/RapierCollider';
import RAPIER from '@dimforge/rapier3d-compat';
import RapierBody from '../RapierBody.re';
import RogueRapier from '@RE/RogueEngine/rogue-rapier/Lib/RogueRapier';

export default class RapierBodyWireframe extends RE.Component {
  static isEditorComponent = true;

  selectedObjects: THREE.Object3D[] = [];
  colliders: (RapierCollider | RapierBody)[] = [];

  lines = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: new THREE.Color("#00FF00") })
  );

  world: RAPIER.World;
  initializedPhysics = false;

  private handleOnComponentAdded = { stop: () => { } };
  private handleOnComponentRemoved = { stop: () => { } };

  private handleOnPlay = { stop: () => { } };

  private resetHandler = (component: RE.Component) => {
    component instanceof RapierCollider && this.setupImpostors();
  }

  async initPhysics() {
    await RAPIER.init();
  }

  start() {
    this.initializedPhysics = false;

    this.lines.geometry.computeBoundingSphere();
    this.lines.frustumCulled = false;

    this.initPhysics().then(() => {
      try {
        this.world?.free();
      } catch {};
      this.world = new RAPIER.World({x: 0, y: 0, z: 0});
      RogueRapier.world = this.world;
      this.initializedPhysics = true;
    });

    RE.App.currentScene.remove(this.lines);

    this.lines.userData.isEditorObject = true;
    RE.App.currentScene.add(this.lines);

    this.handleOnComponentAdded.stop();
    this.handleOnComponentRemoved.stop();
    this.handleOnPlay.stop();

    this.handleOnComponentAdded = RE.onComponentAdded(this.resetHandler);
    this.handleOnComponentRemoved = RE.onComponentRemoved(this.resetHandler);

    this.handleOnPlay = RE.Runtime.onPlay(() => {
      try {
        this.world?.free();
      } catch {};
      this.handleOnComponentAdded.stop();
      this.handleOnComponentRemoved.stop();
    });
  }

  resetComponents() {
    this.selectedObjects.forEach(selected => {
      if (!selected) return;
      selected.traverse(object => {
        const objComponents = RE.components[object.uuid];

        if (!objComponents) return;

        objComponents.forEach(component => {
          if (component instanceof RapierBody || component instanceof RapierCollider) {
            component.initialized = false;
          }
        });
      });
    });
  }

  afterUpdate() {
    this.lines.visible = false;
    if (!this.initializedPhysics) return;

    const selectedObjects = window["rogue-editor"].Project.selectedObjects as THREE.Object3D[];

    if (!this.arraysAreEqual(selectedObjects, this.selectedObjects)) {
      this.selectedObjects = selectedObjects.slice(0);
      this.resetComponents();
      this.setupImpostors();
    }

    if (!this.world || (this.world && this.world.bodies.len() === 0)) {
      return;
    }

    this.updateImpostors();
  }

  private updateImpostors() {
    this.lines.visible = true;

    this.world.step();

    const flagForRemoval: (RapierCollider | RapierBody)[] = [];

    this.colliders.forEach(component => {
      if (component instanceof RapierCollider && component.object3d && component.bodyComponent) {
        if (!component.enabled || !component.bodyComponent.enabled) {
          component.initialized = false;
          flagForRemoval.push(component);
          return;
        }
        const pos = component.bodyComponent.object3d.position;
        const rot = component.bodyComponent.object3d.quaternion;
        component.body.setTranslation(new RAPIER.Vector3(pos.x, pos.y, pos.z), false);
        component.body.setRotation(new RAPIER.Quaternion(rot.x, rot.y, rot.z, rot.w), false);
        component.setColliderRot();
        component.setColliderPos();
      }
    });

    flagForRemoval.forEach(component => this.colliders.splice(this.colliders.indexOf(component), 1));

    let buffers = this.world.debugRender();

    this.lines.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(buffers.vertices, 3),
    );

    this.lines.geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(buffers.colors, 4),
    );
  }

  private async cleanupImpostors() {
    RogueRapier.world && RogueRapier.world.bodies.forEach(body => RogueRapier.world.removeRigidBody(body));
    this.lines.visible = false;
    RE.App.currentScene.remove(this.lines);

    this.colliders = [];
  }

  private async setupImpostors() {
    await this.cleanupImpostors();

    if (this.selectedObjects[0] instanceof THREE.Scene) return;

    this.selectedObjects.forEach(selected => {
      selected.traverse(object => {
        const objComponents = RE.components[object.uuid];

        if (!objComponents) return;

        objComponents.forEach(component => {
          if (component instanceof RapierBody) {
            component.init();
            this.colliders.push(component);
          }

          if (component instanceof RapierCollider) {
            const bodyComponent = component.getBodyComponent(component.object3d);

            if (bodyComponent) {
              bodyComponent.init();
            }

            component.init();
            // component.collider && 
            // component.collider.setSensor(true);
            this.colliders.push(component);
          }
        });
      });
    });

    RE.App.currentScene.add(this.lines);
  }

  private arraysAreEqual(array1: any[], array2: any[]) {
    if (array1.length !== array2.length) return false;

    return array1.every((element, i) => {
      return array2[i] === element;
    });
  }

  onBeforeRemoved() {
    RE.App.currentScene.remove(this.lines);
    this.handleOnComponentAdded.stop();
    this.handleOnComponentRemoved.stop();
    this.handleOnPlay.stop();
    this.cleanupImpostors();
  }
}

RE.registerComponent(RapierBodyWireframe);
