import * as RE from 'rogue-engine';
import * as Croquet from '@croquet/croquet';
import { BaseModel } from './BaseModel';

export default class CroquetComponent extends RE.Component {
  isCroquetComponent = true;
  isStaticModel = false;

  model: BaseModel;
  view: Croquet.View;
  viewId: string;
  sessionId: string;
  initialized = false;

  readySubscribed = false;

  get isMe() {
    if (!this.view) return false;
    if (!this.view.viewId || !this.viewId) return false;
    return this.view.viewId === this.viewId;
  }

  onModelCreated = (params: {model: Croquet.Model, viewId: string}) => {}

  init() {}

  onBeforeUpdateProp(key: string, value: any) {}

  updateProp(key: string) {
    this.view.publish(this.model.id, key, {
      key,
      value: this[key],
    });
  }
}

RE.registerComponent(CroquetComponent);
        