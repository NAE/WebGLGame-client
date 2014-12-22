var modelsLoaded = false;
var loaded = false;

window.onload = function(){
	initSocketEvents();
	
	//check if they have an temporary account stored, in order to modify parts of the login page
	var credentials = getTempAccount();
	if(credentials != undefined){
		$("#playNow").val($("#playNow").val() + " (" + credentials.username +")");
		$("#useTemporary").prop("checked", true);
		$("#tempUser").html(credentials.username);
		$("#useTemporaryRow").show();
	}
};

function login(){
	if(!socket.socket.connected){
		//first retry the connection
		reconnectSocket();
		//tell them server is offline right now
		$("#loginError").html("Unable to connect to server. Try again in a few minutes.");
		$("#loginError").css("visibility", "visible");
	}
	
	var sendData = {username: $("#username").val(), password: $("#password").val()};
	socket.emit("LoginEvent", sendData);
	//the response is handled in socketevents
}

function loadGame(data){
	//get rid of the front page first
	savedFrontPage = $("#firstScreenOverlay").clone();
	$("#firstScreenOverlay").fadeOut(250, function(){
		$(this).remove();
		ready(data);
	});
}

function restoreFrontPage(){
	$("body").append(savedFrontPage);
}

function ready(data){
	document.onkeydown = checkKey;
	document.onkeyup = checkStop;
	document.onmousedown = onDocumentMouseDown;
	loadPanelData();
	loadModels();
	waitForLoad(data);
}

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
	worldCamera = new directionalCamera(0,-450,cameraElevation);
	worldCamera.entity.rotation.x = 65 * (Math.PI / 180);
	
	//now that scene has been initialized, can load other characters into scene
	loadCharacters(data.moveEvents);
	updateInventory(data.moveEvents[connectionNum].inventory.inventory);
	
	updateCurrentFogTimeColor();
	
	var chunkSize = chunkProperties[0][0].CHUNK_SIZE;
	//worldPlane (invisible) is for player to click to move to without having to factor in different chunk planes being loaded
	//spans entire clickable world
	var worldPlaneX = (MAP_WIDTH * chunkSize) / 2;
	var worldPlaneY = (MAP_HEIGHT * chunkSize) / 2;
	worldPlane = new invisiblePlane(MAP_WIDTH*chunkSize,MAP_HEIGHT*chunkSize,worldPlaneX,worldPlaneY);
	scene.add(worldPlane.entity);
	
	//issue right here...
	loadCurrentChunks(data.moveEvents[connectionNum].moveObj.currentChunk);

	itemProperties = data.itemProperties;
	
	//wait to add objects, npcs, & items, otherwise it won't be able to find the correct z coordinate for them
	setTimeout(function(){
		updateDroppedItems(data.itemArray, new Date().getTime());
		transferNPCData(data.npcArray);
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
	
	//create minimap
	map = new minimap();

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
				materials[k].side = THREE.DoubleSide;
			}
			for(var animIndex in skinnedMesh.geometry.animations){
				//change the anim name to animname-<modeltype> , example: "walk-dog", or "shoot-man"
				var anim = skinnedMesh.geometry.animations[animIndex];
				anim.name += "-" + str;
				THREE.AnimationHandler.add(anim);
			}
			skinnedMesh.geometry.animation = skinnedMesh.geometry.animations[0];
			console.log(skinnedMesh);
			z++;
			if(z == objs.length){
				//models are done loading
				modelsLoaded = true;
			}
		});
	});
}

function toggleSignup(open){
	if(open){
		$(".loginContainer").slideUp();
		$(".demoContainer").slideUp();
		$("#signupForm").show();
		$(".signupDiv").slideDown();
	}else{
		$(".loginContainer").slideDown();
		$(".demoContainer").slideDown();
		$(".signupDiv").slideUp();
	}
}

function signup(temporary){
	if(!socket.socket.connected){
		//first retry the connection
		reconnectSocket();
		//tell them server is offline right now
		$("#signupError").html("Unable to connect to server. Try again in a few minutes.");
		$("#signupError").css("visibility", "visible");
	}
	
	if(temporary){
		//see if they already have temporary credentials stored
		var credentials = getTempAccount();
		if(credentials != undefined){
			$("#username").val(credentials.username);
			$("#password").val(credentials.password);
			$("#loginButton").click();
			return;
		}
		//otherwise continue to create a new temporary account
	}
	
	var username = $("#desiredUsername").val();
	var password = $("#desiredPassword").val();
	var confirmPassword = $("#confirmPassword").val();
	var email = $("#email").val();
	
	var data = {};
	data.username = username;
	data.password = password;
	data.confirmPassword = confirmPassword;
	data.email = email;
	data.temporary = temporary;
	
	if($("#useTemporary").is(":checked")){
		//they are trying to sign up their temporary account
		var credentials = getTempAccount();
		if(credentials != undefined){
			data.previousUsername = credentials.username;
			data.previousPassword = credentials.password;
		}
	}
	
	socket.emit("SignupEvent", data);
}

function getTempAccount(){
	//returns undefined if there is no temp account
	var hasCredentials = localStorage.getItem("tempAccount");
	if(hasCredentials){
		var credentials = {
			username: localStorage.getItem("tempUsername"),
			password: localStorage.getItem("tempPassword")
		};
		return credentials;
	}else{
		return undefined;
	}
}
