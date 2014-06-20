window.requestAnimFrame = (function(callback){
	return window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function(callback){
		window.setTimeout(callback, 1000 / 60);
	};
})();

function rotate(){
	//controls player's movement and camera rotation
	var rotationRadius = 400;
	
	//CAMERA ROTATION WORKS around world axis. (theta is set here as well)
	var angleChanged;
	if(rotating == 1){
		theta -= angleChange;
		worldCamera.entity.rotateAroundWorldAxis(new THREE.Vector3(0,0,1), angleChange);
		angleChanged = angleChange;
	}else if(rotating == 2){
		theta += angleChange;
		worldCamera.entity.rotateAroundWorldAxis(new THREE.Vector3(0,0,1), -angleChange);
		angleChanged = -angleChange;
	}
	
	if(rotating != 0){
		//rotate health bars
		for(var i=0;i<otherCharacterList.length;i++){
			var thisCharacter = otherCharacterList[i];
			if(thisCharacter != undefined){
				if(thisCharacter.id == connectionNum){
					thisCharacter.healthPlane.entity.rotateAroundWorldAxis(new THREE.Vector3(0,1,0), angleChanged);
				}else{
					thisCharacter.healthPlane.entity.rotation.setFromRotationMatrix(otherCharacterList[connectionNum].healthPlane.entity.matrix);
				}
			}
		}
		for(var i=0;i<npcArray.length;i++){
			var thisNpc = npcArray[i];
			if(thisNpc != undefined){
				//rotateAroundWorldAxis(thisNpc.healthPlane.entity, new THREE.Vector3(0,1,0), angleChanged);
				thisNpc.healthPlane.entity.rotation.setFromRotationMatrix(otherCharacterList[connectionNum].healthPlane.entity.matrix);
			}
		}
	}
	
	if(rotating != 0){
		updateChatBoxPositions();
	}
	
	//physically move camera
	worldCamera.entity.position.x = rotationRadius * Math.cos( theta ) + otherCharacterList[connectionNum].moveObj.currentPosition.x;
	worldCamera.entity.position.y = -rotationRadius * Math.sin( theta ) + otherCharacterList[connectionNum].moveObj.currentPosition.y;
	if(otherCharacterList[connectionNum].entity.position){
		worldLight.entity.position.x = otherCharacterList[connectionNum].entity.position.x;
		worldLight.entity.position.y = otherCharacterList[connectionNum].entity.position.y;
	}
}

function animate(lastTime, angularSpeed, three){
	//runs at about 1000/17 FPS (17MS per frame)
	//update
	var date = new Date();
	var time = date.getTime();
	var timeDiff = time - lastTime;
	
	//READ--
	/* Due to chrome and firefox having different javascript speeds, rendering
	takes about 5-12 milliseconds on chrome and about 40 on firefox.
	This will cause the animate loop to execute differently based on the browser.
	To make sure that game movement is in sync on firefox with the server as
	much as chrome is, it's necessary to run game functions X number of times
	per animation frame. This is done by finding out how much time has passed since the
	last time we rendered and this time we rendered, then calculating how many server
	"frames" happened since. Server calculates movement at 17 milliseconds per frame.
	Adjust the client to move more per animation frame on the client to make up for speed
	loss.
	
	TODO - make sure movement can't be too fast, like in some versions of chrome.
	*/
	
	//number of game loops to run
	var timeLeft = 0;
	var numIterations = Math.floor(timeDiff / MPF);
	if(numIterations < 1){
		numIterations = 1;
		timeLeft = MPF - timeDiff;
	}else if(numIterations > 5){
		numIterations = 5;
	}
	
	//moves and rotates character
	for(var n=0;n<numIterations;n++){
		//PUT ALL GAME UPDATES IN HERE (not graphical / rendering things)
		moveAllCharacters();
		rotate();
		moveAllParticles();
		moveAllNPCs();
		//update energy display
		document.getElementById('energy').innerHTML = otherCharacterList[connectionNum].state.energy;
	}
	
	lastTime = time;

	//render
	renderer.render(three.scene, worldCamera.entity);

	//request new frame, waiting timeLeft time before animating
	setTimeout(function(){
		requestAnimFrame(function(){
			animate(lastTime, angularSpeed, three);
		});
	},timeLeft);
}

function createRenderer(){
	renderer = new THREE.WebGLRenderer();
	//renderer = new THREE.CanvasRenderer(); //terrible with the ground & no particles
	//shadow stuff start
	/*renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;

	renderer.shadowCameraNear = 3;
	renderer.shadowCameraFar = worldCamera.entity.far;
	renderer.shadowCameraFov = 50;

	renderer.shadowMapBias = 0.0039;
	renderer.shadowMapDarkness = 0.5;
	renderer.shadowMapWidth = mapSize;
	renderer.shadowMapHeight = mapSize;*/
	//shadow stuff end
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize(event) {
	renderer.setSize(window.innerWidth, window.innerHeight);

	worldCamera.entity.aspect = window.innerWidth / window.innerHeight;
	worldCamera.entity.updateProjectionMatrix();
}

var directionalCamera = function(posX,posY,posZ){
	this.entity = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	this.entity.position.z = posZ;
}

var directionalLight = function(posX,posY,posZ,intensity){
	//originally 0xCCCCCC
	this.entity = new THREE.DirectionalLight(0xffffff, 1);
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	this.entity.position.z = 100;
	this.entity.intensity = .1;
}
