//taken from http://indiegamr.com/generate-repeatable-random-numbers-in-js/

Math.seed = 6;

Math.seededRandom = function(min, max){
	max = max || 1;
	min = min || 0;
	
	Math.seed = (Math.seed * 9301 + 49297) % 233280;
	var rnd = Math.seed / 233280;
	
	return min + rnd * (max - min);
}

function getRandomDecimal(min, max){
	return min + (Math.random() * (max - min));
}
