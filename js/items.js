function updateDroppedItems(items,timeNow){
	for(var i=0;i<items.length;i++){
		var itemId = items[i].id;
		if(itemArray[itemId] == undefined || items[i].creationTime > lastItemUpdate){
			//if there is no logged spot in itemArray or if it is a newly created item
			itemArray[itemId] = new item(items[i].type,items[i].position,itemId,items[i].chunkId);
			itemArray[itemId].entity.num = itemId;
			itemEntityArray[itemId] = itemArray[itemId].entity;
			//add to chunk list of items
			var thisChunk = getChunk(items[i].chunkId);
			thisChunk.items.push(itemId);
			scene.add(itemArray[itemId].entity);	
		}else if(itemArray[itemId] != undefined){
			scene.remove(itemArray[itemId].entity);
			//remove it from the chunk
			var chunkId = itemArray[itemId].chunkId;
			var thisChunk = getChunk(chunkId);
			var indexOfItem = thisChunk.items.indexOf(itemId);
			if(indexOfItem >= 0){
				thisChunk.items.splice(indexOfItem,1);
			}
			itemArray[itemId] = undefined;
			itemEntityArray[itemId] = undefined;
		}
	}
	//everything after the length of items in itemArray can be deleted
	/*for(var i=items.length;i<itemArray.length;i++){
		if(itemArray[i] != undefined){
			//if there is an item here, remove it from the scene and get rid of it
			scene.remove(itemArray[i].entity);
			itemArray[i] = undefined;
			itemEntityArray[i] = undefined;
		}
	}*/
	//update the last time items were updated variable
	lastItemUpdate = timeNow;
}

var item = function(type,position,id,chunkId){
	this.type = type;
	this.position = position;
	this.id = id;
	this.chunkId = chunkId;
	this.material = new THREE.MeshLambertMaterial({
		map: THREE.ImageUtils.loadTexture(itemProperties[type].img),
		transparent: true
	});
	
	this.entity = new THREE.Mesh(new THREE.PlaneGeometry(itemProperties[type].imgSize,itemProperties[type].imgSize),this.material);
	this.entity.position.x = this.position.x;
	this.entity.position.y = this.position.y;
	this.entity.position.z = 2;
	this.entity.position.z += getZFromPosition(position);
}
