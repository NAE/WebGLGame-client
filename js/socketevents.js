/* TODO
 * Socket events here are being received prior to everything being loaded.
 * Implement a sort of 'queue' to retain the data that has been received
 * but not do anything with it until everything has been loaded (loaded == true)
 */

socket.on('otherCharMove', function(data) {
	socketOtherCharMove(data);
});

socket.on('globalParticleUpdate', function(data) {
	socketGlobalParticleUpdate(data);
});

socket.on('particleHits', function(data) {
	socketParticleHits(data);
});

socket.on('npcUpdate',function(data) {
	socketNpcUpdate(data);
});

socket.on('chatUpdate', function(data) {
	socketChatUpdate(data);
});

socket.on('inventoryUpdate', function(data) {
	socketInventoryUpdate(data);
});

socket.on('droppedItems', function(data) {
	socketDroppedItems(data);
});

socket.on('charLeaveChunk',function(data) {
	socketCharLeaveChunk(data);
});

socket.on('charEnterChunk',function(data) {
	socketCharEnterChunk(data);
});

socket.on('otherCharacterChangeWeapon', function(data) {
	socketOtherCharacterChangeWeapon(data);
});

socket.on('selectionUpdate', function(data) {
	socketSelectionUpdate(data);
});

socket.on('mapObjectAdd', function(data) {
	socketMapObjectAdd(data);
});

socket.on('mapObjectRemove', function(data) {
	socketMapObjectRemove(data);
});

socket.on('clientDisconnect', function(data) {
	socketClientDisconnect(data);
});

socket.on('consoleLog',function(data) {
	socketConsoleLog(data);
});

/* Socket functions handle the data retrieved from the socket */

function socketOtherCharMove(data){
	if(!loaded){
		setTimeout(function(){
			socketOtherCharMove(data);
		}, loadRetryTime);
		return;
	}
	
	updateOtherChar(data.player);
}

function socketGlobalParticleUpdate(data){
	if(!loaded){
		setTimeout(function(){
			socketGlobalParticleUpdate(data);
		}, loadRetryTime);
		return;
	}
	var system = makeParticleSystem(data.particles);
	particleSystemList.push(system);
}

function socketParticleHits(data){
	//there is something wrong with how this handles setting health / energy.
	//it sometimes sets the wrong player, until they move.
	if(!loaded){
		setTimeout(function(){
			socketParticleHits(data);
		}, loadRetryTime);
		return;
	}
	
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
}

function socketNpcUpdate(data){
	if(!loaded){
		setTimeout(function(){
			socketNpcUpdate(data);
		}, loadRetryTime);
		return;
	}
	
	transferNPCData(data.npcArray);
}

function socketChatUpdate(data){
	if(!loaded){
		setTimeout(function(){
			socketChatUpdate(data);
		}, loadRetryTime);
		return;
	}
	
	//strip tags
	data.message = message = jQuery('<p>' + data.message + '</p>').text();
	if(data.sender != undefined){
		//show the message above the player's head
		addChatToPlayer(data.message, data.sender);
		//show the chat in the form of name: message
		updateChatBox("Client " + data.sender + ": " + data.message);
	}else{
		//just print the message
		updateChatBox(data.message);
	}
}

function socketInventoryUpdate(data){
	if(!loaded){
		setTimeout(function(){
			socketInventoryUpdate(data);
		}, loadRetryTime);
		return;
	}
	
	updateInventory(data.playerInventory.inventory);
}

function socketDroppedItems(data){
	if(!loaded){
		setTimeout(function(){
			socketDroppedItems(data);
		}, loadRetryTime);
		return;
	}
	
	updateDroppedItems(data.itemArray,data.timeNow);
}

function socketCharLeaveChunk(data){
	if(!loaded){
		setTimeout(function(){
			socketCharLeaveChunk(data);
		}, loadRetryTime);
		return;
	}
	
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
}

function socketCharEnterChunk(data){
	if(!loaded){
		setTimeout(function(){
			socketCharEnterChunk(data);
		}, loadRetryTime);
		return;
	}
	
	//data from the chunk that we entered, setting state of all moveObj's to false in order to prevent double movement
	loadCharacters(data.sendMoveEvents,true);
	transferNPCData(data.sendNPCs);
	updateDroppedItems(data.sendItems,new Date().getTime());
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
			previouslyLoadedChunks[thisChunkId] = physicalChunk;
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
	//objects need to be loaded after the chunk planes are loaded.
	//wait 500ms for chunk to be loaded, then add objects.
	setTimeout(function(){
		addObjects(data.sendObjects);
	},500);
}

function socketOtherCharacterChangeWeapon(data){
	if(!loaded){
		setTimeout(function(){
			socketOtherCharacterChangeWeapon(data);
		}, loadRetryTime);
		return;
	}
	changeOtherCharacterWeapon(data.newType,data.connectionNum);
}

function socketSelectionUpdate(data){
	if(!loaded){
		setTimeout(function(){
			socketSelectionUpdate(data);
		}, loadRetryTime);
		return;
	}
	
	//TODO - implement
}

function socketMapObjectAdd(data){
	if(!loaded){
		setTimeout(function(){
			socketMapObjectAdd(data);
		}, loadRetryTime);
		return;
	}
	
	var newObjects = data.newObjects;
	var chunkId = data.chunkId;
	//add the object
	addObjects(newObjects);
	//add it to the chunk
	getChunk(chunkId).objects.push(newObjects[0]);
}

function socketMapObjectRemove(data){
	if(!loaded){
		setTimeout(function(){
			socketMapObjectRemove(data);
		}, loadRetryTime);
		return;
	}
	
	removeObjects(data.removedObjectIds);
	var chunkId = data.chunkId;
	var chunk = getChunk(chunkId);
	var chunkObjs = chunk.objects;
	var indexOfObjId = chunkObjs.indexOf(data.removedObjectIds[0]);
	chunkObjs.splice(indexOfObjId,1);
}

function socketClientDisconnect(data){
	if(!loaded){
		setTimeout(function(){
			socketClientDisconnect(data);
		}, loadRetryTime);
		return;
	}
	
	removeCharacter(data.connectionNum);
}

function socketConsoleLog(data){
	if(!loaded){
		setTimeout(function(){
			socketConsoleLog(data);
		}, loadRetryTime);
		return;
	}
	
	console.log(data);
}
