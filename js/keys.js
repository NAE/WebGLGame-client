function checkKey(e) {

	e = e || window.event;

	if (e.keyCode == '37') {
		//left
		e.preventDefault();
		rotating = 2;
	}
	else if (e.keyCode == '39') {
		//right
		e.preventDefault();
		rotating = 1;
	}else if(e.keyCode == '38'){
		//up
		e.preventDefault();
		rotatingVertical = 1;
	}else if(e.keyCode == '40'){
		//down
		e.preventDefault();
		rotatingVertical = 2;
	}else if(e.keyCode == '13'){
		//send the message
		sendChatMessage();
	}else if(e.keyCode == '17'){
		//ctrl being held down
		holdingCtrl = true;
	}else if(e.keyCode == '27'){
		//hide modal on screen
		var modals = document.getElementsByClassName("modal-box");
		$(modals).hide();
	}
}

function checkStop(event){
	if(event.keyCode != undefined){
		rotating = 0;
		rotatingVertical = 0;
		holdingCtrl = false;
	}
}
