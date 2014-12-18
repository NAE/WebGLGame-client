function doLogout(e){
	//for now, just refresh the page, it will log them out
	history.go(0);
}

$(document).ready(function(){
	document.getElementById("logout").onclick = doLogout;
});
