function moveAllAnimations(){
	//progress all player/npc animations if they're not 'walk'
	var animAmount = .05;
	for(var i=0;i<otherCharacterList.length;i++){
		var thisPlayer = otherCharacterList[i];
		if(thisPlayer && !thisPlayer.isPerforming("walk")){
			if(thisPlayer.animation.isPlaying){
				thisPlayer.animation.update(.05);
			}
		}
	}
	
	for(var i=0;i<npcArray.length;i++){
		var thisNPC = npcArray[i];
		if(thisNPC && !thisNPC.isPerforming("walk")){
			if(thisNPC.animation.isPlaying){
				thisNPC.animation.update(.05);
			}
		}
	}
}


