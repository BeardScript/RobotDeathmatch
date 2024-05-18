import * as RE from 'rogue-engine';

export default class UIComponent extends RE.Component {
  @RE.props.text() url = "";

  container = document.createElement("div");

  async awake() {
    this.container.style.display = "none";

    const filePath = RE.getStaticPath(this.url);
    const res = await fetch(filePath);
    
    this.container.innerHTML = await res.text();
    RE.Runtime.uiContainer.append(this.container);
  }

  show(...args: any[]) {
    this.container.style.display = "block";
  }

  hide() {
    this.container.style.display = "none";
  }
}

RE.registerComponent(UIComponent);
        