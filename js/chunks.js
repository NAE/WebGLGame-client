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
	
	var spaceBetweenVertex = chunkSize / chunkSplits;
	//find out where in the chunk the position is
	var chunkOffsetX = chunk.chunkX * chunkSize;
	var chunkOffsetY = chunk.chunkY * chunkSize;
	
	//find the difference between the position and the chunkOffsets
	var innerChunkX = position.x - chunkOffsetX;
	var innerChunkY = position.y - chunkOffsetY;
	
	//now get the closest vertex to that point in the chunk
	//0 -> chunkSplits will keep the same y, but go down in x
	//then for each next 50, subtract 1 spaceBetweenVertex from y and continue
	var totalLength = (chunkSplits + 1) * (chunkSplits + 1) - 1;
	var xDivision = innerChunkX / spaceBetweenVertex + 1;
	var yDivision = totalLength - (innerChunkY / spaceBetweenVertex * (chunkSplits + 2));
	var index0 = Math.floor(xDivision) + Math.floor(yDivision);
	var index1 = Math.ceil(xDivision) + Math.floor(yDivision);
	var index2 = Math.floor(xDivision) + Math.ceil(yDivision);
	var index3 = Math.ceil(xDivision) + Math.ceil(yDivision);
	
	var verts = chunkPlane.entity.geometry.vertices;
	var z0 = verts[index0].z;
	var z1 = verts[index1].z;
	var z2 = verts[index2].z;
	var z3 = verts[index3].z;
	
	
	var avg = (z0 + z1 + z2 + z3) / 4;
	return avg;
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
