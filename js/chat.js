function updateOverlay(){
	var chatContainer = document.getElementById("chatContainer");
	var chatBox = document.getElementById("chatBox");
	var chatLine = document.getElementById("message");
	chatLine.focus();
	chatLine.value = "";
	
	//add 10 empty lines to chatbox
	for(var i=0;i<10;i++){
		chatBox.value += "\n";
	}
	
	chatBox.style.height = chatBoxHeight;
	chatBox.scrollTop = chatBox.scrollHeight;
	
	createInnerMenu();
}

function updateChatBox(message){
	var chatBox = document.getElementById("chatBox");
	chatBox.scrollTop = 1000;
	/*chatBox.value = "";
	for(var i=0;i<chatArray.length;i++){
		if(chatArray[i] == undefined){
			chatArray[i] = "";
		}
		chatBox.value += chatArray[i];
		if(i != chatArray.length-1){
			chatBox.value += "\n";
		}
	}*/ //this is from old version, TODO - delete
	chatBox.innerHTML += " <br>" + message;
	chatBox.scrollTop = chatBox.scrollHeight;
}

function sendChatMessage(){
	var chatLine = document.getElementById("message");
	chatMessage = chatLine.value;
	if(chatMessage == "" || chatMessage == undefined){
		//don't send blank messages
		return;
	}
	chatLine.value = "";
	var ok = checkMessage(chatMessage); //checks for commands
	if(ok){
		socket.emit('ChatEvent', { message: chatMessage });
	}
}

function checkMessage(message){
	if(message.charAt(0) == '/'){
		var command = message.slice(1,message.length).toLowerCase();
		if(command == "hide"){
			chatBox.style.height = 0;
		}else if(command == "show"){
			chatBox.style.height = chatBoxHeight;
		}else if(command == "heal"){	
			var me = otherCharacterList[connectionNum];
			var oldParticleSelection = particleSelection;
			particleSelection = 8;
			var healthNeeded = me.state.maxHealth - me.state.health;
			var healEach = Math.abs(particleProperties[particleSelection].damage);
			var healsNeeded = Math.ceil(healthNeeded/healEach);
			for(var i=0;i<healsNeeded;i++){
				var newPointObj = new Object();
				newPointObj.point = {x:me.moveObj.currentPosition.x,y:me.moveObj.currentPosition.y};
				addParticleMoveEvent(newPointObj);
			}
			particleSelection = oldParticleSelection;
		}else if(command == "killall"){
			//kills all in current chunk
			var currentChunkId = otherCharacterList[connectionNum].moveObj.currentChunk;
			var currentChunk = getChunk(currentChunkId);
			var npcsInChunk = currentChunk.npcs;
			var oldParticleSelection = particleSelection;
			particleSelection = 12;
			var thisParticleDamage = particleProperties[particleSelection].damage;
			for(var i=0;i<npcsInChunk.length;i++){
				var thisNpc = npcArray[npcsInChunk[i]];
				var thisHealth = thisNpc.state.health;
				var newPointObj = new Object();
				newPointObj.point = {x:thisNpc.moveObj.currentPosition.x,y:thisNpc.moveObj.currentPosition.y};
				var shotsNeeded = Math.ceil(thisHealth/thisParticleDamage);
				for(var n=0;n<shotsNeeded;n++){
					addParticleMoveEvent(newPointObj);
				}
			}
			particleSelection = oldParticleSelection;
		}else if(command == "getpos"){
			var positionString = "x: " + otherCharacterList[connectionNum].entity.position.x + ", y: " + otherCharacterList[connectionNum].entity.position.y;
			document.getElementById("message").value = positionString;
			sendChatMessage();
		}else if(command.indexOf("medit") == 0){
			//command format: /medit <type> <rotation-coefficient(optional)>
			//this command will check if a user is admin on the server before performing it
			//first parse the command and place the given type at the player's current coordinates
			var separatedCommand = command.split(" ");
			var type = parseInt(separatedCommand[1]);
			var rotationCoefficient = 0;
			if(separatedCommand.length > 2){
				rotationCoefficient = parseInt(separatedCommand[2]);
			}
			
			var playerMoveObj = otherCharacterList[connectionNum].moveObj;
			var x = playerMoveObj.currentPosition.x;
			var y = playerMoveObj.currentPosition.y;
			var z = 0;
			
			placeMapObject(x, y, z, rotationCoefficient, type)
		}else if(command == "editmode"){
			//toggle on or off editmode for this player
			var me = otherCharacterList[connectionNum];
			if(me.admin){
				if(me.editmode){
					me.editmode = false;
					updateChatBox("Editmode off.");
				}else{
					me.editmode = true;
					updateChatBox("Editmode on.");
				}
			}else{
				updateChatBox("You don't have permission to perform that command.");
			}
		}else if(command == "createpath"){
			//creates a path between 2 points
			var me = otherCharacterList[connectionNum];
			if(me.admin){
				//TODO
			}else{
				updateChatBox("You don't have permission to perform that command.");
			}
		}
		return false;
	}else{
		return true;
	}
}

function addChatToPlayer(message, playerId){
	//uncapitalize everything in the message
	//message = message.toLowerCase();
	var senderPlayer = otherCharacterList[playerId];
	if(senderPlayer != undefined){
		//first remove their old chatElem if there is one
		if(senderPlayer.chatElemId != undefined && senderPlayer.chatElemId != ""){
			var oldChatElem = document.getElementById(senderPlayer.chatElemId);
			if(oldChatElem != undefined){
				oldChatElem.parentNode.removeChild(oldChatElem);
			}
		}
		var screenPos = toScreenXY(new THREE.Vector3().setFromMatrixPosition(senderPlayer.healthPlane.entity.matrixWorld));
		var chatElem = document.createElement("div");
		chatElem.innerHTML = message;
		chatElem.className = "chatText";
		chatElem.id = "chat-" + Math.random().toString(36).substring(7);
		chatElem.style.top = screenPos.y;
		chatElem.style.left = screenPos.x;
		document.body.appendChild(chatElem);
		setChatFontSize(senderPlayer, chatElem);
		var chatWidth = chatElem.offsetWidth;
		var realPosLeft = screenPos.x - (chatWidth / 2);
		chatElem.style.left = realPosLeft;
		
		senderPlayer.chatElemId = chatElem.id;
		setTimeout(function(){
			//remove the chat after chatDisappearDelay milliseconds
			removeChatFromPlayer(playerId, chatElem.id);
		},chatDisappearDelay);
	}
}

function removeChatFromPlayer(playerId, chatId){
	//if chatId is given, the chat div above the player's head must have that id or it will not be removed.
	//if chatId is not given, it immediately removes it.
	var senderPlayer = otherCharacterList[playerId];
	if(senderPlayer != undefined){
		if(senderPlayer.chatElemId != chatId){
			return;
		}
		var chatElem = document.getElementById(chatId);
		if(chatElem != undefined){
			chatElem.parentNode.removeChild(chatElem);
		}
	}
}

function updateChatBoxPositions(){
	//updates positions of chat elements for all players on the screen
	for(var i=0;i<otherCharacterList.length;i++){
		updateChatBoxPosition(i);
	}
}

function setChatFontSize(player, chatElem){
	//calculate and set the appropriate font size
	var me = otherCharacterList[connectionNum];
	var distAway = getDist(player.entity.position, me.entity.position);
	var deductionFraction = (distAway / chatVisibleDistance) / 2;
	if(distAway > chatVisibleDistance){
		deductionFraction = 1;
	}
	var newFontSize = chatFontSize * (1 - deductionFraction);
	chatElem.style.fontSize = newFontSize;
}

function updateChatBoxPosition(playerId){
	//updates position of the given player's chat element
	var thisCharacter = otherCharacterList[playerId];
	if(thisCharacter != undefined && thisCharacter.chatElemId != undefined && thisCharacter.chatElemId != ""){
		var chatElem = document.getElementById(thisCharacter.chatElemId);
		if(chatElem != undefined){
			var newScreenPos = toScreenXY(new THREE.Vector3().setFromMatrixPosition(thisCharacter.healthPlane.entity.matrixWorld));
			setChatFontSize(thisCharacter, chatElem);
			var chatWidth = chatElem.offsetWidth;
			var realPosLeft = newScreenPos.x - (chatWidth / 2);
			chatElem.style.left = realPosLeft;
			chatElem.style.top = newScreenPos.y;
		}
	}
}
