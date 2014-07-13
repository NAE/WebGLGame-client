function onDocumentMouseDown( event ) {
	var target = event.target || event.srcElement;
	//event.which - 1:left click, 3:right click
	var whichClick = event.which;
	if(target.id == ""){
		removeContextMenu();
		//converts 2d screen coordinates to the coordinates on the actual map
		event.preventDefault();

		var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
		var projector = new THREE.Projector();
		projector.unprojectVector(vector,worldCamera.entity);

		var raycaster = new THREE.Raycaster( worldCamera.entity.position,vector.sub( worldCamera.entity.position ).normalize() );
		
		//see if the ray intersects the ground if it did not intersect any characters
		var intersects = raycaster.intersectObject(worldPlane.entity);
		//check if it intersects any items on the ground
		var itemHit = raycaster.intersectObjects(itemEntityArray);
		
		//to find intersections of objects, it's possible there will be 'undefined's inside mapObjectsEntityArray
		//due to the way that objects are loaded into the map. i.e. if objects with ids 0 and 4 are the only ones that are loaded, there
		//will be 3 undefineds in between those, and this recursive intersectObjects can't handle that.
		//first, make a new array from mapObjectsEntityArray without the undefineds.
		var cleanMapObjectsEntityArray = [];
		for(var i=0;i<mapObjectsEntityArray.length;i++){
			var thisEntity = mapObjectsEntityArray[i];
			if(thisEntity != undefined){
				cleanMapObjectsEntityArray.push(thisEntity);
			}
		}
		
		//find intersections on players for right click menu purposes (clean first)
		var cleanPlayerEntityArray = [];
		for(var i=0;i<otherCharEntityList.length;i++){
			var thisEntity = otherCharEntityList[i];
			if(thisEntity != undefined){
				cleanPlayerEntityArray.push(thisEntity);
			}
		}
		
		var objectHit = raycaster.intersectObjects(cleanMapObjectsEntityArray, true);
		var playerHit = raycaster.intersectObjects(cleanPlayerEntityArray, true);
		
		var stillDoMove = false;
		if(objectHit.length > 0){
			//object hit takes priority over moving
			var firstHitObj = objectHit[0].object;
			//keep checking the parent until we get one with correspondingObject (some things that are hit will be groups of faces, not the object itself)
			while(!firstHitObj.hasOwnProperty("correspondingObject")){
				firstHitObj = firstHitObj.parent;
			}
			
			var isSolid = objectProperties[firstHitObj.type].solid;
			if(whichClick == 1){
				//execute its first, if it's solid
				if(isSolid){
					interactWithClickedObject(firstHitObj, 0);
				}else{
					//move on top of the solid object
					stillDoMove = true;
				}
			}else{
				//create a contextmenu with the available events for this type of mapobject
				var menuPosition = {x:event.clientX,y:event.clientY};
				createObjectContextMenu(menuPosition, firstHitObj.correspondingObject.id);
			}
		}else{
			stillDoMove = true;
		}
		
		if (intersects.length > 0 && stillDoMove) {
			//set global states for character movement
			if(whichClick == 1){
				//left click, so move character
				addCharacterMoveEvent(intersects[0],itemHit[0]);	
				return;
			}else if(whichClick == 3){
				if(!holdingCtrl){
					//right click, so add a particle movement to that spot
					addParticleMoveEvent(intersects[0]);
					return;
				}else{
					//ctrl was held down and right click performed, so open a context menu
					var menuPosition = {x:event.clientX,y:event.clientY};
					createContextMenu(menuPosition, undefined, intersects[0].point);
				}
			}
		}
	}else{
		event.preventDefault();
		document.getElementById("message").focus();
		if(target.id == "contextMenu"){
			//context menu was left clicked
			if(whichClick != 3){
				removeContextMenu();
			}
		}else if(whichClick == 3){
			createContextMenu({x:event.clientX,y:event.clientY},target);
		}else{
			removeContextMenu();
		}
	}
}

THREE.Object3D._matrixAux = new THREE.Matrix4(); // global auxiliar variable
// Warnings: 1) axis is assumed to be normalized. 
//  2) matrix must be updated. If not, call object.updateMatrix() first  
//  3) this assumes we are not using quaternions
THREE.Object3D.prototype.rotateAroundWorldAxis = function(axis, radians) { 
    THREE.Object3D._matrixAux.makeRotationAxis(axis, radians);
    this.matrix.multiplyMatrices(THREE.Object3D._matrixAux,this.matrix); // r56
    THREE.Object3D._matrixAux.extractRotation(this.matrix);
    this.rotation.setFromRotationMatrix(THREE.Object3D._matrixAux, this.rotation.order ); 
    this.position.setFromMatrixPosition( this.matrix );
}

function toScreenXY (objectPosition){
	var clonedPosition = new THREE.Vector3(objectPosition.x, objectPosition.y, objectPosition.z);
	var widthHalf = window.innerWidth / 2;
	var heightHalf = window.innerHeight / 2;

	var projector = new THREE.Projector();
	var vector = projector.projectVector(clonedPosition, worldCamera.entity);

	vector.x = (vector.x * widthHalf) + widthHalf;
	vector.y = - (vector.y * heightHalf) + heightHalf;
	return { x: vector.x, y: vector.y };
}

function getDist(position1, position2){
	//calculate and return distance between these 2 given positions (z not factored in)
	var distX = Math.abs(position1.x - position2.x);
	var distY = Math.abs(position1.y - position2.y);
	var dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
	return dist;
}

function getSkinIndex(colladascene){
	//returns the index of the child of colladascene that is an instance of SkinnedMesh, else returns -1
	var children = colladascene.children;
	if(children == undefined || children.length == 0){
		return -1;
	}
	for(var i=0;i<children.length;i++){
		if(children[i] instanceof THREE.SkinnedMesh){
			return i;
		}
	}
}

Array.min = function( array ){
    return Math.min.apply( Math, array );
};

Array.clone = function(obj){
	if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for ( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for ( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
};
