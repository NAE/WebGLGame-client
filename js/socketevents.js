/* Most of the socket.on blocks are no longer in use, but keep anyway in case emergency events are sent */

function reconnectSocket(){
	socket.socket.connect();
}

function initSocketEvents(){
	socket = io.connect('http://' + document.domain + ':3000');
	
	socket.on('loginResponse', function(data) {
		socketLoginResponse(data);
	});
	
	socket.on('signupResponse', function(data) {
		socketSignupResponse(data);
	});
	
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

	socket.on('playerInteract', function(data) {
		socketPlayerInteract(data);
	});

	socket.on('clientDisconnect', function(data) {
		socketClientDisconnect(data);
	});

	socket.on('consoleLog', function(data) {
		socketConsoleLog(data);
	});
	
	socket.on('disconnect', function(){
        //refresh the page, the login page should show that the
		updateChatBox("Lost connection to server. Logging out in 3 seconds...");
		setTimeout(function(){
			updateChatBox("2 seconds...");
		}, 1000);
		setTimeout(function(){
			updateChatBox("1 second...");
		}, 2000);
        setTimeout(function(){
			history.go(0);
		}, 3000);
    });

	socket.on('event', function(data) {
		//data is an array of events
		for(var i=0;i<data.length;i++){
			var event = data[i];
			handleEvent(event);
		}
	});
}
var totalBytes = 0;
function handleEvent(event){
	totalBytes += JSON.stringify(event).length;
	console.log(totalBytes);
	var eventName = event.eventName;
	//based on the event name, handle the event accordingly
	switch(eventName){
		case "loginResponse":
			socketLoginResponse(event);
			break;
		case "signupResponse":
			socketSignupResponse(event);
			break;
		case "otherCharMove":
			socketOtherCharMove(event);
			break;
		case "globalParticleUpdate":
			socketGlobalParticleUpdate(event);
			break;
		case "particleHits":
			socketParticleHits(event);
			break;			
		case "npcUpdate":
			socketNpcUpdate(event);
			break;			
		case "chatUpdate":
			socketChatUpdate(event);
			break;			
		case "inventoryUpdate":
			socketInventoryUpdate(event);
			break;			
		case "droppedItems":
			socketDroppedItems(event);
			break;
		case "charLeaveChunk":
			socketCharLeaveChunk(event);
			break;
		case "charEnterChunk":
			socketCharEnterChunk(event);
			break;
		case "otherCharacterChangeWeapon":
			socketOtherCharacterChangeWeapon(event);
			break;
		case "selectionUpdate":
			socketSelectionUpdate(event);
			break;
		case "mapObjectAdd":
			socketMapObjectAdd(event);
			break;
		case "mapObjectRemove":
			socketMapObjectRemove(event);
			break;
		case "clientDisconnect":
			socketClientDisconnect(event);
			break;
		case "consoleLog":
			socketConsoleLog(event);
			break;
		default:
			//do nothing
			break;
	}
}

/* Socket functions handle the data retrieved from the socket */

function socketLoginResponse(data){
	//don't need to wait for load here
	var successfulLogin = data.success;
	var failMessage = data.message;
	
	if(successfulLogin){
		//the data is all the inital data (formerly handled in connectionInfo socket event)
		$("#loginForm").find("input[type=text], input[type=password]").val("");
		loadGame(data);
	}else{
		//display the fail message to the user
		$("#loginError").html(failMessage);
		$("#loginError").css("visibility", "visible");
	}
}

function socketSignupResponse(data){
	if(data.providedUsername != undefined){
		//it was a temporary account signup
		localStorage.setItem("tempAccount", true);
		localStorage.setItem("tempUsername", data.providedUsername);
		localStorage.setItem("tempPassword", data.providedPassword);
		//recall signup so it logs them in
		signup(true);
		return;
	}
	if(!data.success){
		$("#signupError").addClass("errorBox");
		$("#signupError").removeClass("successBox");
		var failMessage = "";
		
		if(!data.username){
			$("#desiredUsername").addClass("errorTextBox");
			failMessage += "* username already taken or is not allowed.<br>";
		}else{
			$("#desiredUsername").removeClass("errorTextBox");
		}
		
		if(!data.password){
			$("#desiredPassword").addClass("errorTextBox");
			failMessage += "* passwords must be at least 8 characters long.<br>";
		}else{
			$("#desiredPassword").removeClass("errorTextBox");
		}
		
		if(!data.confirmPassword){
			$("#confirmPassword").addClass("errorTextBox");
			failMessage += "* passwords do not match.<br>";
		}else{
			$("#confirmPassword").removeClass("errorTextBox");
		}
		
		if(!data.email){
			$("#email").addClass("errorTextBox");
			failMessage += "* email is invalid.<br>";
		}else{
			$("#email").removeClass("errorTextBox");
		}
		
		$("#signupError").html(failMessage);
		$("#signupError").css("visibility", "visible");
	}else{
		//signup was successful
		if(data.removeTempAccount){
			localStorage.removeItem("tempAccount");
			localStorage.removeItem("tempUsername");
			localStorage.removeItem("tempPassword");
			$("#playNow").val("play now and signup later");
			$("#useTemporary").prop("checked", false);
			$("#tempUser").html("");
			$("#useTemporaryRow").hide();
		}
		
		$("#signupForm").find("input[type=text], input[type=password]").val("");
		$("#signupError").addClass("successBox");
		$("#signupError").removeClass("errorBox");
		$("#signupError").html("You were successfully signed up.");
		$("#signupError").css("visibility", "visible");
		$("#signupForm").slideUp();
	}
}

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
		
		//capitalize username's first letter
		data.username = data.username.charAt(0).toUpperCase() + data.username.slice(1);
		
		//display the name in red if the player is an admin
		
		var isAdmin = false;
		var thisPlayer = otherCharacterList[data.sender];
		if(thisPlayer != undefined){
			isAdmin = thisPlayer.admin;
		}
		
		if(isAdmin){
			data.username = "<span class='adminChat'>" + data.username + "</span>";
		}
				
		updateChatBox(data.username + ": " + data.message);
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
	
	var playerId = data.id;
	var otherChar = otherCharacterList[playerId];
	if(otherChar){
		otherChar.updateWeaponColor(data.selection);
	}
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

function socketPlayerInteract(data){
	if(!loaded){
		setTimeout(function(){
			socketPlayerInteract(data);
		}, loadRetryTime);
		return;
	}
	
	var playerId = data.id;
	var objId = data.objId;
	var eventType = data.eventType;
	
	//figure out which event name this is
	var eventName;
	for(var eName in mapObjectEventTypes){
		if(mapObjectEventTypes[eName] == eventType){
			eventName = eName.toLowerCase();
			break;
		}
	}
	
	//if we didn't find the right event then just return
	if(!eventName) return;
	
	//find out how long to play the animation for, using objId
	var mapObj = mapObjectsArray[objId];
	if(!mapObj) return;
	var objProp = objectProperties[mapObj.entity.type];
	var yieldTime;
	if(objProp.yields[0]){
		yieldTime = objProp.yields[0].yieldTime;
	}
	//don't bother doing anything if yieldTime is 0 & if the object has no yields
	if(!yieldTime) return;
	
	var thisPlayer = otherCharacterList[playerId];
	if(!thisPlayer) return;
	
	var animFuncName = "play" + eventName.charAt(0).toUpperCase() + eventName.slice(1);
	
	//need to wait just a bit for the walk animation to stop before changing to a new one
	var animStallTime = 100;
	//call the animation
	setTimeout(function(){
		if(thisPlayer){
			thisPlayer.lookAt(mapObj.entity.position);
			if(thisPlayer[animFuncName]){
				thisPlayer[animFuncName]();
			}
		}
	}, animStallTime);
	
	setTimeout(function(){
		if(thisPlayer){
			thisPlayer.stopAnimation();
		}
	}, yieldTime + animStallTime);
	
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
