import * as RE from 'rogue-engine';
import * as Croquet from '@croquet/croquet';
import { RootModel } from './RootModel';
import { RootView } from './RootView';
import { RogueCroquet } from '.';

export default class CroquetConfig extends RE.Component {
  @RE.props.text() appName = "";
  @RE.props.text() appId = "";
  @RE.props.text() apiKey = "";
  @RE.props.num(0) autoSleep = 30;
  @RE.props.num(0) rejoinLimit = 1000;

  async awake() {
    RogueCroquet.mainSession = await Croquet.Session.join({
      apiKey: this.apiKey,
      appId: this.appId,
      name: this.appName,
      password: "secret",
      autoSleep: this.autoSleep,
      rejoinLimit: this.rejoinLimit,
      model: RootModel,
      view: RootView,
    });

    RogueCroquet.activeSession = RogueCroquet.mainSession;

    RogueCroquet.sessions.set(RogueCroquet.mainSession["id"], RogueCroquet.mainSession);

    RE.Runtime.onStop(() => {
      RogueCroquet.sessions.forEach(session => {
        session["view"]?.unsubscribeAll();
        session["view"]?.detach();
        session["leave"]();
      });

      (RogueCroquet.mainSession as any) = undefined;
      (RogueCroquet.activeSession as any) = undefined;
      RogueCroquet.sessions.clear();
    });
  }
}

RE.registerComponent(CroquetConfig);
        