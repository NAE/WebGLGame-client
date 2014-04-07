//exchange stuff
function clearExchangeModal(){
	document.getElementById("exchangeOfferItem").backgroundImage = "";
}

function sellItem(type,id){
	var exchangeModal = document.getElementById("exchangeBox");
	$(exchangeModal).show();
	var box = document.getElementById("exchangeOfferItem");
	box.style.backgroundImage = "url(" + itemProperties[type].img + ")";
	var itemTextBox = document.getElementById("exchangeOfferItemText");
	itemTextBox.innerHTML = itemProperties[type].name;
}
