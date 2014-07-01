var minimap = function(){
	//defines rendering of a minimap
	//dont do anything in the first executed stuff here that relates to info from the server,
	//as it won't have it when this loads at first
	this.minimapWidth = 200;
	this.minimapHeight = 200;
	
	
	this.meColor = "green";
	this.itemColor = "red";
	this.playerColor = "white";
	this.npcColor = "yellow";
	this.mapObjectColor = "brown";
	
	this.canvas = document.getElementById("minimapCanvas");
	this.context = this.canvas.getContext('2d');
	
	this.canvas.width = this.minimapWidth;
	this.canvas.height = this.minimapHeight;

	function drawPlayers(){
		
	}
	
	function drawNPCs(){
		
	}
	
	function drawItems(){
		
	}
	
	function drawMapObjects(){
		
	}
	
	this.update = function(){
		var ctx = this.context;
		ctx.beginPath();
		ctx.clearRect(0, 0, this.minimapWidth, this.minimapHeight);
		ctx.fillStyle = "yellow";
		ctx.fillRect(0, 0, this.minimapWidth, this.minimapHeight);
	}
	
}
