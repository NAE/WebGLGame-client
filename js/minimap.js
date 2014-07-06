var minimap = function(){
	//defines rendering of a minimap
	//dont do anything in the first executed stuff here that relates to info from the server,
	//as it won't have it when this loads at first
	var chunkSize = chunkProperties[0][0].CHUNK_SIZE;
	this.minimapWidth = 200;
	this.minimapHeight = 200;
	
	var viewRatio = 25;
	
	var itemColor = "red";
	var playerColor = "white";
	var npcColor = "yellow";
	var mapObjectColor = "#563115";
	var treeColor = "green";
	
	this.canvas = document.getElementById("minimapCanvas");
	this.context = this.canvas.getContext('2d');
	var ctx = this.context;
	
	this.canvas.width = this.minimapWidth;
	this.canvas.height = this.minimapHeight;

	var centerX = this.minimapWidth / 2;
	var centerY = this.minimapHeight / 2;
	var circleRadius = 2;
	var camPointerLength = 20;
	
	this.getWorldPosition = function(minimapPos){
		return {x: minimapPos.x * viewRatio + this.translateX, y: minimapPos.y * viewRatio + this.translateX};
	}
	
	function correctPosition(pos){
		var newY = chunkProperties[0][0].CHUNK_SIZE * MAP_HEIGHT - pos.y;
		return {x: pos.x / viewRatio, y: newY / viewRatio};
	}
	
	function drawCircle(position, color, ye){
		//first flip the y coordinate around its axis, as canvas coordinates are from top left, and game coords are from bottom right
		ctx.beginPath();
		var circlePos = correctPosition(position);
		ctx.arc(circlePos.x - this.translateX, circlePos.y - this.translateY, circleRadius, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.fill();
	}
	
	function drawNorthPointer(){
		ctx.fillStyle = "rgba(255, 0, 0, 0.5)";;
		ctx.beginPath();
		ctx.moveTo(100, 0);
		ctx.lineTo(96, 6);
		ctx.lineTo(104, 6);
		ctx.lineTo(100, 0);
		ctx.closePath();
		ctx.fill();
	}

	function drawPlayers(){
		//first draw me. this will be at the dead center of the map
		//drawCircle({x: centerX, y: centerY}, meColor);
		
		for(var i=0;i<otherCharacterList.length;i++){
			var player = otherCharacterList[i];
			if(player){
				var playerPos = player.entity.position;
				drawCircle(playerPos, playerColor, true);
			}
		}
	}
	
	function drawNPCs(){
		for(var i=0;i<npcArray.length;i++){
			var npc = npcArray[i];
			if(npc){
				var npcPos = npc.entity.position;
				drawCircle(npcPos, npcColor);
			}
		}
	}
	
	function drawItems(){
		for(var i=0;i<itemArray.length;i++){
			var item = itemArray[i];
			if(item){
				var itemPos = item.entity.position;
				drawCircle(itemPos, itemColor);
			}
		}
	}
	
	function drawMapObjects(){
		for(var i=0;i<mapObjectsEntityArray.length;i++){
			var thisObj = mapObjectsEntityArray[i];
			if(thisObj){
				var pos = correctPosition(thisObj.position);
				var bounds = objectProperties[thisObj.type].bounds;
				//shrink the bounds of the object to fit the correct viewRatio
				var correctedBounds = {};
				for(var side in bounds){
					if(bounds.hasOwnProperty(side)){
						correctedBounds[side] = bounds[side] / viewRatio;
					}
				}
				//mapObject fillcolor for normal map objects, green fillcolor for trees
				if(thisObj.correspondingObject instanceof tree){
					ctx.fillStyle = treeColor;
				}else{
					ctx.fillStyle = mapObjectColor;
				}
				var objWidth = correctedBounds.right + correctedBounds.left;
				var objHeight = correctedBounds.bottom + correctedBounds.top;
				ctx.fillRect(pos.x - correctedBounds.left - this.translateX, pos.y - correctedBounds.top - this.translateY, objWidth, objHeight);
			}
		}
	}
	
	this.translateX = 0;
	this.translateY = 0;
	
	function translateTo(pos){
		var diffX = pos.x - this.translateX;
		var diffY = pos.y - this.translateY;
		ctx.beginPath();
		ctx.closePath();
		this.translateX = pos.x;
		this.translateY = pos.y;
	}
	
	this.rotateRad = 0;
	
	function rotateTo(newRotate){
		var diff = newRotate - this.rotateRad;
		ctx.rotate(diff);
		this.rotateRad = newRotate;
	}
	
	function translateCanvas(){
		var me = otherCharacterList[connectionNum];
		if(me){
			var pos = correctPosition(me.entity.position);
			var xPos = pos.x - 200 / 2;
			var yPos = pos.y - 200 / 2;
			var adjustedPos = {x: xPos, y: yPos};
			translateTo(adjustedPos);
		}
	}
	
	this.update = function(){
		translateCanvas();
		ctx.beginPath();
		ctx.clearRect(0, 0, 200, 200);
		ctx.closePath();
		//draw in an order such that the priority of visible entities on the minimap is:
		// 1. Players
		// 2. NPCs
		// 3. Items
		// 4. Map objects
		drawMapObjects();
		drawItems();
		drawNPCs();
		drawPlayers();
		drawNorthPointer();
		ctx.translate(100,100);
		rotateTo(-theta);
		ctx.translate(-100,-100);
	}
	
}
