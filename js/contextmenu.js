//CONTEXT MENU
function createContextMenu(position, elementClicked, posMoveTo){
	if(elementClicked == undefined){
		//CLICKED ON MAP
		removeContextMenu();
		var newContextMenu = document.createElement("div");
		newContextMenu.id = "contextMenu";
		newContextMenu.style.height = 40;
		newContextMenu.style.width = 100;
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
	newContextMenu.style.height = 40;
	newContextMenu.style.width = 100;
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

function removeContextMenu(){
	var oldMenu = document.getElementById("contextMenu");
	if(oldMenu != undefined){
		oldMenu.parentNode.removeChild(oldMenu);
	}
}
