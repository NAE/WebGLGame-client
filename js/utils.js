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

		var ray = new THREE.Ray( worldCamera.entity.position,vector.subSelf( worldCamera.entity.position ).normalize() );

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
		var intersects = ray.intersectObject(worldPlane.entity);
		//check if it intersects any items on the ground
		var itemHit = ray.intersectObjects(itemEntityArray);
		var objectHit = ray.intersectObjects(mapObjectsEntityArray);
		
		if(objectHit.length > 0){
			//object hit takes priority over moving
			console.log(objectHit);
		}else if ( intersects.length > 0 ) {
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
	rotWorldMatrix = new THREE.Matrix4();
	rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
	rotWorldMatrix.multiplySelf(object.matrix);        // pre-multiply
	object.matrix = rotWorldMatrix;

	// new code for Three.js v50+
	object.rotation.setEulerFromRotationMatrix(object.matrix);

	// old code for Three.js v49:
	// object.rotation.getRotationFromMatrix(object.matrix, object.scale);
}

function toScreenXY (objectPosition){
	var widthHalf = window.innerWidth / 2;
	var heightHalf = window.innerHeight / 2;

	var projector = new THREE.Projector();
	var vector = projector.projectVector(objectPosition, worldCamera.entity);

	vector.x = (vector.x * widthHalf) + widthHalf;
	vector.y = - (vector.y * heightHalf) + heightHalf;
	return { x: vector.x, y: vector.y };
}
