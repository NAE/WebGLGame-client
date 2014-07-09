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
		var character2 = new characterPlane(otherMoveObj.currentPosition.x,otherMoveObj.currentPosition.y,data.img,otherConnectionNum,data.weaponType,data.particleSelection);
		character2.moveObj = data.moveObj;
		character2.state.health = data.state.health;
		character2.state.maxHealth = data.state.maxHealth;
		character2.state.energy = data.state.energy;
		if(data.admin){
			character2.admin = true;
		}
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
		var otherCharacter = otherCharacterList[otherConnectionNum];
		otherCharacter.moveObj = data.moveObj;
		otherCharacter.state.health = data.state.health;
		otherCharacter.state.maxHealth = data.state.maxHealth;
		otherCharacter.state.energy = data.state.energy;
		otherCharacter.updateWeaponColor(data.particleSelection);
		otherCharacter.healthPlane.remainingEntity.scale.x = otherCharacter.state.health/otherCharacter.state.maxHealth;
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
	moveCursor.entity.position.z = getZFromPosition(moveCursor.entity.position);
	scene.add(moveCursor.entity);
	
	var sendData = { destination: destination, itemHitNum: itemHitNum};
	socket.emit('MoveEvent', sendData);
}

function removeCharacter(conn){
	var playerObj = otherCharacterList[conn];
	var playerEntityObj = otherCharEntityList[conn];
	//first attempt to remove its chat element
	removeChatFromPlayer(conn, playerObj.chatElemId);
	otherCharacterList[conn] = undefined;
	otherCharEntityList[conn] = undefined;
	scene.remove(playerEntityObj);
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
				//this line was previously: if(oMoveObj.numStepsSoFar < oMoveObj.numStepsRequired && (oMoveObj.time + timeRequired) > timeNow)
				//removed because latency was causing the time to be delayed, and so moving would complete way too early.
				if(oMoveObj.numStepsSoFar < oMoveObj.numStepsRequired){
					//keep moving
					//change character's rotation first
					otherCharacter.lookAt(oMoveObj.moveTo);
					
					//then move
					oMoveObj.currentPosition.x += oMoveObj.moveDistEach.x;
					oMoveObj.currentPosition.y += oMoveObj.moveDistEach.y;
					otherCharacter.entity.position.x = oMoveObj.currentPosition.x;
					otherCharacter.entity.position.y = oMoveObj.currentPosition.y;
					
					//move the z position of the character to match the terrain
					var zPos = getZFromPosition(otherCharacter.entity.position);
					otherCharacter.entity.position.z = zPos;
					
					oMoveObj.numStepsSoFar++;
					
					//anim stuff
					//check if the animation is set to walk, if not, set it
					if(!otherCharacter.isPerforming("walk") || !otherCharacter.animation.isPlaying){
						otherCharacter.changeAnimation("walk");
					}
					otherCharacter.animation.update(.1);
					
					//camera is automatically removed in the rotate method
				}else{
					//we reached the destination
					oMoveObj.moving = false;
					oMoveObj.currentPosition.x = oMoveObj.currentPosition.x;
					oMoveObj.currentPosition.y = oMoveObj.currentPosition.y;
					otherCharacter.entity.position.x = oMoveObj.currentPosition.x;
					otherCharacter.entity.position.y = oMoveObj.currentPosition.y;
					
					//move the z position of the character to match the terrain
					var zPos = getZFromPosition(otherCharacter.entity.position);
					otherCharacter.entity.position.z = zPos;
					
					//stop the animation & reset
					otherCharacter.animation.stop();
					otherCharacter.animation.reset();
					otherCharacter.animation.play();
					otherCharacter.animation.update(.01);
					
					if(i == connectionNum){
						//if we're moving my character, remove the moveCursor from the screen
						if(moveCursor != undefined && moveCursor.entity != undefined){
							scene.remove(moveCursor.entity);
						}
					}
				}
				//update everyone's chatbox position if i'm the character that's moving
				if(i == connectionNum){
					//updatin everyone's
					updateChatBoxPositions();
				}else{
					//update only this character's
					updateChatBoxPosition(i);
				}
			}else{
				oMoveObj.currentPosition.x = oMoveObj.moveTo.x;
				oMoveObj.currentPosition.y = oMoveObj.moveTo.y;
				otherCharacter.entity.position.x = oMoveObj.currentPosition.x;
				otherCharacter.entity.position.y = oMoveObj.currentPosition.y;
			}
		}
	}
}

//TODO - cleanup ... variables are assigned outside of this function to this object, then
//referred to inside this object.
var characterPlane = function(posX,posY,texturePath,id,weaponType,newParticleSelection){
	this.texturePath = texturePath;
	this.charTexture = THREE.ImageUtils.loadTexture(texturePath);
	this.materialChar = new THREE.MeshLambertMaterial({
		map: this.charTexture,
		transparent: true,
		side: THREE.DoubleSide
	});
	
	this.entity = new THREE.Object3D();
	this.skin = man.clone();
	this.entity.add(this.skin);
	this.skin.scale.x = this.skin.scale.y = this.skin.scale.z = 3.5;
	this.oldRot = 0;
	
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	this.entity.rotation.x += Math.PI/2; //make it vertical
	this.entity.castShadow = false;
	this.entity.connectionNum = id;
	this.id = id;
	this.particleSelection = newParticleSelection;
	this.editMode = false;
	this.chatElemId = "";
	
	this.materialHat = THREE.ImageUtils.loadTexture('img/clothing/hat.png');
	this.hat = new THREE.Mesh(new THREE.PlaneGeometry(28,32), this.materialHat);
	
	this.moveObj = new moveObj();
	this.moveObj.currentPosition.x = posX;
	this.moveObj.currentPosition.y = posY;
	
	this.healthPlane = new healthPlane(100,100);
	this.entity.add(this.healthPlane.entity);
	this.healthPlane.entity.position.y += 35;
	
	this.weaponType = weaponType;
	this.weapon = new weapon(weaponType, this.particleSelection);
	this.skin.add(this.weapon.entity);
	
	this.currentAnimationNameGeneric = "";
	//define animation names for this character
	this.animationNames = {
		walk : "walk" + Math.random().toString(36).substring(7),
		shoot : "shoot" + Math.random().toString(36).substring(7)
	};
	
	this.initAnimations = function(){
		//go through the animations and assign their names
		for(var i=0;i<this.skin.geometry.animations.length;i++){
			//assign its new name depending on its current name
			var thisAnim = this.skin.geometry.animations[i];
			var currentName = thisAnim.name;
			thisAnim.name = this.animationNames[currentName];
		}
	}
	this.initAnimations();
	
	this.changeWeapon = function(newType,itemId){
		//removes old weapon and replaces with new
		var newWeapon = new weapon(newType, this.particleSelection);
		this.weaponType = newType;
		this.skin.remove(this.weapon.entity);
		this.weapon = newWeapon;
		this.skin.add(this.weapon.entity);
		
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
	
	this.updateWeaponColor = function(newParticleSelection){
		this.particleSelection = newParticleSelection;
		this.weapon.setParticleColor(particleProperties[newParticleSelection].color);
	}
	
	this.lookAt = function(position){
		var deltaX = position.x - this.moveObj.currentPosition.x;
		var deltaY = position.y - this.moveObj.currentPosition.y;
		var newRot = Math.atan(deltaY/deltaX);
		if(deltaX < 0){
			newRot += Math.PI;
		}
		//otherCharacter.skin.rotation.z = newRot + otherCharacter.baseRotationZ;
		var diff = newRot - this.oldRot;
		if(!isNaN(diff)){
			this.oldRot = newRot;
			this.skin.rotateAroundWorldAxis(new THREE.Vector3(0,1,0), diff);
		}
	}
	
	this.changeAnimationRealName = function(newAnimName){
		//newAnimName must be from this.animationNames
		//search for the animation among the model's animations
		var animIndex = 0;
		for(var i=0;i<this.skin.geometry.animations.length;i++){
			var thisAnim = this.skin.geometry.animations[i];
			if(thisAnim.name == newAnimName){
				animIndex = i;
				break;
			}
		}
		this.skin.geometry.animation = this.skin.geometry.animations[animIndex];
		THREE.AnimationHandler.add(this.skin.geometry.animation);
		
		this.animation = new THREE.Animation(
			this.skin,
			this.skin.geometry.animation.name,
			THREE.AnimationHandler.CATMULLROM
		);
		
		this.animation.reset();
		this.animation.play();
	}
	
	this.changeAnimation = function(newAnimNameGeneric){
		//changes the animation based on a generic animation name, i.e. 'walk'
		this.currentAnimationNameGeneric = newAnimNameGeneric;
		this.changeAnimationRealName(this.animationNames[newAnimNameGeneric]);
	}
	
	this.isPerforming = function(animNameGeneric){
		//returns if this animation is doing the action specified
		return this.currentAnimationNameGeneric == animNameGeneric;
	}
	
	//anim
	this.changeAnimation("walk");
	
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
