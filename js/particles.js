function addParticleMoveEvent(pointObj){
	var energyAmount = parseInt(document.getElementById("energy").innerHTML);
	//need client-side check for this to keep energy count correct
	if(energyAmount >= particleProperties[particleSelection].energy){
		otherCharacterList[connectionNum].state.energy -= particleProperties[particleSelection].energy; //subtract the correct energy (is validated with server later)
		var destination = createMoveEvent(pointObj);
		//send particle movement data to server
		var particleType = particleSelection;
		var sendData = { destination: destination, particleType: particleType};
		socket.emit('ParticleEvent', sendData);
	}
}

function makeParticleSystem(data){
	//create a particle system and cause its creator to appear to fire it
	var moveObj = data.moveObj;
	
	var firer = data.firer;
	var firerType = data.firerType;
	if(data.firerType == PLAYER_CONST){
		//the character could potentially be gone
		if(otherCharacterList[firer]){
			otherCharacterList[firer].lookAt(moveObj.moveTo);
			otherCharacterList[firer].weapon.cock();
		}
	}else if(data.firerType == NPC_CONST){
		//the npc could potentially be gone
		if(npcArray[firer]){
			npcArray[firer].lookAt(moveObj.moveTo);
		}
	}
	
	var particleType = data.particleType;
	var particleInfo = particleProperties[particleType];
	var system = new particleSystem(moveObj,7,particleInfo.color);
	system.explodingSteps = particleInfo.radius/3;
	system.explodeIncrease = system.explodingSteps/particleInfo.radius;
	system.moveObj = moveObj;
	scene.add(system.entity);
	return system;
}

function moveAllParticles(){
	var systemsToRemove = new Array();
	for(var i=0;i<particleSystemList.length;i++){
		var system = particleSystemList[i];
		if(system != undefined){
			var systemMoveObj = system.moveObj;
			if(systemMoveObj.moving){
				//the particle system is moving	
				if(systemMoveObj.numStepsSoFar < systemMoveObj.numStepsRequired){
					//keep moving
					systemMoveObj.currentPosition.x += systemMoveObj.moveDistEach.x;
					systemMoveObj.currentPosition.y += systemMoveObj.moveDistEach.y;
					system.entity.position.x = systemMoveObj.currentPosition.x;
					system.entity.position.y = systemMoveObj.currentPosition.y;
					system.entity.position.z -= (otherCharacterList[connectionNum].entity.position.z/systemMoveObj.numStepsRequired);
					systemMoveObj.numStepsSoFar++;
				}else{
					//we reached the destination
					if(system.doneExploding == false){
						//do the explosion, by changing the scale of the particle systems
						system.entity.scale.x += system.explodeIncrease;
						system.entity.scale.y += system.explodeIncrease;
						system.pMaterial.opacity -= (.5/system.explodingSteps);
						system.explodingStepsSoFar++;
						if(system.explodingStepsSoFar >= system.explodingSteps){
							system.doneExploding = true;
						}
					}else{
						//remove the particle system
						systemMoveObj.moving = false;
						systemsToRemove.push(i);
					}
				}
			}
		}
	}
	
	//now remove the indexes that we found were at their destinations, go backwards so it doesn't throw off the indexes
	for(var i=systemsToRemove.length-1;i>=0;i--){
		var elementIndex = systemsToRemove[i];
		var removedSystem = particleSystemList[elementIndex];
		particleSystemList.splice(elementIndex,1); //remove it from the array
		scene.remove(removedSystem.entity);
	}
}

//preload the texture for particles so that it doesn't have to be done every time
var particleTexture = THREE.ImageUtils.loadTexture("img/textures/particle2.png");

var particleSystem = function(moveObj,rad,color){
	this.rad = rad;
	this.particleCount = 40;
	this.particles = new THREE.Geometry();
	this.pMaterial = new THREE.ParticleBasicMaterial({
		color: color,
		size: 25,
		map: particleTexture,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	});
	
	for(var i=0;i<this.particleCount;i++){
		var pX = (Math.random() * (rad*2));
		if(pX >= rad){
			pX -= (rad*2);
		}
		var pY = (Math.random() * (rad*2));
		if(pY >= rad){
			pY -= (rad*2);
		}
		var pZ = (Math.random() * (rad*2)) - rad + rad/2;
		var particle = new THREE.Vector3(pX, pY, pZ);
		this.particles.vertices.push(particle);
	}
	this.moveObj = moveObj;
	this.entity = new THREE.ParticleSystem(this.particles,this.pMaterial);
	this.entity.position.x = moveObj.currentPosition.x;
	this.entity.position.y = moveObj.currentPosition.y;
	this.entity.position.z = otherCharacterList[connectionNum].entity.position.z;
	this.doneExploding = false;
	this.explodeIncrease = .2;
	this.explodingStepsSoFar = 0;
	this.explodingSteps = 8;
}
