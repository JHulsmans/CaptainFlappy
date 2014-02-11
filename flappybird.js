//Declareer constante variabelen
var Const = {
	Flappy_RADIUS : 28,
	Flappy_JUMP_SPEED : 12,
	OBST_BREEDTE : 85,
	OBST_MAX_HOOGTE : 220,
	OBST_MIN_HOOGTE : 60,
	OBST_AANTAl : 100,
	OBST_START_X : 600,
	OBST_MARGIN : 300,
	OBST_HEAD_HEIGHT : 32,
	SCHERM_HOOGTE : 640,
	SCHERM_BREEDTE : 480,
	DOORGANG_HOOGTE : 200,	// Afstand tussen Obstakels -> OBST
	FLAPPY_SPEED : 9.5,
	G : 0.8	//G = Gravity..
};
	
var JH = {	
	Point : function(x,y) {
		this.x = x ? x : 0;
		this.y = y ? y : 0;
	},
	
	Flappy : function() {
		this.x = 100;
		this.y = 400;
		this.vx = Const.FLAPPY_SPEED;
		this.vy = 0;
		this.r = Const.Flappy_RADIUS;
		this.isDood = false;
	},
	
	Obstacle : function(x, height, dir) {
		this.x = x;
		this.dir = dir;
		this.y = this.dir == 1 ? 0 : Const.SCHERM_HOOGTE;
		this.width = Const.OBST_BREEDTE;
		this.height = height;
		this.passed = false;
	},
	
	Game : function() {
	}	
};

JH.Point.prototype = {
	dis : function(point) {
		return Math.sqrt((this.x - point.x)*(this.x - point.x) + (this.y - point.y)*(this.y - point.y))
	}
}

JH.Flappy.prototype = {
	jump : function() {
		if(this.isDood) return;
		
		this.vy = -Const.Flappy_JUMP_SPEED; 
	},
	
	update : function() {
		
		if(!this.isDood)
			this.x += this.vx;
		
		this.y += this.vy;
		
		if(this.y < 0) {
			this.y = 0;
			this.vy = 0;
		}
		
		if(this.y > Const.SCHERM_HOOGTE - this.r) {
			this.y = Const.SCHERM_HOOGTE - this.r;
			return;
		}
		this.vy += Const.G;
	},
	
	die : function() {
		this.isDood = true;
		this.vy = 0;
	}
};

JH.Obstacle.prototype = {
	/**
	 * 
 	 * @param {JH.Flappy} Flappy
	 */
	hit : function(Flappy) {
		var left = this.x - this.width / 2;
		var right = this.x + this.width / 2;
		var bottom = this.dir == 1 ? 0 : Const.SCHERM_HOOGTE - this.height;
		var top = bottom + this.height;
		
		
		if(this.dir == 1) {
			if(Flappy.x > left - Flappy.r && Flappy.x < right + Flappy.r && Flappy.y < top) return true;	
			if(Flappy.x > left && Flappy.x < right && Flappy.y - Flappy.r < top) return true;
		}else{
			if(Flappy.x > left - Flappy.r && Flappy.x < right + Flappy.r && Flappy.y > bottom) return true;	
			if(Flappy.x > left && Flappy.x < right && Flappy.y + Flappy.r > bottom) return true;
		}
		
		var bc = new JH.Point(Flappy.x, Flappy.y);
		var lc = new JH.Point(left, this.dir == 1 ? top : bottom);
		var rc = new JH.Point(right, this.dir == 1 ? top : bottom);
		
		if(lc.dis(bc) < Flappy.r) return true;
		if(rc.dis(bc) < Flappy.r) return true;
		
		return false;
	}
}

JH.Game.prototype = {
	
	//Roep randomize functie op, seed wordt gegenereerd in de index.html
	random : function() {
		var x = Math.abs(Math.sin(this.seed++)) * 10000;
    	return x - Math.floor(x);
	},
	
	//Crëeer obstakels functie zolang als OBST_AANTAL groot is.
	createObstacle : function() {
		for(var i=0;i<Const.OBST_AANTAl;i++) {
			var ht_up = Math.floor(this.random() * (Const.OBST_MAX_HOOGTE - Const.OBST_MIN_HOOGTE)) + Const.OBST_MIN_HOOGTE;
			var ht_dw = Const.SCHERM_HOOGTE - Const.DOORGANG_HOOGTE - ht_up;
			var x = Const.OBST_START_X + i*Const.OBST_MARGIN;
			var obst_up = new JH.Obstacle(x, ht_up, 1);
			var obst_dw = new JH.Obstacle(x, ht_dw, -1);
			
			this.obsts.push(obst_up);
			this.obsts.push(obst_dw);
		}
	},
	
	//Functie indien spel gedaan is (game-over). Scorebord maken? Research!
	gameOver : function(){
		this.isGameOver = true;
		this.gameOverTime = new Date().getTime();
		this.Flappy.die();
		this.saveRecord();
	},
	
	//Functie die checkt of het spel game-over is :O
	checkGameOver : function() {
		
		// Flappy raakt de vloer? :(
		if(this.Flappy.y >= Const.SCHERM_HOOGTE - this.Flappy.r) return true;
		
		// er mogen maar 3*2 obstakels in zicht zijn
		var passed = false;
		for(var i=0;i<3*2;i++)
		{
			var obst = this.obsts[this.obstIndex + i];
			
			if(obst.hit(this.Flappy))	{
				console.log('obst ' + (this.obstIndex + i) + ' killed Mr. Flappy! :(');
				return true;
			}
			
			if(this.Flappy.x > obst.x && !obst.passed) {
				obst.passed = passed = true;
			}
		}
		if(passed) {
			this.score++;
			if(this.score > this.record) this.record = this.score;
		}
		
		return false;
	},
	
	
	update : function() {
		
		if(!this.isGameStarted) return;
		
		this.Flappy.update();
		
		if(this.isGameOver) return;
		
		this.left += this.vx;
		
		if (this.checkGameOver())
			this.gameOver();
		
		var obst_lm = this.obsts[this.obstIndex];
		// meest linkse obstakel is uit het zicht geraakt.
		if(obst_lm.x + obst_lm.width/2 < this.left)
			this.obstIndex+=2;
	},
	
	// Teken Flappy :O - Insert sprites zodat flappy er beter uit gaat zien! Nieuwe outfit is nodig!
	drawFlappy : function() {
		ctx.beginPath();
		ctx.strokeStyle = "#FFFFFF";
		ctx.fillStyle = "#FF0000";
		ctx.arc(this.Flappy.x - this.left, this.Flappy.y, this.Flappy.r, 0, 2*Math.PI);
		ctx.fill();
		//ctx.endPath();
	},
	
	drawObst : function(obst) {
		var x = obst.x - this.left - obst.width/2;
		var y = obst.dir == 1 ? 0 : Const.SCHERM_HOOGTE - obst.height;
		var x_s = x + obst.width/3;
		var w_l = obst.width/3;
		var w_r = obst.width/3*2;

      	var grd=this.ctx.createLinearGradient(x,y,x_s,y);
		grd.addColorStop(0,"#75BA6E");
		grd.addColorStop(1,"#DDF0D8");
		this.ctx.fillStyle = grd;
		
		this.ctx.fillRect(x, y, w_l, obst.height);
		
		var grd=this.ctx.createLinearGradient(x_s,y,x + obst.width, y);
		grd.addColorStop(0,"#DDF0D8");
		grd.addColorStop(1,"#318C27");
		
		this.ctx.fillStyle = grd;
		this.ctx.fillRect(x_s, y, w_r, obst.height);
		
		this.ctx.beginPath();
		this.ctx.strokeStyle = "291B09";
		this.ctx.lineWidth = 2;
		this.ctx.rect(x,y,obst.width,obst.height);
		this.ctx.stroke();
		
		this.ctx.beginPath();
		this.ctx.strokeStyle = "291B09";
		this.ctx.lineWidth = 3;
		this.ctx.rect(x,obst.dir == 1 ? y + obst.height - Const.OBST_HEAD_HEIGHT : y, obst.width, Const.OBST_HEAD_HEIGHT);
		this.ctx.stroke();
	},
	
	drawObsts : function() {
		// er mogen maar 3*2 obstakels in zicht zijn
		for(var i=0;i<3*2;i++)
		{
			var obst = this.obsts[this.obstIndex + i];	
			this.drawObst(obst);	
		}
	},
	
	render : function() {
		this.update();
		this.ctx.clearRect(0,0,Const.SCHERM_BREEDTE,Const.SCHERM_HOOGTE);
		this.drawObsts();
		this.drawFlappy();
	},
	
	getRecord : function() {
		var record = localStorage.getItem("record");
		return record ? record : 0;
	},
	
	// HighScore opslaan in localstorage zal natuurlijk gewiped worden indien browser cookies / cache opgeschoond wordt -> live scoreboard?
	saveRecord : function() {
		localStorage.setItem("record", this.record);
	},
	
	init : function(seed, ctx) {
		this.seed = seed ? seed : 0;
		this.ctx = ctx;
		this.obstIndex = 0;
		this.vx = Const.FLAPPY_SPEED;
		this.obsts = [];
		this.left = 0;
		this.score = 0;
		this.record = this.getRecord();
		this.obstIndex = 0;
		this.Flappy = new JH.Flappy();
		this.isGameOver = false;
		this.isGameStarted = false;
		this.createObstacle();
	},
	
	onkeydown : function(e) {
		var keyCode = ('which' in event) ? event.which : event.keyCode;
		switch(keyCode){
			case 32:
			if(this.isGameOver && (new Date().getTime() - this.gameOverTime > 500)){
				this.init(this.seed, this.ctx);
			}else{
				this.isGameStarted = true;
				this.Flappy.jump();
			}
		}
	}
}
