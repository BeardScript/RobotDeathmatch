import * as RE from 'rogue-engine';
import RogueCSS2D from '../RogueCSS2D.re';

export default class RogueCSS2DEditor extends RE.Component {
  static isEditorComponent = true;
  private handleOnComponentAdded = {stop: () => {}};
  private handleOnComponentRemoved = {stop: () => {}};
  private handleOnObjectAdded = {stop: () => {}};

  start() {
    this.setUp();
    this.handleOnComponentAdded?.stop();
    this.handleOnComponentRemoved?.stop();

    this.handleOnObjectAdded = RE.onObjectAdded(obj => {
      RE.onNextFrame(() => {
        const comp = RogueCSS2D.get(obj);
        if (comp) {
          this.setUp();
        }
      })
    });
    this.handleOnComponentAdded = RE.onComponentAdded(this.setUp);
    this.handleOnComponentRemoved = RE.onComponentRemoved(comp => {
      if (!(comp instanceof RogueCSS2D)) return;
      comp.css2DObject.removeFromParent();
    });

    const onPlay = RE.Runtime.onPlay(() => {
      this.handleOnComponentAdded.stop();
      this.handleOnComponentRemoved.stop();
      this.handleOnObjectAdded.stop();
      onPlay.stop();
    });
  }

  setUp = () => {
    // console.log("added!", component)
    RE.traverseComponents(component => {
      if (!(component instanceof RogueCSS2D)) return;
      component.setupLabel();
    });

    RogueCSS2D.setupLabelRenderer();
  }

  update() {
    const {clientWidth, clientHeight} = RE.App.sceneController.rogueDOMContainer;
    const {width, height} = RogueCSS2D.renderer.getSize();

    if (clientWidth !== width || clientHeight !== height) {
      RogueCSS2D.renderer.setSize(clientWidth, clientHeight);
    }

    RogueCSS2D.renderer.render(RE.App.sceneController.scene, RE.App.sceneController.camera);

    RE.traverseComponents(component => {
      if (!(component instanceof RogueCSS2D)) return;
      component.css2DObject.position.copy(component.offset);
    });
  }
}

RE.registerComponent(RogueCSS2DEditor);
        