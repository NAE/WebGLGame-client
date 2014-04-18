//wait for incoming charInfo
/*socket.on('charInfo', function (data) {
		//update or load in new characters
		loadOtherCharacters(data);
		updateChatBox(data.chatArray);
});*/

socket.on('otherCharMove', function(data) {
	updateOtherChar(data.player);
});

socket.on('globalParticleUpdate', function(data) {
	var system = makeParticleSystem(data.particles);
	particleSystemList.push(system);
});

socket.on('particleHits', function(data) {
	var playersHit = data.playersHit;
	var players = data.players;
	if(data.firer == connectionNum && data.firerType == PLAYER_CONST){
		otherCharacterList[connectionNum].state.energy = data.newEnergy;
	}
	for(var i=0;i<playersHit.length;i++){
		var thisConnNum = playersHit[i];
		otherCharacterList[thisConnNum].state.health = players[i].state.health;
		var newPercentage = otherCharacterList[thisConnNum].state.health/otherCharacterList[thisConnNum].state.maxHealth;
		otherCharacterList[thisConnNum].healthPlane.remainingEntity.scale.x = newPercentage;
	}
	var NPCsHit = data.NPCsHit;
	for(var i=0;i<NPCsHit.length;i++){
		var npcNum = NPCsHit[i];
		var npc = data.smallNPCArray[i];
		if(npcArray[npc.id] != undefined){
			npcArray[npc.id].state.health = npc.state.health;
			var newPercentage = npcArray[npc.id].state.health/npcArray[npc.id].state.maxHealth;
			npcArray[npc.id].healthPlane.remainingEntity.scale.x = newPercentage;
			if(npcArray[npc.id].state.health <= 0){
				//it's dead, set npcArray at this spot to undefined, so that it can be replaced later, and remove it from the scene now
				scene.remove(npcArray[npc.id].entity);
				npcArray[npc.id] = undefined;
			}
		}
	}
});

socket.on('npcUpdate',function(data) {
	transferNPCData(data.npcArray);
});

socket.on('chatUpdate', function(data) {
	updateChatBox(data.message);
});

socket.on('inventoryUpdate', function(data) {
	updateInventory(data.playerInventory.inventory);
});

socket.on('droppedItems', function(data) {
	updateDroppedItems(data.itemArray,data.timeNow);
});

socket.on('charLeaveChunk',function(data) {
	//check if we should not render him anymore, compare his newChunk with my adjacent chunks
	var myAdjacents = getChunk(otherCharacterList[connectionNum].moveObj.currentChunk).adjacentChunks;
	var oldChunkId = data.oldChunk;
	var oldChunk = getChunk(oldChunkId);
	var indexOfThisCharacter = oldChunk.players.indexOf(data.connectionNum);
	if(indexOfThisCharacter >= 0){
		//remove this character from his old chunk
		oldChunk.players.splice(indexOfThisCharacter,1);
	}
	if(myAdjacents.indexOf(data.newChunk) < 0 && data.connectionNum != connectionNum){
		removeCharacter(data.connectionNum);
	}
});

socket.on('charEnterChunk',function(data) {
	//data from the chunk that we entered, setting state of all moveObj's to false in order to prevent double movement
	loadCharacters(data.sendMoveEvents,true);
	transferNPCData(data.sendNPCs);
	updateDroppedItems(data.sendItems,new Date().getTime());
	addObjects(data.sendObjects);
	//take out stuff that we don't need anymore
	var leavingChunks = data.leavingChunks;
	for(var i=0;i<leavingChunks.length;i++){
		var thisChunkId = leavingChunks[i];
		var thisChunk = getChunk(thisChunkId);
		var indexOfMe = thisChunk.players.indexOf(connectionNum);
		if(indexOfMe >= 0){
			//remove me from this chunk I'm leaving
			thisChunk.players.splice(indexOfMe,1);
		}
		var physicalChunk = currentlyLoadedChunks[thisChunkId];
		if(physicalChunk != undefined){
			scene.remove(physicalChunk.entity);
			currentlyLoadedChunks[thisChunkId] = undefined;
		}
		var npcsInThisChunk = thisChunk.npcs;
		var itemsInThisChunk = thisChunk.items;
		//NEED TO IMPLEMENT ITEM REMOVAL (entity of items won't be stored in chunks...probably, well, can't be sent over network
		var charactersInThisChunk = thisChunk.players;
		
		//remove characters no longer visible
		for(var n=0;n<charactersInThisChunk.length;n++){
			var thisConnNum = charactersInThisChunk[n];
			removeCharacter(thisConnNum);
		}
		
		//delete items from view
		var itemsInThisChunk = thisChunk.items;
		for(var n=0;n<itemsInThisChunk.length;n++){
			var itemId = itemsInThisChunk[n];
			var thisItem = itemArray[itemId];
			itemArray[itemId] = undefined;
			if(thisItem != undefined){
				scene.remove(thisItem.entity);
			}
		}
		
		for(var n=0;n<npcsInThisChunk.length;n++){
			var thisNpcId = npcsInThisChunk[n];
			var thisNpc = npcArray[thisNpcId];
			npcArray[thisNpcId] = undefined;
			if(thisNpc != undefined){
				scene.remove(thisNpc.entity);
			}
		}
		
		var objectsInThisChunk = thisChunk.objects;
		for(var n=0;n<objectsInThisChunk.length;n++){
			var thisObjectData = objectsInThisChunk[n];
			var thisObject = mapObjectsArray[thisObjectData.id];
			mapObjectsArray[thisObjectData.id] = undefined;;
			if(thisObject != undefined){
				scene.remove(thisObject.entity);
			}
		}
	}
});

socket.on('otherCharacterChangeWeapon', function(data) {
	changeOtherCharacterWeapon(data.newType,data.connectionNum);
});

socket.on('mapObjectAdd', function(data) {
	var newObjects = data.newObjects;
	var chunkId = data.chunkId;
	//add the object
	addObjects(newObjects);
	//add it to the chunk
	getChunk(chunkId).objects.push(newObjects[0]);
});

socket.on('clientDisconnect', function(data) {
	removeCharacter(data.connectionNum);
	updateChatBox(data.chatArray);
});

socket.on('consoleLog',function(data) {
	console.log(data);
});
