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

		//first see if ray intersects any characters - OLD
		/*var intersectsChars = ray.intersectObjects(otherCharEntityList);
		if(intersectsChars.length > 0){
			//we only want the top one
			var characterHit = intersectsChars[0].object;
			var charNum = characterHit.connectionNum; //pulling from character.entity
			addParticleMoveEvent(characterHit);
			return;
		}*/
		
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
		
		var objectHit = raycaster.intersectObjects(cleanMapObjectsEntityArray, true);
		
		if(objectHit.length > 0){
			//object hit takes priority over moving
			var firstHitObj = objectHit[0].object;
			//keep checking the parent until we get one with correspondingObject (some things that are hit will be groups of faces, not the object itself)
			while(!firstHitObj.hasOwnProperty("correspondingObject")){
				firstHitObj = firstHitObj.parent;
			}
			
			if(whichClick == 1){
				//execute its first 
				interactWithClickedObject(firstHitObj, 0);
			}else{
				//create a contextmenu with the available events for this type of mapobject
				var menuPosition = {x:event.clientX,y:event.clientY};
				createObjectContextMenu(menuPosition, firstHitObj.correspondingObject.id);
			}
		}else if (intersects.length > 0) {
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

var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
	THREE.Object3D._matrixAux = new THREE.Matrix4();
	THREE.Object3D._matrixAux.makeRotationAxis(axis, radians);
    this.matrix.multiplyMatrices(THREE.Object3D._matrixAux,this.matrix); // r56
    THREE.Object3D._matrixAux.extractRotation(this.matrix);
    this.rotation.setEulerFromRotationMatrix(THREE.Object3D._matrixAux, this.eulerOrder ); 
    this.position.getPositionFromMatrix( this.matrix );
	/*
	rotWorldMatrix = new THREE.Matrix4();
	rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
	rotWorldMatrix.multiplySelf(object.matrix);        // pre-multiply
	object.matrix = rotWorldMatrix;

	// new code for Three.js v50+
	object.rotation.setEulerFromRotationMatrix(object.matrix);
*/
	// old code for Three.js v49:
	// object.rotation.getRotationFromMatrix(object.matrix, object.scale);
}

THREE.Object3D._matrixAux = new THREE.Matrix4(); // global auxiliar variable
// Warnings: 1) axis is assumed to be normalized. 
//  2) matrix must be updated. If not, call object.updateMatrix() first  
//  3) this assumes we are not using quaternions
THREE.Object3D.prototype.rotateAroundWorldAxis = function(axis, radians) { 
    THREE.Object3D._matrixAux.makeRotationAxis(axis, radians);
    this.matrix.multiplyMatrices(THREE.Object3D._matrixAux,this.matrix); // r56
    THREE.Object3D._matrixAux.extractRotation(this.matrix);
    this.rotation.setEulerFromRotationMatrix(THREE.Object3D._matrixAux, this.eulerOrder ); 
    this.position.getPositionFromMatrix( this.matrix );
}

function toScreenXY (objectPosition){
	var clonedPosition = {x:objectPosition.x, y:objectPosition.y, z:objectPosition.z};
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

Array.min = function( array ){
    return Math.min.apply( Math, array );
};
