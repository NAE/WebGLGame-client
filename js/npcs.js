function moveAllNPCs(){
	//loop through npcArray and move as needed
	for(var i=0;i<npcArray.length;i++){
		if(npcArray[i] != undefined && npcArray[i].moveObj.moving == true){
			//something exists here and it's moving
			var npc = npcArray[i];
			var npcMoveObj = npc.moveObj;
			if(npcMoveObj.numStepsSoFar < npcMoveObj.numStepsRequired){
				//change npc's rotation
				
				npcMoveObj.currentPosition.x += npcMoveObj.moveDistEach.x;
				npcMoveObj.currentPosition.y += npcMoveObj.moveDistEach.y;
				npc.entity.position.x = npcMoveObj.currentPosition.x;
				npc.entity.position.y = npcMoveObj.currentPosition.y;
				npc.entity.position.z = getZFromPosition(npc.entity.position);
				npcMoveObj.numStepsSoFar++;
				
				npc.lookAt(npcMoveObj.moveTo);
			}else{
				npcMoveObj.moving = false;
			}
		}
	}
}

function transferNPCData(data){
	for(var i=0;i<data.length;i++){
		//transfer the array parts that are necessary for the client
		if(data[i] != undefined){
			var npcData = data[i];
			var thisId = npcData.id;
			if(npcArray[thisId] == undefined){
				//create new npc from data
				var newNPC = new npcPlane(npcData);
				npcArray[thisId] = newNPC;
				scene.add(newNPC.entity);
			}else{
				//something already exists here, simply transfer the data
				var newObj = npcData;
				var oldObj = npcArray[thisId];
				oldObj.state.health = newObj.state.health;
				if(!oldObj.moveObj.moving){
					//don't update moveObj if it is still moving
					oldObj.moveObj = newObj.moveObj;
				}
			}
		}
	}
}

var npcPlane = function(bundleData){
	/*this.materialChar = new THREE.MeshLambertMaterial({
		map: THREE.ImageUtils.loadTexture(bundleData.texturePath),
		transparent: true,
		side: THREE.DoubleSide
	});*/
	//this.entity = new THREE.Mesh(new THREE.PlaneGeometry(bundleData.imgDimens.x, bundleData.imgDimens.y), this.materialChar);
	this.entity = new THREE.Object3D();
	
	//determine type
	var name = npcProperties[bundleData.type].name;
	var cloneRef = window[name];
	
	this.skin = cloneRef.clone();
	this.entity.add(this.skin);
	this.skin.scale.x = this.skin.scale.y = this.skin.scale.z = 3.5;
	this.oldRot = 0;
	
	this.entity.position.x = bundleData.moveObj.moveTo.x;
	this.entity.position.y = bundleData.moveObj.moveTo.y;
	this.entity.rotation.x += Math.PI/2; //make it vertical
	
	this.moveObj = bundleData.moveObj;
	
	this.type = bundleData.type;
	this.id = bundleData.id;
	
	this.state = new Object();
	this.state.health = bundleData.state.health;
	this.state.maxHealth = bundleData.state.maxHealth;
	this.state.inCombat = bundleData.state.inCombat;
	
	this.healthPlane = new healthPlane(this.state.health,this.state.maxHealth);
	this.entity.add(this.healthPlane.entity);
	
	this.lookAt = function(position){
		var deltaX = position.x - this.moveObj.currentPosition.x;
		var deltaY = position.y - this.moveObj.currentPosition.y;
		var newRot = Math.atan(deltaY/deltaX);
		if(deltaX < 0){
			newRot += Math.PI;
		}
		//otherCharacter.skin.rotation.z = newRot + otherCharacter.baseRotationZ;
		var diff = newRot - this.oldRot;
		this.oldRot = newRot;
		this.skin.rotateAroundWorldAxis(new THREE.Vector3(0,1,0), diff);
	}
}
