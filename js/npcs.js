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
				
				if(npc.colladascene != undefined){
					var deltaX = npcMoveObj.moveTo.x - npcMoveObj.currentPosition.x;
					var deltaY = npcMoveObj.moveTo.y - npcMoveObj.currentPosition.y;
					var newRot = Math.atan(deltaY/deltaX);
					if(deltaX < 0){
						newRot += Math.PI;
					}
					npc.colladascene.rotation.z = newRot + npc.baseRotationZ;
					
					var nextFrame = npc.lastFrame + 1;
					if(nextFrame >= npc.totalFrames){
						nextFrame = 0;
					}
					npc.skin.morphTargetInfluences[npc.lastFrame] = 0;
					npc.skin.morphTargetInfluences[nextFrame] = 1;
					npc.lastFrame = nextFrame;
				}
			}else{
				npcMoveObj.moving = false;
				if(npc.skin != undefined){
					//it can be undefined while loading at the beginning sometimes
					npc.skin.morphTargetInfluences[npc.lastFrame] = 0;
					npc.lastFrame = 0;
					npc.skin.morphTargetInfluences[0] = 1;
				}
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
	
	/*var thisRef = this;
	loader.load(bundleData.model,function colladaReady(collada){
		var colladascene = collada.scene;
		thisRef.colladascene = colladascene;
		thisRef.skin = collada.skins [ 0 ];
		thisRef.lastFrame = 0;
		thisRef.totalFrames = thisRef.skin.morphTargetInfluences.length;
		thisRef.skin.morphTargetInfluences[thisRef.lastFrame] = 0;
		colladascene.scale.x = colladascene.scale.y = colladascene.scale.z = 3.5;
		colladascene.rotation.x -= Math.PI/2;
		colladascene.rotation.z = Math.PI/2;
		thisRef.baseRotationZ = Math.PI/2;
		colladascene.updateMatrix();
		thisRef.entity.add(collada.scene);
	});*/
	
	//determine type
	var name = npcProperties[bundleData.type].name;
	var cloneRef = man;
	
	this.colladascene = cloneRef.colladascene.clone();
	//this.skin = THREE.SceneUtils.cloneObject(man.skin);
	this.skin = cloneRef.skin.clone();
	this.lastFrame = 0;
	this.totalFrames = this.skin.morphTargetInfluences.length;
	this.skin.morphTargetInfluences[this.lastFrame] = 0;
	this.colladascene.scale.x = this.colladascene.scale.y = this.colladascene.scale.z = 3.5;
	this.colladascene.rotation.x -= Math.PI/2;
	this.colladascene.rotation.z = Math.PI/2;
	this.baseRotationZ = Math.PI/2;
	this.colladascene.updateMatrix();
	this.entity.add(this.colladascene);
	
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
}
