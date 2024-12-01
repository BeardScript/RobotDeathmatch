import * as RE from 'rogue-engine';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

export default class RogueCSS2D extends RE.Component {
  static renderer = new CSS2DRenderer();

  @RE.props.code("html") 
  get content() {
    return this.div.innerHTML || "Hello World!";
  }

  set content(v: string) {
    this.div.innerHTML = v;
  }

  @RE.props.vector3() offset = new THREE.Vector3(0, 1, 0);

  div = document.createElement("div");
  css2DObject = new CSS2DObject(this.div);

  awake() {
    if (!this.enabled) return;
    this.setupLabel();
    RogueCSS2D.setupLabelRenderer();
  }

  setupLabel() {
    if (!this.enabled) return;
    const labelObj = this.object3d.children.find(child => child.userData.isCSS2DLabel);

    if (labelObj) this.object3d.remove(labelObj);

    this.object3d.add(this.css2DObject);

    this.css2DObject.name = this.name;
    this.css2DObject.position.copy(this.offset);
    this.css2DObject.userData.isCSS2DLabel = true;
    this.css2DObject.layers.set(0);
  }

  static setupLabelRenderer() {
    const container = RE.App.sceneController.rogueDOMContainer.parentElement as HTMLElement;
    while (RogueCSS2D.renderer.domElement.firstChild) {
      RogueCSS2D.renderer.domElement.removeChild(RogueCSS2D.renderer.domElement.lastChild as any);
    }

    RogueCSS2D.renderer.domElement.id = "CSS2DRenderer";
    document.getElementById("CSS2DRenderer")?.remove();
    RogueCSS2D.renderer.setSize(RE.App.sceneController.rogueDOMContainer.clientWidth, RE.App.sceneController.rogueDOMContainer.clientHeight);
    RogueCSS2D.renderer.domElement.style.position = 'absolute';
    RogueCSS2D.renderer.domElement.style.top = '0px';
    container.prepend(RogueCSS2D.renderer.domElement);
  }

  update() {
    const {clientWidth, clientHeight} = RE.App.sceneController.rogueDOMContainer;
    const {width, height} = RogueCSS2D.renderer.getSize();

    if (clientWidth !== width || clientHeight !== height) {
      RogueCSS2D.renderer.setSize(clientWidth, clientHeight);
    }

    this.css2DObject.position.copy(this.offset);

    RogueCSS2D.renderer.render(RE.Runtime.scene, RE.Runtime.camera);
  }

  onBeforeRemoved() {
    this.css2DObject.parent?.remove(this.css2DObject);
  }

  onDisabled(): void {
    this.object3d.remove(this.css2DObject);
  }
}

RE.registerComponent(RogueCSS2D);
