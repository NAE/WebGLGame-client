WebGLGame-client
================

#### [Multiplayer Demo](http://www.youtube.com/watch?v=P07f2FKpRB8) ####

#### Description ####
This is the client portion of a multiplayer, browser-based WebGL game developed using [three.js](https://github.com/mrdoob/three.js/). The client uses socket.io to communicate with the server. The server (not included), is written in Java and uses [netty-socketio](https://github.com/mrniko/netty-socketio) for communication using socket.io.

#### Gameplay ####
* Ability to shoot and kill NPC's with different spells you can select using the lower-right menu.
* Heal yourself or others by shooting yourself with the pink spells.
* Some NPC's will heal themselves occasionally.
* Gain energy by killing oponents, lose energy by firing spells.
* Pick up items on the ground that NPC's drop when killed.
* Wield weapons dropped by NPC's to do more damage when firing spells.
* Structures (trees, huts, boxes, paths) on map with rectangular collision detection done on server.
* Chat system to chat with nearby players

![WebGL game client demo](http://i.imgur.com/PxOU8eP.jpg "Gameplay")


#### Client Features ####
* The client only receives events from things that are happening nearby.
 * Map is divided into chunks (theoretically infinite, but the positions of structures must be hand-coded in so an infinite map is currently just a bunch of empty green planes).
 * Chunks load and unload depending on where the player is moving on the map.
 * Player is sent data only from the chunk the player is in and the chunks directly around it. This means that under normal circumstances, the player will experience virtually the same performance no matter how many other people are playing.
* Some 3D models with animations (collada models) are currently in use.
 * A few NPC's have the same model right now.
 * Models are loaded once and then cloned every time a new type of that model needs to be created.

#### To-do for client ####
* Create models/animations for all NPC's
* Create models/animations for weapons
* Create low-quality models for dropped items
* Create models for structures (currently they are a bunch of attached planes created in javascript)
* Greatly improve existing models.
* Implement bumpy terrain. This needs to remain consistent across server-restart. Was thinking of somehow storing keys in each chunk that generate a different heightmap which is used to generate the terrain.
* Update three.js to its newest version. It has a variety of issues when doing so, need to work these out.
