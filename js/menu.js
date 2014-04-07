//UI VARIABLES
var chatBoxHeight = 100;
var menuPanels = new Array();
var menuPanelObj = function(title,loadFunction,id,img){
	this.title = title;
	this.id = id;
	this.loadFunction = loadFunction; //function to execute onLoad
	this.bg = img;
}

function loadPanelData(){
	menuPanels[0] = new menuPanelObj("Bombs",createParticleTab,0,"img/textures/bombTexture.png");
	menuPanels[1] = new menuPanelObj("Inventory",createInventory,1,"img/textures/packTexture.png");
	menuPanels[2] = new menuPanelObj("Character",createCharacterTab,2,"img/textures/characterTexture.png");
}

//TAB FUNCTIONS
function createParticleTab(){
	var menuPanel = document.getElementsByClassName('menuPanel')[0];
	menuPanel.innerHTML = "";
	for(var i=0;i<particleProperties.length;i++){
		var newMenuItem = document.createElement("div");
		newMenuItem.className = "menuItem";
		if(i == particleSelection){
			newMenuItem.className += " selectedParticle";
		}
		newMenuItem.id = i;
		newMenuItem.style.width = 20;
		newMenuItem.style.height = 20;
		var color = "#" + particleProperties[i].color.toString(16); //int to hex
		newMenuItem.style.background = color;
		newMenuItem.onclick = function(event){
			switchParticleSelection(this.id);
		}
		menuPanel.appendChild(newMenuItem);
	}
}

function createInventory(){
	var innerMenu = document.getElementsByClassName('menuPanel')[0];
	innerMenu.innerHTML = "";
	for(var i=0;i<characterInventory.length;i++){
		if(characterInventory[i] != undefined){
			var type = characterInventory[i].type;
			var bgUrl = itemProperties[type].img;
			var stackable = itemProperties[type].stackable;
			var quantity = characterInventory[i].quantity;
			var newItem = new inventoryItem(i,bgUrl,stackable,quantity,type);
			innerMenu.appendChild(newItem);
		}else{
			var newItem = new inventoryItem(i,"",false,0,-1); //blank inventory item
			innerMenu.appendChild(newItem);
		}
	}
}

function createCharacterTab(){
	var innerMenu = document.getElementsByClassName('menuPanel')[0];
	innerMenu.innerHTML = "";
	var thisCharacter = otherCharacterList[connectionNum];
	var wieldedWeaponBox = new wieldedBox(thisCharacter.weaponType);
	innerMenu.appendChild(wieldedWeaponBox);
}

function switchParticleSelection(id){
	particleSelection = id;
	var selectedItem = document.getElementsByClassName("selectedParticle")[0];
	var newClassName = selectedItem.className.slice(0,selectedItem.className.length-" selectedParticle".length);
	selectedItem.className = newClassName;
	document.getElementById(id).className += " selectedParticle";
}

function switchTab(currentTab){
	var tabNum = parseInt(currentTab.id.slice(3,currentTab.length));
	var selectedTab = document.getElementsByClassName("selectedTab")[0];
	var newClassName = selectedTab.className.slice(0,selectedTab.className.length-" selectedTab".length);
	selectedTab.className = newClassName; //revert it to be unselected
	currentTab.className += " selectedTab";
	
	var tabLoadFunction = menuPanels[tabNum].loadFunction;
	tabLoadFunction();
}
//END TAB FUNCTIONS

function createInnerMenu(){
	var innerMenu = document.getElementById('innerMenu');
	
	var tabHolder = document.getElementById('menuTabContainer');
	for(var i=0;i<menuPanels.length;i++){
		var newTab = document.createElement("div");
		newTab.className = "menuTab";
		if(i == 0){
			newTab.className += " selectedTab";
		}
		newTab.style.backgroundImage = "url(" + menuPanels[i].bg + ")";
		newTab.id = "tab" + i;
		newTab.onmousedown = function(){switchTab(this)};
		tabHolder.appendChild(newTab);
	}
	var newPanel = document.createElement("div");
	newPanel.className = "menuPanel";
	newPanel.id = "panel1";
	innerMenu.appendChild(newPanel);
	var loadFirstMenu = menuPanels[0].loadFunction;
	loadFirstMenu();
}
