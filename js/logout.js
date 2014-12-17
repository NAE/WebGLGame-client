function doLogout(e){
	window.location.href = "/WebglGame/Website/index.php/user/logout";
}

$(document).ready(function(){
	document.getElementById("logout").onclick = doLogout;
});
