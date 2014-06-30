function updateInventory(inventory){
	characterInventory = inventory;
	if(document.getElementById("tab1").className.indexOf("selectedTab") != -1){
		createInventory();
	}
}

function dropInventoryItem(id){
	var thisItem = characterInventory[id];
	var sendData = {itemId:id};
	socket.emit("DropEvent",sendData);
}

//inventory objects
var invItemMenu = function(type,id){
	if(type >= 0){
		//inventory item
		var menuArray = new Array();
		var itemName = itemProperties[type].name;
		if(itemProperties[type].weapon >= 0){
			//it's a weapon
			//type is type of the item, so find the weapon type
			var weaponType = itemProperties[type].weapon;
			menuArray.push("<div id='wieldClick' class='clickableOption' onMouseDown='changeCharacterWeapon(" + weaponType + "," + id +  ");'>Wield " + itemName + "</div>");
		}
		menuArray.push("<div id='sellClick' class='clickableOption' onMouseDown='sellItem(" + type + "," + id + ");'>Sell " + itemName + "</div>");
		menuArray.push("<div id='dropClick' class='clickableOption' onMouseDown='dropInventoryItem(" + id + ");'>Drop " + itemName + "</div>");
		return menuArray;
	}
}

var wieldedBoxMenu = function(type){
	//type is type of item
	if(type > 0){
		var menuArray = new Array();
		var weaponName = itemProperties[weaponProperties[type].item].name;
		menuArray.push("<div id='unWieldClick' class='clickableOption' onMouseDown='changeCharacterWeapon(" + type + "," + -1 + ");'>Unwield " + weaponName + "</div");
		return menuArray;
	}
}

var inventoryItem = function(id,bgUrl,stackable,quantity,type){
	var newItem = document.createElement("div");
	newItem.className = "inventoryItem";
	newItem.id = "invSpace" + id;
	newItem.style.backgroundImage = "url(" + bgUrl + ")";
	if(type >= 0){
		newItem.setAttribute('data-menu',(new invItemMenu(type,id)).join("_"));
	}
	if(stackable){
		//give it a quantity
		var quantityIndicator = document.createElement("div");
		quantityIndicator.className = "inventoryItemQuantity";
		quantityIndicator.id = id + "_quantity";
		quantityIndicator.innerHTML = quantity;
		newItem.appendChild(quantityIndicator);
	}
	return newItem;
}

var wieldedBox = function(initialType){
	console.log(initialType);
	//initialType 0 is empty
	var correspondingItem = weaponProperties[initialType].item;
	var bgImg = "";
	var newBox = document.createElement("div");
	if(correspondingItem != -1){
		bgImg = itemProperties[correspondingItem].img;
		newBox.setAttribute('data-menu',(new wieldedBoxMenu(initialType)).join("_"));
	}
	newBox.className = "wieldBox";
	newBox.id = "wieldedBox";
	newBox.style.backgroundImage = "url(" + bgImg + ")";
	return newBox;		
}
