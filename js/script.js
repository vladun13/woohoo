(function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimFrame = requestAnimationFrame;
})();

var mybuttons = document.querySelectorAll(".ilinebutton_container");

function iLineButton(p) {
	this.cnt = p.container;
    this.c = this.cnt.querySelector("canvas");
    this.span = this.cnt.querySelector("span");
    this.ctx = this.c.getContext("2d");
    this.r = p.radius || 20;
    this.linesize = p.linesize || 2;
    this.linecolor = p.linecolor || "#000";
    this.mouseradius = p.mouseradius || 100;
    this.mouseforcek = p.mouseforce || 0.4;
    this.mouseforcedown = p.mouseforcedown || -0.4;
    this.hoverforce = p.hoverforce || 0.07;

    this.mouseforcek *= 0.6;

    this.tmpforceimpact = 1;

    this.showt = 0;
    this.showmaxt = 0;
    
    this.Vec = function(x, y) {
        this.x = x;
        this.y = y;

        this.len = function(){
            return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y, 2));
        }
        
        this.clone = function(){
            return new this.constructor(this.x, this.y);
        }

        this.dot = function(v){
            return this.x*v.x + this.y*v.y;
        }
        
        this.run = function() {
            if (!this.static) {
                var res = 0.2;
                var oldpos = new this.constructor(this.x,this.y);
                this.mult(2-res).sub(this.ppos.mult(1-res)).add(this.f);
                this.ppos = oldpos;
            }
            return this;
        }

        this.normalize = function(){
            var l = this.len();
            this.x /= l;
            this.y /= l;
            return this;
        }

        this.add = function(v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        }

        this.sub = function(v) {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        }

        this.mult = function(n) {
            this.x *= n;
            this.y *= n;
            return this;
        }

        this.zero = function() {
            this.x = 0;
            this.y = 0;
            return this;
        }

        this.print = function(n) {
            console.log((n || "vec")+": x = "+this.x+"; y = "+this.y);
        }
    }
    
    this.Spring = function(p1, p2) {
    	this.p1 = p1;
        this.p2 = p2;
        this.k = 0.05;
        this.l = this.p1.clone().sub(this.p2).len();
        
        this.run = function(){
        	var v = this.p1.clone().sub(this.p2);
            var vlen = v.len();
            if (vlen > 0) {
                var dl = vlen - this.l;
                var f = v.normalize().mult(-dl * this.k);
                if (!this.p1.static) this.p1.f.add(f);
                if (!this.p2.static) this.p2.f.add(f.mult(-1));
            }
            return this;
        }
    }
    
    this.shown = false;
    this.points = [];
    this.springs = [];
    
    this.mouse = false;
    this.mousedown = false;
    
    this.draw = function(dt) {
    	if (!this.points.length) return;

        if (this.mousedown) this.span.classList.add("active");
        else this.span.classList.remove("active");

        for (var i = 0; i < this.points.length; i++) {
            this.points[i].f = new this.Vec(0,0);

            if (this.mouse) {
                var dirfrommouse = this.points[i].clone().sub(this.mouse);
                var l2m = dirfrommouse.len();

                if (l2m > 0 && l2m < this.mouseradius) {
                    dirfrommouse.mult(1/l2m).mult(1 - l2m/this.mouseradius).mult(this.mouseforcek * this.tmpforceimpact);
                    //dirfrommouse.x *= 0.8;
                    this.points[i].f = dirfrommouse;
                    if (this.mousedown) this.points[i].f.mult(this.mouseforcedown);
                }

                if (this.points[i].type == "lm") {
                    this.points[i].f.x -= this.hoverforce;
                } else if (this.points[i].type == "rm") {
                    this.points[i].f.x += this.hoverforce;
                } else {
                    var fy = this.points[i].y > this.h/2 ? this.hoverforce : -this.hoverforce;
                    this.points[i].f.y += fy;
                }
            }
        }

        for (var i = 0; i < this.springs.length; i++) this.springs[i].run();
        for (var i = 0; i < this.points.length; i++) this.points[i].run();
        
    	this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.strokeStyle = this.linecolor;
        this.ctx.lineWidth = this.linesize;
        this.ctx.lineCap = "round";
        this.ctx.setLineDash([]);

        if (this.showmaxt) {
            this.showt += dt;

            var pp = this.showt / this.showmaxt;

            if (pp < 1) {
                if (pp < 0.5) {
                    pp /= 0.5;

                    var ww = this.w - this.margin * 2;
                    //ww *= 1.25;
                    var startline = ww * pp;//Math.pow(pp,2);
                    var endline = ww * Math.pow(pp,0.5);
                    var linelen = Math.abs(endline - startline);
                    this.ctx.setLineDash([linelen, ww+100]);
                    this.ctx.lineDashOffset = -startline;

                    this.ctx.beginPath();
                    this.ctx.moveTo(this.margin, this.h/2);
                    this.ctx.lineTo(this.margin + ww, this.h/2);
                    this.ctx.stroke();

                    return;
                } else {

                    this.span.classList.add("shown");

                    //var qwer = 0;//this.r * Math.PI * 2 / 4;
                    var startoffset = this.linelength / 2;// - qwer;

                    pp = (pp - 0.5) / 0.5;

                    this.ctx.setLineDash([pp * (this.linelength + 20), this.linelength + 200]);
                    this.ctx.lineDashOffset = -startoffset + pp * this.linelength / 2;

                    this.mouse = {x:this.w-this.margin-(this.w - (this.margin) * 2) * pp, y: this.h/2};
                    if (this.mouse.x < this.margin + this.r) this.mouse.x = this.margin + this.r;
                    if (this.mouse.x > this.w - this.margin - this.r) this.mouse.x = this.w - this.margin - this.r;

                    this.tmpforceimpact = 1.25;
                }
                //this.mouse = {x:this.w-this.margin-this.r-(this.w - (this.margin + this.r) * 2) * pp, y: this.h/2}
                //this.ctx.setLineDash([this.linelength*pp, this.linelength]);
                //this.ctx.lineDashOffset = -pp * this.linelength * 0.5;
                /*if (pp < 0.5) {
                    pp /= 0.5;
                    this.ctx.setLineDash([30, this.linelength]);
                    this.ctx.lineDashOffset = -pp * this.linelength;
                } else {
                    pp = (pp - 0.5) / 0.5;
                    this.ctx.setLineDash([this.linelength*pp, this.linelength]);
                    this.ctx.lineDashOffset = 0;//-pp * this.linelength;
                }*/
            } else {
                this.mouse = false;
                this.showmaxt = 0;
                this.tmpforceimpact = 1;
            }
            /*
            this.ctx.setLineDash([200, 200]);
            this.ctx.lineDashOffset = 200;
            */
        }
        
        this.ctx.beginPath();
        
        for (var i = 0; i < this.points.length; i++) {
        	var point = this.points[i];
            if (i == 0) {
            	this.ctx.moveTo(point.x, point.y);
            }
            var next;
            
            if (i < this.points.length - 1) {
            	next = this.points[i+1];
            } else {
            	next = this.points[0];
            }
            
            if (next.type && point.type) {
            	var control1, control2, control;
                var k = 1.8;
                
                var dx = next.x - point.x;
                var dy = next.y - point.y;
                
                if (point.type == "rt" || point.type == "lb") {
                	control1 = {x: point.x + dx/k, y: point.y};
                	control2 = {x: next.x, y: next.y - dy/k};
                } else {
                	control1 = {x: point.x, y: point.y + dy/k};
                	control2 = {x: next.x - dx/k, y: next.y};
                }
                
                this.ctx.bezierCurveTo(control1.x,control1.y,control2.x,control2.y,next.x,next.y);
            } else {
            	this.ctx.lineTo(next.x, next.y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
        if (this.mousedown) {
            this.ctx.fillStyle = this.linecolor;
            this.ctx.fill();
        }
    }
    
    this.setHandlers = function(){
        var th = this;
    	
        this.span.onmousemove = function(e){
        	var x = e.clientX - this.getBoundingClientRect().left + th.margin;
			var y = e.clientY - this.getBoundingClientRect().top + th.margin;

            if (x < th.margin + th.r) x = th.margin + th.r;
            if (x > th.w - th.margin - th.r) x = th.w - th.margin - th.r;

            th.mouse = {x: x, y: (th.h/2+y)/2};
        }

        this.span.onmousedown = function(){
            th.mousedown = true;
        }

        this.span.onmouseup = function(){
            th.mousedown = false;
        }
        
        this.span.onmouseout = function(){
        	th.mouse = false;
        }
    }
    
    this.show = function(t) {
        if (this.shown) return;
        this.shown = true;
        this.showmaxt = t;

    	this.w = parseFloat(this.c.offsetWidth);
        this.h = parseFloat(this.c.offsetHeight);
        
        this.c.width = this.w;
        this.c.height = this.h;
        
        this.margin = this.h/2 - this.r;

        this.span.style.height = (this.r * 2) + "px";
        this.span.style.margin = this.margin + "px";
        this.span.style.lineHeight = (this.r * 2) + "px";
        
        var n = 50;
        
        this.points.push({x: this.margin + this.r, y: this.margin, type: "lt"});
        
        var ww = this.w - (this.margin + this.r) * 2;
        var step = ww / (n + 1);

        this.linelength = ww * 2 + 2 * Math.PI * this.r;
        
        for (var i = 1; i < n + 1; i++) {
        	this.points.push({x: this.margin + this.r + step * i, y: this.margin});
        }
        
        this.points.push({x: this.w - this.margin - this.r, y: this.margin, type: "rt"});
        this.points.push({x: this.w - this.margin, y: this.margin + this.r, type: "rm"});
        this.points.push({x: this.w - this.margin - this.r, y: this.h - this.margin, type: "rb"});
        
        for (var i = 1; i < n + 1; i++) {
        	this.points.push({x: this.w - this.margin - this.r - step * i, y: this.h - this.margin});
        }
        
        this.points.push({x: this.margin + this.r, y: this.h - this.margin, type: "lb"});
        this.points.push({x: this.margin, y: this.margin + this.r, type: "lm"});
        
        for (var i = 0; i < this.points.length; i++) {
        	var t = this.points[i].type;
        	var x = this.points[i].x;
            var y = this.points[i].y;
            
            this.points[i] = new this.Vec(x,y);
            this.points[i].type = t;
            this.points[i].f = new this.Vec(0,0);
            this.points[i].ppos = new this.Vec(x,y);

            var anchor = new this.Vec(x,y);
            anchor.static = true;

            this.springs.push(new this.Spring(this.points[i], anchor));
        }

        var newpoints = [];
        newpoints.push(this.points[this.points.length-1]);

        for (var i = 0; i < this.points.length-1; i++) {
            newpoints.push(this.points[i]);
        }
        this.points = newpoints;
        
        this.setHandlers();
    }
}

var ilinebutton1 = new iLineButton({
	container: mybuttons[0]
});

ilinebutton1.show(0);

var ilinebutton2 = new iLineButton({
    container: mybuttons[1],
    linecolor: "#fff",
    radius: 25,
    mouseradius: 200,
    linesize: 3,
    mouseforce: 0.5,
    mouseforcedown: -0.35
});

window.onclick = function(){
    ilinebutton2.show(400);
}

var lt = new Date().getTime();

function animate(){
    var t = new Date().getTime();
    var dt = t - lt;
	ilinebutton1.draw(dt);
    ilinebutton2.draw(dt);
    window.requestAnimFrame(animate);
    lt = t;
}

animate();