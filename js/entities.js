var moveObj = function(){
	this.moving = false;
	this.moveTo = {x:0,y:0};
	this.moveDistEach = {x:0,y:0};
	this.distX = 0;
	this.distY = 0;
	this.numStepsRequired = 1;
	this.numStepsSoFar = 0;
	this.currentPosition = {x:0,y:0};
}

function createMoveEvent(pointObj){
		//creates a new destination based on character's current position and the destination given by pointObj
		
	var destination = {x: pointObj.point.x, y: pointObj.point.y};
	return destination;
	
	/* var newMove = new moveObj();
	newMove.moving = true;
	newMove.moveTo = {x: pointObj.point.x,y: pointObj.point.y};
	
	newMove.distX = newMove.moveTo.x - otherCharacterList[connectionNum].moveObj.currentPosition.x;
	newMove.distY = newMove.moveTo.y - otherCharacterList[connectionNum].moveObj.currentPosition.y;
	
	newMove.numStepsSoFar = 0;
	newMove.currentPosition = {x: otherCharacterList[connectionNum].moveObj.currentPosition.x,y: otherCharacterList[connectionNum].moveObj.currentPosition.y};
	return newMove; */
}

var weapon = function(type){
	var wepProperty = weaponProperties[type];
	this.weaponTexture = THREE.ImageUtils.loadTexture(wepProperty.texture);
	this.materialWeapon = new THREE.MeshBasicMaterial({
		side: THREE.DoubleSide,
		map: this.weaponTexture,
		//transparent: true,
		//side: THREE.DoubleSide
	});
	
	this.entity = new THREE.Mesh(new THREE.CubeGeometry(wepProperty.width, wepProperty.length, wepProperty.width, 1, 1, 1), this.materialWeapon);
	
	this.entity.scale.x = this.entity.scale.y = this.entity.scale.z = .25;
	//this.entity.rotation.z += Math.PI/2;
	this.entity.position.x = -3.25;
	this.entity.position.z = 11;
	this.entity.position.y = -1;
	this.entity.rotation.y += Math.PI/2;
	this.entity.rotation.x -= Math.PI/4;
	this.entity.poop = 6;
	this.type = type;
}

var healthPlane = function(health,maxHealth){
	var planeHeight = 40;
	this.maxHealth = maxHealth;
	this.currentHealth = health;
	
	this.materialRemaining = new THREE.MeshBasicMaterial({
		color: 0x339900, //green
		transparent: true,
		depthTest: false
	});
	
	this.materialTotal = new THREE.MeshBasicMaterial({
		color: 0xDF0101, //red
		wireframe: true,
		transparent: true,
		depthTest: false
	});
	
	this.totalEntity = new THREE.Mesh(new THREE.PlaneGeometry(31, 5), this.materialTotal);
	this.remainingEntity = new THREE.Mesh(new THREE.PlaneGeometry(30, 4), this.materialRemaining);
	
	this.remainingEntity.scale.y = this.currentHealth/this.maxHealth;
	
	this.entity = new THREE.Object3D();
	this.entity.add(this.totalEntity);
	this.entity.add(this.remainingEntity);
	
	//this.entity.rotation.z = Math.PI/2;
	this.entity.position.y = planeHeight;
	
	//set up initial rotation (primarily used for users entering the world)
	if(otherCharacterList[connectionNum] != undefined){
		var otherCharRot = otherCharacterList[connectionNum].healthPlane.entity.rotation;
		this.entity.rotation.x = otherCharRot.x;
		this.entity.rotation.y = otherCharRot.y;
		this.entity.rotation.z = otherCharRot.z;
	}else{
		//they are just joining, so everything is at the default rotation
		this.entity.rotation.x = 0;
		this.entity.rotation.y = 0;
		this.entity.rotation.z = 0;
	}
	
	this.newHealth = function(newHealth){
		//sets health bar size based on newHealth
		this.currentHealth = newHealth;
	}
}
