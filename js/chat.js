function updateOverlay(){
	document.bgColor = "#" + fogColor.toString(16); //int to hex;
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
	chatBox.value += "\n" + message;
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
		}else if(command == 'medit'){
			socket.emit('MapObjectPlaceEvent', {});
		}
		return false;
	}else{
		return true;
	}
}
