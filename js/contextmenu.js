//CONTEXT MENU
function createContextMenu(position, elementClicked, posMoveTo){
	if(elementClicked == undefined){
		//CLICKED ON MAP
		removeContextMenu();
		var newContextMenu = document.createElement("div");
		newContextMenu.id = "contextMenu";
		newContextMenu.style.top = position.y;
		newContextMenu.style.left = position.x;
		var menuArray = [];
		menuArray.push("<div id='moveOption' class='clickableOption' onMouseDown='movePlayerTo(" + posMoveTo.x + ", " + posMoveTo.y + ");'>Walk here</div>");
		for(var i=0;i<menuArray.length;i++){
			newContextMenu.innerHTML += (menuArray[i]);
		}
		document.body.appendChild(newContextMenu);
		return;
	}
	//position = {x,y}
	removeContextMenu();
	var newContextMenu = document.createElement("div");
	newContextMenu.id = "contextMenu";
	newContextMenu.style.top = position.y;
	newContextMenu.style.left = position.x;
	//create menu contents
	var menuArray = elementClicked.getAttribute("data-menu").split("_");
	if(menuArray != undefined){
		for(var i=0;i<menuArray.length;i++){
			newContextMenu.innerHTML += (menuArray[i]);
		}
	}
	document.body.appendChild(newContextMenu);
}

//creates a contextmenu for a clicked MapObject
function createObjectContextMenu(position, objectId){
	removeContextMenu();
	var mapObjectEntity = mapObjectsEntityArray[objectId];
	var newContextMenu = document.createElement("div");
	newContextMenu.id = "contextMenu";
	newContextMenu.style.top = position.y;
	newContextMenu.style.left = position.x;
	var menuArray = [];
	
	//load the contextmenu with event options
	var eventTypes = objectProperties[mapObjectEntity.type].eventTypes;
	for(var i=0;i<eventTypes.length;i++){
		var eventType = eventTypes[i];
		var eventTypeNice = eventType[0].toUpperCase() + eventType.slice(1).toLowerCase();
		menuArray.push("<div id='mapObjectOption" + eventType +"' data-event='" + eventType + "' data-event-index='" + i + "' data-objectid='" + objectId + "' class='clickableOption mapObjectOption'>" + eventTypeNice + "</div>");
	}
	//if the player is in editmode, add a remove option to the MapObject
	var me = otherCharacterList[connectionNum];
	if(me.admin && me.editmode){
		var eventTypeNice = "Remove";
		menuArray.push("<div id='mapObjectOptionREMOVE' data-event='REMOVE' data-event-index='" + -1 + "' data-objectid='" + objectId + "' class='clickableOption mapObjectOption'>" + eventTypeNice + "</div>");
	}
	for(var i=0;i<menuArray.length;i++){
		newContextMenu.innerHTML += (menuArray[i]);
	}
	document.body.appendChild(newContextMenu);
	
	$(".mapObjectOption").mousedown(function(event){
		var eventType = $(this).attr("data-event");
		var eventIndex = $(this).attr("data-event-index");
		var objId = $(this).attr("data-objectid");
		var mapObjEntity = mapObjectsEntityArray[objId];
		interactWithClickedObject(mapObjEntity, eventIndex);
	});
}

function removeContextMenu(){
	var oldMenu = document.getElementById("contextMenu");
	if(oldMenu != undefined){
		oldMenu.parentNode.removeChild(oldMenu);
	}
}
