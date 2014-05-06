var modelsLoaded = false;

window.onload = function(){
	loadPanelData();
	loadModels();
	socket.on('connectionInfo', function (data) {
		onLoad(data);
	});
};

function onLoad(data){
	console.log(modelsLoaded);
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

	// camera
	worldCamera = new directionalCamera(0,-450,250);
	worldCamera.entity.rotation.x = 65 * (Math.PI / 180);

	//create renderer
	createRenderer();

	// scene
	scene = new THREE.Scene();
	
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
	
	var light = new directionalLight(100,75,300,1);
	scene.add(light.entity);
	
	var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
	hemiLight.color.setHSV( 0,0,0 );
	hemiLight.groundColor.setHSV( 0.095, 0.5, 0.5 );
	hemiLight.position.set( 0, 500, 0 );
	scene.add( hemiLight );

	// create an object to carry some items to the animate method
	var three = {
		scene: scene
	};
	
	animate(lastTime, angularSpeed, three);
}

function loadModels(){
		
	//load all the required models asynchronously
	var objs = ["man","dog"];
	var i = 0;
	objs.forEach(function(str){
		var obj = window[str];
		obj = new Object();
		window[str] = obj;
		obj.entity = new THREE.Object3D();
		var thisRef = obj;
		//NEED TO MAKE A COMPLETELY NEW LOADER SO THAT WHEN IT IS LOADING MULTIPLE MODELS AT THE SAME TIME,
		//IT WILL STILL WORK.
		var thisLoader = new THREE.ColladaLoader();
		thisLoader.load("models/" + str + ".dae", function colladaReady(collada){
			var colladascene = collada.scene;
			thisRef.colladascene = colladascene;
			thisRef.skin = collada.skins [ 0 ];
			thisRef.lastFrame = 0;
			thisRef.totalFrames = thisRef.skin.morphTargetInfluences.length;
			thisRef.skin.morphTargetInfluences[thisRef.lastFrame] = 0;
			colladascene.scale.x = colladascene.scale.y = colladascene.scale.z = 3.5;
			colladascene.updateMatrix();
			thisRef.entity.add(collada.scene);
			i++;
			if(i == objs.length){
				//models are done loading
				modelsLoaded = true;
			}
		});
	});
}
