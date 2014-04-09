function movePlayerTo(x,y){
	var position = {point:{x: x, y: y}};
	addCharacterMoveEvent(position);
}

function updateOtherChar(data){
	var otherConnectionNum = data.connectionNum;
	var otherMoveObj = data.moveObj;
	
	if(otherConnectionNum == connectionNum && otherCharacterList[connectionNum] != undefined){
		//update chunks if we're moving to a new chunk and if this is my character
		if(otherCharacterList[connectionNum].moveObj.currentChunk != data.moveObj.currentChunk){
			//load new chunks
			loadCurrentChunks(data.moveObj.currentChunk);
		}
	}
	
	if(otherCharacterList[otherConnectionNum] == undefined){
		//add a new character
		var character2 = new characterPlane(otherMoveObj.currentPosition.x,otherMoveObj.currentPosition.y,data.img,otherConnectionNum,data.weaponType);
		character2.moveObj = data.moveObj;
		character2.state.health = data.state.health;
		character2.state.maxHealth = data.state.maxHealth;
		character2.state.energy = data.state.energy;
		var thisChunk = getChunk(data.moveObj.currentChunk);
		if(thisChunk.players.indexOf(otherConnectionNum) < 0){
			thisChunk.players.push(otherConnectionNum);
		}
		character2.healthPlane.remainingEntity.scale.x = character2.state.health/character2.state.maxHealth;
		scene.add(character2.entity);
		otherCharacterList[otherConnectionNum] = character2;
		otherCharEntityList[otherConnectionNum] = character2.entity;
	}else{
		//just update current character
		otherCharacterList[otherConnectionNum].moveObj = data.moveObj;
		otherCharacterList[otherConnectionNum].state.health = data.state.health;
		otherCharacterList[otherConnectionNum].state.maxHealth = data.state.maxHealth;
		otherCharacterList[otherConnectionNum].state.energy = data.state.energy;
		var thisChunk = getChunk(data.moveObj.currentChunk);
		if(thisChunk.players.indexOf(otherConnectionNum) < 0){
			thisChunk.players.push(otherConnectionNum);
		}
	}
}

function addCharacterMoveEvent(pointObj,itemHit){
	//get position of itemHit in itemArray with itemHit.object.num
	var itemHitNum = -1;
	if(itemHit != undefined){
		itemHitNum = itemHit.object.num;
	}
	
	//sets global variable states so that animate() knows to update the character's movement
	//get points like intersects[0].point.x
	var destination = createMoveEvent(pointObj);
	
	if(moveCursor != undefined && moveCursor.entity != undefined){
		scene.remove(moveCursor.entity);
	}
	moveCursor = new rectangle(destination.x,destination.y,0,2,2,75,0x660000);
	scene.add(moveCursor.entity);
	
	var sendData = { destination: destination, itemHitNum: itemHitNum};
	socket.emit('MoveEvent', sendData);
}

function removeCharacter(conn){
	console.log("removing character " + conn);
	var charObj = otherCharEntityList[conn];
	otherCharacterList[conn] = undefined;
	otherCharEntityList[conn] = undefined;
	scene.remove(charObj);
}

function loadCharacters(moveEvents,allFalse){
	//initially load characters onto the screen with given moveEvents
	if(allFalse == undefined){
		allFalse = false;
	}
	for(var i=0;i<moveEvents.length;i++){
		if(moveEvents[i] != undefined){
			//right now, newly loaded characters snap to their moveTo position instead
			//of where they actually are.
			//TODO - fix this.^
			moveEvents[i].moveObj.currentPosition = moveEvents[i].moveObj.moveTo;
			if(allFalse){
				moveEvents[i].moveObj.moving = false;
			}
			updateOtherChar(moveEvents[i]);
		}
	}
}

function moveAllCharacters(){
	//loop through otherCharacterList and move them according to their moveObj
	for(var i=0;i<otherCharacterList.length;i++){
		if(otherCharacterList[i] != undefined){
			var otherCharacter = otherCharacterList[i];
			var oMoveObj = otherCharacter.moveObj;
			//a character exists with connectionNum i
			if(otherCharacter.moveObj.moving){
				//the other character is moving
				var timeRequired = oMoveObj.numStepsRequired * 20;
				var timeNow = new Date().getTime();
				if(oMoveObj.numStepsSoFar < oMoveObj.numStepsRequired && (oMoveObj.time + timeRequired) > timeNow){
					//keep moving
					//change character's rotation first
					var deltaX = oMoveObj.moveTo.x - oMoveObj.currentPosition.x;
					var deltaY = oMoveObj.moveTo.y - oMoveObj.currentPosition.y;
					var newRot = Math.atan(deltaY/deltaX);
					if(deltaX < 0){
						newRot += Math.PI;
					}
					otherCharacter.colladascene.rotation.z = newRot + otherCharacter.baseRotationZ;
					
					//then move
					oMoveObj.currentPosition.x += oMoveObj.moveDistEach.x;
					oMoveObj.currentPosition.y += oMoveObj.moveDistEach.y;
					otherCharacter.entity.position.x = oMoveObj.currentPosition.x;
					otherCharacter.entity.position.y = oMoveObj.currentPosition.y;
					oMoveObj.numStepsSoFar++;
					var nextFrame = otherCharacter.lastFrame + 1;
					if(nextFrame >= otherCharacter.totalFrames){
						nextFrame = 0;
					}
					otherCharacter.skin.morphTargetInfluences[otherCharacter.lastFrame] = 0;
					otherCharacter.skin.morphTargetInfluences[nextFrame] = 1;
					otherCharacter.lastFrame = nextFrame;
					//camera is automatically removed in the rotate method
				}else{
					//we reached the destination
					oMoveObj.moving = false;
					oMoveObj.currentPosition.x = oMoveObj.currentPosition.x;
					oMoveObj.currentPosition.y = oMoveObj.currentPosition.y;
					otherCharacter.entity.position.x = oMoveObj.currentPosition.x;
					otherCharacter.entity.position.y = oMoveObj.currentPosition.y;
					if(i == connectionNum){
						//if we're moving my character, remove the moveCursor from the screen
						if(moveCursor != undefined && moveCursor.entity != undefined){
							scene.remove(moveCursor.entity);
						}
					}
					if(otherCharacter.skin != undefined){
						//it can be undefined while loading at the beginning sometimes
						otherCharacter.skin.morphTargetInfluences[otherCharacter.lastFrame] = 0;
						otherCharacter.lastFrame = 0;
						otherCharacter.skin.morphTargetInfluences[0] = 1;
					}
				}
			}else{
				oMoveObj.currentPosition.x = oMoveObj.moveTo.x;
				oMoveObj.currentPosition.y = oMoveObj.moveTo.y;
				otherCharacter.entity.position.x = oMoveObj.currentPosition.x;
				otherCharacter.entity.position.y = oMoveObj.currentPosition.y;
				if(otherCharacter.skin != undefined){
					//it can be undefined while loading at the beginning sometimes
					otherCharacter.skin.morphTargetInfluences[otherCharacter.lastFrame] = 0;
					otherCharacter.lastFrame = 0;
					otherCharacter.skin.morphTargetInfluences[0] = 1;
				}
			}
		}
	}
}

var characterPlane = function(posX,posY,texturePath,id,weaponType){
	this.texturePath = texturePath;
	this.charTexture = THREE.ImageUtils.loadTexture(texturePath);
	this.materialChar = new THREE.MeshLambertMaterial({
		map: this.charTexture,
		transparent: true,
		side: THREE.DoubleSide
	});
	
	this.entity = new THREE.Object3D();
	/*var camel = this;
	loader.load('models/dog.dae',function colladaReady(collada){
		var colladascene = collada.scene;
		camel.colladascene = colladascene;
		camel.skin = collada.skins [ 0 ];
		camel.lastFrame = 0;
		camel.totalFrames = camel.skin.morphTargetInfluences.length;
		camel.skin.morphTargetInfluences[camel.lastFrame] = 0;
		colladascene.scale.x = colladascene.scale.y = colladascene.scale.z = 3.5;
		colladascene.rotation.x -= Math.PI/2;
		colladascene.rotation.z = Math.PI/2;
		camel.baseRotationZ = Math.PI/2;
		colladascene.updateMatrix();
		camel.entity.add(collada.scene);
	});*/
	//this.colladascene = man.colladascene.clone();
	this.colladascene = THREE.SceneUtils.cloneObject(man.colladascene);
	//this.skin = THREE.SceneUtils.cloneObject(man.skin);
	this.skin = this.colladascene.children[3];
	this.lastFrame = 0;
	this.totalFrames = this.skin.morphTargetInfluences.length;
	this.skin.morphTargetInfluences[this.lastFrame] = 0;
	this.colladascene.scale.x = this.colladascene.scale.y = this.colladascene.scale.z = 3.5;
	this.colladascene.rotation.x -= Math.PI/2;
	this.colladascene.rotation.z = Math.PI/2;
	this.baseRotationZ = Math.PI/2;
	this.colladascene.updateMatrix();
	this.entity.add(this.colladascene);
	
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	this.entity.rotation.x += Math.PI/2; //make it vertical
	this.entity.castShadow = false;
	this.entity.connectionNum = id;
	this.id = id;
	//this.entity = new THREE.Mesh(new THREE.PlaneGeometry(28, 56), this.materialChar);
	
	
	this.materialHat = THREE.ImageUtils.loadTexture('img/clothing/hat.png');
	this.hat = new THREE.Mesh(new THREE.PlaneGeometry(28,32), this.materialHat);
	
	this.moveObj = new moveObj();
	this.moveObj.currentPosition.x = posX;
	this.moveObj.currentPosition.y = posY;
	
	this.healthPlane = new healthPlane(100,100);
	this.entity.add(this.healthPlane.entity);
	
	this.weaponType = weaponType;
	this.weapon = new weapon(weaponType);
	this.colladascene.add(this.weapon.entity);
	
	this.changeWeapon = function(newType,itemId){
		//removes old weapon and replaces with new
		var newWeapon = new weapon(newType);
		this.weaponType = newType;
		this.colladascene.remove(this.weapon.entity);
		this.weapon = newWeapon;
		this.colladascene.add(this.weapon.entity);
		
		//change wieldBox picture if this is me
		if(id == connectionNum){
			var correspondingItem = weaponProperties[newType].item;
			var wieldedBox = document.getElementById("wieldedBox");
			if(wieldedBox){
				if(correspondingItem == -1){
					wieldedBox.style.backgroundImage = "url('')";
					wieldedBox.removeAttribute("data-menu");
				}else{
					thisItemProp = itemProperties[correspondingItem];
					var bgImg = thisItemProp.img;
					wieldedBox.style.backgroundImage = "url(" + bgImg + ")";
					wieldedBox.setAttribute('data-menu',(new wieldedBoxMenu(newType)).join("_"));
				}
			}
		}
	}
	
	this.state = new Object();
}

function changeOtherCharacterWeapon(newType,otherConnNum){
	var character = otherCharacterList[otherConnNum];
	character.changeWeapon(newType);
}

function changeCharacterWeapon(newType,itemId){
	//newType is new type of weapon that will be weilded, itemId is the inventory spot number for that weapon
	var sendData = { newType: newType, itemId: itemId };
	socket.emit("WeaponChangeEvent",sendData);
}
