var modelsLoaded = false;
var loaded = false;

window.onload = function(){
	loadPanelData();
	loadModels();
	socket.on('connectionInfo', function (data) {
		//check if all the models are loaded
		waitForLoad(data);
	});
};

function waitForLoad(data){
	if(modelsLoaded){
		onLoad(data);
	}else{
		setTimeout(function(){
			console.log("waiting once");
			waitForLoad(data);
		}, loadRetryTime);
	}
}

function onLoad(data){
	mapSize = data.mapSize;
	particleProperties = data.particleProperties;
	weaponProperties = data.weaponProperties;
	MAX_INVENT_SPACE = data.maxInvent;
	chunkProperties = data.chunkProperties;
	objectProperties = data.objectProperties;
	npcProperties = data.npcProperties;
	
	mapObjectEventTypes = data.mapObjectEventTypes;
	
	MAP_WIDTH = data.mapWidth;
	MAP_HEIGHT = data.mapHeight;
	
	updateOverlay();
	
	updateChatBox(data.message);
	connectionNum = data.connectionNum;
	var angularSpeed = 0.2;
	var lastTime = 0;

	//create renderer
	createRenderer();

	// scene
	scene = new THREE.Scene();
	
	// camera
	worldCamera = new directionalCamera(0,-450,250);
	worldCamera.entity.rotation.x = 65 * (Math.PI / 180);
	
	//now that scene has been initialized, can load other characters into scene
	loadCharacters(data.moveEvents);
	updateInventory(data.moveEvents[connectionNum].inventory.inventory);
	//with fog or not?
	if(fog){
		scene.fog = new THREE.Fog( fogColor,1,fogDistance);
	}
	
	var chunkSize = chunkProperties[0][0].CHUNK_SIZE;
	//worldPlane (invisible) is for player to click to move to without having to factor in different chunk planes being loaded
	//spans entire clickable world
	var worldPlaneX = (MAP_WIDTH * chunkSize) / 2;
	var worldPlaneY = (MAP_HEIGHT * chunkSize) / 2;
	worldPlane = new invisiblePlane(MAP_WIDTH*chunkSize,MAP_HEIGHT*chunkSize,worldPlaneX,worldPlaneY);
	scene.add(worldPlane.entity);
	
	//issue right here...
	loadCurrentChunks(data.moveEvents[connectionNum].moveObj.currentChunk);
	
	transferNPCData(data.npcArray);
	
	itemProperties = data.itemProperties;
	updateDroppedItems(data.itemArray, new Date().getTime());
	
	//wait to add objects, otherwise it won't be able to find the correct z coordinate for them
	setTimeout(function(){
		addObjects(data.objectArray);
		//set loaded to true to indicate that we are all done loading
		loaded = true;
	}, 500);

	//create the player's character
	//character = new characterPlane(currentPosition.x,currentPosition.y,'img/characters/nilepic.png',connectionNum,0);
	//scene.add(character.entity);
	//otherCharacterList[connectionNum] = character;
	//otherCharEntityList[connectionNum] = character.entity;
	
	//socket.emit('moveUpdate', { moveObj: character.moveObj, img: character.texturePath, itemHitNum: -1});
	
	//lighting stuff
	var ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);
	
	worldLight = new directionalLight(1, 1, 1, 1);
	scene.add(worldLight.entity);

	// create an object to carry some items to the animate method
	var three = {
		scene: scene
	};
	
	animate(lastTime, angularSpeed, three);
}

function loadModels(){
	var z = 0;
	objs.forEach(function(str){
		var thisLoader = new THREE.JSONLoader();
		thisLoader.load("models/" + str + ".js", function(geometry, materials){
			var skinnedMesh = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(materials));
			window[str] = skinnedMesh;
			var materials = skinnedMesh.material.materials;
			for(var k in materials){
				materials[k].skinning = true;
			}
			console.log(skinnedMesh);
			z++;
			if(z == objs.length){
				//models are done loading
				modelsLoaded = true;
			}
		});
	});
}
