function addObjects(objectArray){
	for(var i=0;i<objectArray.length;i++){
		var thisObject = objectArray[i];
		var posX = thisObject.position.x;
		var posY = thisObject.position.y;
		var rot = thisObject.rotation;
		var objectType = thisObject.type;
		thisObjProperty = objectProperties[objectType];
		var typeName = thisObjProperty.name;
		//make a new object on the map of type typeName
		var newMapObj = new window[typeName](posX,posY,rot);
		newMapObj.id = thisObject.id;
		newMapObj.entity.type = objectType;
		newMapObj.entity.correspondingObject = newMapObj;
		newMapObj.entity.position.z += getZFromPosition(newMapObj.entity.position);
		scene.add(newMapObj.entity);
		mapObjectsArray[thisObject.id] = newMapObj;
		mapObjectsEntityArray[thisObject.id] = newMapObj.entity;
	}
}

function removeObjects(objectIdArray){
	for(var i=0;i<objectIdArray.length;i++){
		var thisObjectId = objectIdArray[i];
		var thisObject = mapObjectsArray[thisObjectId];
		mapObjectsArray[thisObjectId] = undefined;
		
		var thisObjEntity = mapObjectsEntityArray[thisObjectId];
		mapObjectsEntityArray[thisObjectId] = undefined;
		
		if(thisObjEntity != undefined){
			scene.remove(thisObjEntity);
		}
	}
}

function placeMapObject(x, y, z, rotationCoefficient, type){
	var sendData = {x: x, y: y, z: z, rotationCoefficient: rotationCoefficient, type: type};
	socket.emit('MapObjectPlaceEvent', sendData);
}

function interactWithClickedObject(mapEntity, option){
	//option is the index in the MapObjectProperty to execute
	if(option == undefined){
		option = 0; //execute its first option if none specified
	}
	//first remove the moveCursor
	if(moveCursor != undefined && moveCursor.entity != undefined){
		scene.remove(moveCursor.entity);
	}
	
	var eventType;
	if(option != -1){
		eventType = objectProperties[mapEntity.type].eventTypes[option];
	}else{
		//-1 constititues a REMOVE
		eventType = "REMOVE";
	}
	
	//mapEntity is entity, not the object
	var mapObject = mapEntity.correspondingObject;
	var objId = mapObject.id;
	var eventTypeInt = mapObjectEventTypes[eventType];
	socket.emit("InteractEvent", {objectHitNum: objId, eventType: eventTypeInt});
}

//map objects
var rectangle = function(posX,posY,posZ,length,width,height,color){
	var materialBox = new THREE.MeshLambertMaterial({
		ambient: color
	});
	
	this.entity = new THREE.Mesh(new THREE.CubeGeometry(length, width, height, 1, 1, 1, materialBox), new THREE.MeshFaceMaterial());
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	this.entity.position.z = posZ;
	this.entity.reversing = false;
	this.entity.castShadow = true;
}

var crate = function(posX,posY,rot,size){
	size = size || 20;
	var materialBox = new THREE.MeshLambertMaterial({
		map: THREE.ImageUtils.loadTexture('img/crate.jpg'),
		ambient: 0x2A120A
	});
	
	this.entity = new THREE.Mesh(new THREE.CubeGeometry(size, size, size, 1, 1, 1, materialBox), new THREE.MeshFaceMaterial());
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	this.entity.position.z = 10;
	
	this.entity.rotation.z = rot;
}

var tree = function(posX,posY,rot,baseColor,topColor,treeBaseHeight){
	//used by tree types, not to be used directly
	this.treeTopGeometry = new THREE.CylinderGeometry(0, .4*treeBaseHeight, .8*treeBaseHeight, 4, 1);
	this.treeTopMaterial =  new THREE.MeshLambertMaterial({ ambient: topColor, shading: THREE.FlatShading });
	this.treeTopEntity = new THREE.Mesh(this.treeTopGeometry,this.treeTopMaterial);
	this.treeTrunkGeometry = new THREE.CylinderGeometry(10,10,treeBaseHeight,4,1);
	this.treeTrunkMaterial = new THREE.MeshLambertMaterial({ ambient: baseColor, shading: THREE.FlatShading });
	this.treeTrunkEntity = new THREE.Mesh(this.treeTrunkGeometry,this.treeTrunkMaterial);
	
	this.entity = new THREE.Object3D();
	//need to rotate the materials in this trees, but then allow for external rotation without weird stuff.
	this.rotFixEntity = new THREE.Object3D();
	this.rotFixEntity.add(this.treeTrunkEntity);
	this.rotFixEntity.add(this.treeTopEntity);
	this.entity.add(this.rotFixEntity);
	
	this.treeTrunkEntity.position.y = treeBaseHeight/2;
	this.treeTopEntity.position.y = treeBaseHeight;
	
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	this.rotFixEntity.rotation.x += Math.PI/2;
	this.entity.rotation.z = rot;
}

var normalTree = function(posX,posY,rot){
	return new tree(posX,posY,rot,0x3B170B,0x0B3B0B,100);
}

var darkTree = function(posX,posY,rot){
	return new tree(posX,posY,rot,0x2A1B0A,0x071907,100);
}

var flatPlane = function(posX,posY,posZ,width,height,rotX,rotY,rotZ,color,imgPath){
	var geom = new THREE.Geometry(); 
	var v1 = new THREE.Vector3(0,0,0);
	var v2 = new THREE.Vector3(0,width,0);
	var v3 = new THREE.Vector3(0,width,height);
	var v4 = new THREE.Vector3(0,0,height);

	geom.vertices.push(v1);
	geom.vertices.push(v2);
	geom.vertices.push(v3);
	geom.vertices.push(v4);

	geom.faces.push( new THREE.Face4( 0, 1, 2, 3 ) );
	
	//required for textures
	geom.faceVertexUvs[ 0 ].push( [
		new THREE.UV(0,0),
		new THREE.UV(0,1),
		new THREE.UV(1,1),
		new THREE.UV(1,0)
	] );
	
	//need for lighting
	geom.computeCentroids();
	geom.computeFaceNormals();
	geom.computeVertexNormals();
	
	this.material = new THREE.MeshLambertMaterial({
		side: THREE.DoubleSide,
		shading: THREE.FlatShading,
		map: THREE.ImageUtils.loadTexture(imgPath)
	});
	
	this.entity = new THREE.Mesh(geom, this.material);
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	this.entity.position.z = posZ;
	this.entity.rotation.x = rotX;
	this.entity.rotation.y = rotY;
	this.entity.rotation.z = rotZ;
}

var triangle = function(posX,posY,posZ,width,height,rotX,rotY,rotZ,color,imgPath){
	var geom = new THREE.Geometry(); 
	var v1 = new THREE.Vector3(0,0,0);
	var v2 = new THREE.Vector3(0,width/2,height);
	var v3 = new THREE.Vector3(0,width,0);

	geom.vertices.push(v1);
	geom.vertices.push(v2);
	geom.vertices.push(v3);

	geom.faces.push( new THREE.Face3( 0, 1, 2 ) );
	
	//required for textures
	geom.faceVertexUvs[ 0 ].push( [
		new THREE.UV(0,0),
		new THREE.UV(0,1),
		new THREE.UV(1,1),
		new THREE.UV(1,0)
	] );
	
	//need for lighting
	geom.computeCentroids();
	geom.computeFaceNormals();
	geom.computeVertexNormals();

	this.material = new THREE.MeshLambertMaterial({
		side: THREE.DoubleSide,
		shading: THREE.FlatShading,
		map: THREE.ImageUtils.loadTexture(imgPath)
	});
	
	this.entity = new THREE.Mesh(geom, this.material);
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	this.entity.position.z = posZ;
	this.entity.rotation.x = rotX;
	this.entity.rotation.y = rotY;
	this.entity.rotation.z = rotZ;
}

var hut = function(posX,posY,rot){
	var size = 70;
	var SR = 2/3; //size ratio of height of walls to width of walls
	this.entity = new THREE.Object3D();
	this.northFace = new flatPlane(size/2,size/2,0,size,size*SR,0,0,Math.PI/2,0x61210B,"img/textures/cottageDoor1.jpg");
	this.southFace = new flatPlane(size/2,-size/2,0,size,size*SR,0,0,Math.PI/2,0x61210B,"img/textures/cottageWall1.jpg");
	this.eastFace = new flatPlane(-size/2,-size/2,0,size,size*SR,0,0,0,0x61210B,"img/textures/cottageWall1.jpg");
	this.westFace = new flatPlane(size/2,-size/2,0,size,size*SR,0,0,0,0x61210B,"img/textures/cottageWall1.jpg");
	
	this.northTriangleFace = new triangle(size/2,size/2,size*SR,size,size*(2/3),0,0,Math.PI/2,0x61210B,"img/textures/triangle1.jpg");
	this.southTriangleFace = new triangle(size/2,-size/2,size*SR,size,size*(2/3),0,0,Math.PI/2,0x61210B,"img/textures/triangle1.jpg");
	
	var roofHeight = Math.sqrt(Math.pow(size/2,2) + Math.pow(size*SR,2));
	var roofAngle = Math.PI/2 - Math.asin(size*SR/roofHeight);
	this.eastRoof = new flatPlane(size/2,-size/2*1.2,size*SR,size*1.2,roofHeight,0,-roofAngle,0,0x190707,"img/textures/roof1.jpg");
	this.westRoof = new flatPlane(-size/2,-size/2*1.2,size*SR,size*1.2,roofHeight,0,roofAngle,0,0x190707,"img/textures/roof1.jpg");
	
	this.entity.add(this.northFace.entity);
	this.entity.add(this.southFace.entity);
	this.entity.add(this.eastFace.entity);
	this.entity.add(this.westFace.entity);
	this.entity.add(this.northTriangleFace.entity);
	this.entity.add(this.southTriangleFace.entity);
	this.entity.add(this.eastRoof.entity);
	this.entity.add(this.westRoof.entity);
	
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	this.entity.rotation.z = rot;
}

var path = function(posX,posY,rot,imgPath){
	//used by path types, not directly
	this.texture = THREE.ImageUtils.loadTexture(imgPath);
	this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping;
	this.texture.repeat.set(1,1);
	this.material = new THREE.MeshLambertMaterial({
		map: this.texture,
		ambient: 0x3C2F2F
	});
	
	this.entity = new THREE.Mesh(new THREE.PlaneGeometry(50,50),this.material);
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	this.entity.position.z = 1;
	this.entity.rotation.z = rot;	
}

var cobblePath = function(posX,posY,rot){
	return new path(posX,posY,rot,"img/textures/cobblePath2.jpg");
}

var groundPlane = function(width,height,posX,posY,pathToTexture){
	var texture = THREE.ImageUtils.loadTexture(pathToTexture);
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	//normal is 375
	texture.repeat.set(width/300, height/300);

	var materialPlane = new THREE.MeshLambertMaterial({
		map: texture,
		ambient: 0x6CAFE3
	});
	
	var geometry = new THREE.PlaneGeometry(width, height, chunkSplits, chunkSplits);
	
	var verts = geometry.vertices;
	var minPoint = width / 2 * -1;
	var maxPoint = width / 2;
	
	var chunkSize = chunkProperties[0][0].CHUNK_SIZE;
	
	//first choose where the peaks are going to be in the chunk
	//setting the seed will keep this map the same all the time
	Math.seed = getChunkIdFromPosition({x:posX, y:posY});
	var numPeaks = Math.floor(Math.seededRandom(1, maxPeaks));
	var peaks = [];
	for(var i=0;i<numPeaks;i++){
		//choose a peak height and location
		var peakHeight = Math.seededRandom(minPeakHeight, maxPeakHeight);
		//choose a random coordinate between chunk coords
		var randomX = Math.seededRandom(minPoint, maxPoint);
		var randomY = Math.seededRandom(minPoint, maxPoint);
		var peakObj = {x:randomX, y:randomY, z:peakHeight};
		peaks[i] = peakObj;
	}
	
	for(var i=0;i<verts.length;i++){
		//prevent the edges of the chunks from being elevated.
		var vert = verts[i];
		if(vert.x == minPoint || vert.x == maxPoint){
			continue;
		}
		if(vert.y == minPoint || vert.y == maxPoint){
			continue;
		}
		
		//calculate distances to all the peaks
		var distancesToPeaks = [];
		var nearestDistance;
		var heightOfNearestPeak;
		
		for(var n=0;n<peaks.length;n++){
			var thisPeak = peaks[n];
			var peakPosX = thisPeak.x;
			var peakPosY = thisPeak.y;
			var peakPosZ = thisPeak.z;
			//use distance formula to calculate distance between these points
			var dist = Math.sqrt(Math.pow((peakPosX - vert.x),2) + Math.pow((peakPosY - vert.y),2));
			distancesToPeaks[n] = dist;
		}
		
		
		var smallestDist = Array.min(distancesToPeaks);
		var heightOfNearestPeak = peaks[distancesToPeaks.indexOf(smallestDist)].z;
		
		vert.z = heightOfNearestPeak - (peakSlope * smallestDist);
		if(vert.z < minPeakHeight){
			vert.z = minPeakHeight;
		}
	}
	
	//color vertices (darker for lower, lighter for higher)
	THREE.GeometryUtils.triangulateQuads( geometry );
	var faceIndices = ['a','b','c','d'];
	for(var i=0;i<geometry.faces.length;i++){
		var f = geometry.faces[i];
		var n = ( f instanceof THREE.Face3 ) ? 3 : 4;
		for(var j=0;j<n;j++){
			var vertexIndex = f[ faceIndices[ j ] ];
			var p = geometry.vertices[ vertexIndex ];
			//based on p's z value, give it a different color
			color = new THREE.Color( 0xffffff );
			//possibly change the colors based on how far north it is?
			var red = .6;
			var green = .6;
			var blue = 0;
			
			var z = p.z;
			var zAboveZero = z + zVariation;
			var increaseAmount = (zAboveZero + .01) / (zVariation * 2);
			red += increaseAmount;
			green += increaseAmount;
			blue += increaseAmount;
			//color.setRGB(Math.random(),Math.random(),Math.random());
			color.setRGB(red,green,blue);
			
			f.vertexColors[ j ] = color;
		}
	}
	var planeMaterial = new THREE.MeshBasicMaterial( 
    { ambient: 0x6CAFE3, shading: THREE.SmoothShading, 
    vertexColors: THREE.VertexColors, map: texture } );
	geometry.materials.push(planeMaterial);
	for( var i in geometry.faces ) {
		var face = geometry.faces[i];
		face.materialIndex = i%geometry.materials.length;
	}
	
	//for vertices/heightmap, add more params to three.planegeometry
	var material = new THREE.MeshFaceMaterial();
	this.entity = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([material]));
	this.entity.geometry.needsUpdate = true;
	this.entity.overdraw = true;
	this.entity.receiveShadow = true;
	this.entity.position.x = posX;
	this.entity.position.y = posY;
	
}

var invisiblePlane = function(width,height,posX,posY){
	var materialPlane = new THREE.MeshLambertMaterial({
		visible: false
	});
	this.entity = new THREE.Mesh(new THREE.PlaneGeometry(width, height), materialPlane);
	this.entity.position.x = posX;
	this.entity.position.y = posY;
}
