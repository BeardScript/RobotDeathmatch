# RobotDeathmatch

This is a game made by [BeardScript](https://x.com/BeardScript) in collaboration with [Multisynq](https://multisynq.io/) to demo [RogueCroquet](https://github.com/BeardScript/RogueCroquet), an integration of the [Croquet](https://croquet.io/) multiplayer platform for [Rogue Engine](https://rogueengine.io/).

This is the simplest approach to make a multiplayer game with Rogue Engine and Croquet.

**Play The Game:** https://play.rogueengine.io/RogueEngine/robot-deathmatch 

### Controlling The Player

We're using `RogueRapier` for physics and the player character is made from the `ThirdPersonCharacter` included in that package.

The top down shooting controlls are implemented in `TDSController` component, using the `RapierThirdPersonController` component which must be present in the same object.

Local input is implemented at `TDSInput` which uses the functionality in the `TDSController` within the same object.

Shooting is done with a simple Raycast, the bullets are just VFX.

### Networking

Most of the networking is self-contained in the `Player` component. We set our position locally using a `prop` decorator which lets us boradcast it to all clients when calling `updateProp`. Then the model intercepts our new position and makes sure we've not exceeding the maximum speed allowed.

Damage is applied using an `action` decorator so it runs first in the view and then on the model for all clients. That way we see the instant reaction but the model makes sure that it's applied properly for everyone.

### GameLogic

For now `GameLogic` component View is only in charge of displaying UI and instantiating the local player character. The Model is in charge of defining the spawn point. When a `PlayerModel` initializes, it'll be requesting a random one.
