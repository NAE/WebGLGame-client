function getChunkNums(chunkId){
	//returns the vertical and horizontal numbers for this chunkId
	var chunkNums = { chunkX: 0, chunkY: 0 };
	chunkNums.chunkY = Math.floor(chunkId / MAP_HEIGHT);
	chunkNums.chunkX = chunkId % MAP_WIDTH;
	return chunkNums;
}

function getChunk(chunkId){
	//gets the chunk with a specific id
	var chunkNums = getChunkNums(chunkId);
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

function getZFromPosition(position){
	var chunkSize = chunkProperties[0][0].CHUNK_SIZE;
	var chunkId = getChunkIdFromPosition(position);
	var chunk = getChunk(chunkId);
	var chunkPlane = currentlyLoadedChunks[chunkId];
	if(chunkPlane == undefined){
		//chunk isn't loaded so there is no vertex to return
		return undefined;
	}
	
	var ray = new THREE.Ray();
	ray.origin.z = 10000;
	ray.direction = new THREE.Vector3( 0, 0, -1);

	ray.origin.x = position.x;
	ray.origin.y = position.y;
	
	var intersects = ray.intersectObject( chunkPlane.entity );
	
	if(intersects.length > 0){
		return intersects[0].point.z;
	}else{
		console.log(position);
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
			var thisPlane = new groundPlane(thisChunk.CHUNK_SIZE,thisChunk.CHUNK_SIZE,planePosX,planePosY,'img/regularGround.jpg',true);
			scene.add(thisPlane.entity);
			//we really don't need to remove old planes, I think it would take more proecessing power than to just leave them there
			//set this chunk as having been loaded so that we don't load it again
			currentlyLoadedChunks[adjacentChunks[i]] = thisPlane;
		}
	}
}
