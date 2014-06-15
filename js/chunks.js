function getChunkNums(chunkId){
	if(!isValidChunkId(chunkId)){
		return undefined;
	}
	//returns the vertical and horizontal numbers for this chunkId
	var chunkNums = { chunkX: 0, chunkY: 0 };
	chunkNums.chunkY = Math.floor(chunkId / MAP_HEIGHT);
	chunkNums.chunkX = chunkId % MAP_WIDTH;
	return chunkNums;
}

function getChunk(chunkId){
	//gets the chunk with a specific id
	if(!isValidChunkId(chunkId)){
		return undefined;
	}
	var chunkNums = getChunkNums(chunkId);
	if(chunkNums == undefined){
		return undefined;
	}
	var newChunk = chunkProperties[chunkNums.chunkY][chunkNums.chunkX];
	return newChunk;
}

function getChunkId(chunkX, chunkY){
	return (chunkY * MAP_WIDTH) + (chunkX);
}

function getChunkIdFromPosition(position){
	var chunkSize = chunkProperties[0][0].CHUNK_SIZE;
	var chunkX = parseInt(Math.floor(position.x / chunkSize));
	var chunkY = parseInt(Math.floor(position.y / chunkSize));
	return getChunkId(chunkX, chunkY);
}

function isValidChunkId(chunkId){
	//returns true if the given chunkId is a valid chunkId,
	//false if not
	if(chunkId >= 0 && chunkId < MAP_HEIGHT * MAP_WIDTH){
		return true;
	}else{
		return false;
	}
}

function getZFromPosition(position){
	//THIS FAILS A LOT RIGHT AT CHUNK BOUNDARIES. FIX. TODO.
	var chunkSize = chunkProperties[0][0].CHUNK_SIZE;
	var chunkId = getChunkIdFromPosition(position);
	if(!isValidChunkId(chunkId)){
		//return z of 0
		return 0;
	}
	var chunk = getChunk(chunkId);
	var chunkPlane = currentlyLoadedChunks[chunkId];
	if(chunkPlane == undefined){
		//chunk isn't loaded so there is no vertex to return, return z of 0
		return 0;
	}
	
	if(position.x % chunkSize == 0){
		//chunk boundary at x
		
	}
	
	var raycaster = new THREE.Raycaster();
	raycaster.ray.origin.z = 10000;
	raycaster.ray.direction = new THREE.Vector3( 0, 0, -1);

	raycaster.ray.origin.x = position.x;
	raycaster.ray.origin.y = position.y;
	
	var intersects = raycaster.intersectObject( chunkPlane.entity );
	
	if(intersects.length > 0){
		return intersects[0].point.z;
	}else{
		console.log('err');
		return 0;
	}
}

function loadCurrentChunks(chunkId){
	var thisChunkNums = getChunkNums(chunkId);
	var parentChunk = chunkProperties[thisChunkNums.chunkY][thisChunkNums.chunkX];
	var adjacentChunks = parentChunk.adjacentChunks;
	//load all its adjacent chunks (including self)
	for(var i=0;i<adjacentChunks.length;i++){
		//only add it to the scene if it already isn't there
		if(currentlyLoadedChunks[adjacentChunks[i]] == undefined){
			var chunkNums = getChunkNums(adjacentChunks[i]);
			var thisChunk = chunkProperties[chunkNums.chunkY][chunkNums.chunkX];
			var planePosX = thisChunk.position.x + (thisChunk.CHUNK_SIZE/2);
			var planePosY = thisChunk.position.y + (thisChunk.CHUNK_SIZE/2);
			//first check if we have already made this chunk in the past
			var previouslyLoadedChunk = previouslyLoadedChunks[adjacentChunks[i]];
			var thisPlane;
			if(previouslyLoadedChunk != undefined){
				//load the chunk we have previously loaded
				thisPlane = previouslyLoadedChunk;
				previouslyLoadedChunks[adjacentChunks[i]] = undefined;
			}else{
				//create a new chunk
				thisPlane = new groundPlane(thisChunk.CHUNK_SIZE,thisChunk.CHUNK_SIZE,planePosX,planePosY,'img/regularGround.jpg',true);
			}
			scene.add(thisPlane.entity);
			//we really don't need to remove old planes, I think it would take more proecessing power than to just leave them there
			//set this chunk as having been loaded so that we don't load it again
			currentlyLoadedChunks[adjacentChunks[i]] = thisPlane;
		}
	}
}
