import * as Croquet from '@croquet/croquet';
import * as RE from 'rogue-engine';
import { RootModel } from './RootModel';
import CroquetPawn from './CroquetPawn.re';
import { Actor } from './Actor';
import CroquetView from './CroquetView.re';

export class RootView extends Croquet.View {
  model: RootModel;

  constructor(model) {
    super(model);

    this.model = model;

    this.subscribe(this.model.sessionId, "actorCreated", actor => {
      this.createActor(actor);
    });

    const pawns = RE.getComponents(CroquetPawn);
    pawns.forEach(pawn => {
      pawn.object3d.removeFromParent();
    });

    const qComps = RE.getComponents(CroquetView);
    qComps.forEach(qComp => {
      if (qComp.isStaticModel && qComp.initialized) {
        qComp.initialized = false;
        qComp.readySubscribed = false;
      }
    })

    this.model.actors.forEach(actor => {
      this.createActor(actor);
    });
  }

  createActor(actor: {model: Actor, viewId: string, pawnPrefab: string}) {
    if (actor.viewId === this.viewId) return;
      
    const prefab = new RE.Prefab(actor.pawnPrefab);

    const pawn = prefab.instantiate();
    const pawnComp = CroquetPawn.get(pawn);
    pawnComp.readySubscribed = true;

    RE.onNextFrame(() => {
      RE.onNextFrame(() => {
        pawnComp.onModelCreated({model: actor.model, viewId: actor.viewId});
      });
    });
  }
}
