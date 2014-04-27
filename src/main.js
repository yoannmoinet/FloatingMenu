( function ( root, undefined ){
	"use strict";

	//Centralisation of each instance via a manager.
	var FloatingManager = function ( options ) {
		//Shortcuts.
		var self = this,
				fp = FloatingMenu.prototype;

		//var declaration.
		winRect = {
			size : getSize(),
			top : getScrollTop(),
			dif : 0,
			dir : 0
		};

		//Create a new instance.
		self.add = function ( options ) {
			return new FloatingMenu( options );
		};

		//Get All Instances.
		self.get = function (){
			return fp.get('all');
		};

		//DESTROY EVERYTHING !
		self.destroy = function (){
			var all = fp.get('all');
			for(var i = 0, max = all.length; i < max; i += 1) {
				all[i].destroy();
			}
			self.add = self.get = self = fp = null;
		};

		self.updateAll = function () {
			var all = fp.get('all');
			var scrollTop = getScrollTop();
			var oldTop = winRect.top;
			winRect.dif = winRect.top - scrollTop;
			winRect.dir = winRect.dif / parseInt( winRect.dif, 10 );
			winRect.top = scrollTop;

			//console.log(parseInt(all[1].constrainRect.top), parseInt(all[1].constrainRect.bottom));
			if(oldTop !== winRect.top)
				for(var i = 0, max = all.length; i < max; i += 1) {
					all[i].update();
				}
		};

		//If we have options, we instanciate our floaters.
		if(options !== undefined){
			/*if(options.container !== undefined)
				self.el = options.container;
			else
				self.el = document.getElementsByTagName('body')[0];*/

			if( options.menus ){
				for( var i = 0, max = options.menus.length; i < max; i += 1 ) {
					self.add({
						el : options.menus[i].menu,
						constrain : options.menus[i].constrain
					});
				}
			}
		}

		//Scroll and Resize events.
		window.onscroll = function doScroll ( evt ) {

			raf( self.updateAll.bind(self) );

		}

		window.onresize = function doResize ( evt ) {

			clearTimeout( timerSize );
			timerSize = setTimeout( function () {
				winRect.size = getSize();
			}, 250);

		};

		return self;
	};

	var FloatingMenu = function ( options ) {
		return _init( options, this );
	};

	var _init = function ( options, cont ) {
		var self = cont;

		for(var i in options){
			self[i] = options[i];
		}

		self.bindings();

		//Storing all instances, just in case.
		var all = self.get("all")||[];
		self._ind = all.length;
		all.push(self);

		//Overwrite old array.
		self.set("all",all);

		self.update();

		return self;
	};

	FloatingMenu.prototype.bindings = function () {};

	FloatingMenu.prototype.unbind = function () {
		var self = this;

		//Unsubscribe all subscribers.
		for(var i = 0, max = self.subscribers.length; i < max; i += 1){
			self.off(self.subscribers[i].evt, self.subscribers[i].cb);
		}
	};

	FloatingMenu.prototype.update = function () {
		var self = this;
		self.elRect = self.el.getBoundingClientRect();
		self.constrainRect = self.constrain.getBoundingClientRect();

		var shouldBeVisible = self.isActive();

		console.log(self._ind, shouldBeVisible);

		return self.elRect;
	};


	FloatingMenu.prototype.fix = function ( where, ditance ) {
		var self = this;
	};

	FloatingMenu.prototype.isActive = function() {
		var self = this;

		//If scroll did passed the top.
		if( self.constrainRect.top <= 0 &&
				self.constrainRect.bottom >= 0)
			return true;

		return false;
	};

	//Some events api.
	FloatingMenu.prototype.dispatch = function ( evt ) {
		var self = this,
			toSend = [];

		//If we have data to send.
		if(arguments.length > 1){
			for(var i = 1, max = arguments.length; i<max; i+=1){
				toSend.push(arguments[i]);
			}
		}

		self.subscribers = self.subscribers || [];
		for(var i = 0, max = self.subscribers.length; i < max; i += 1){
			if(self.subscribers[i].evt === evt){
				self.subscribers[i].cb.apply(self,toSend);
			}
		}

		return self;
	};

	FloatingMenu.prototype.on = function ( evt, cb ) {
		var self = this;

		self.subscribers = self.subscribers || [];
		self.subscribers.push({evt:evt,cb:cb});

		return self;
	};

	FloatingMenu.prototype.off = function ( evt, cb ) {
		var self = this;

		self.subscribers = self.subscribers || [];
		for( var i = 0, max = self.subscribers.length; i < max; i += 1 ){
			if(self.subscribers[i].evt === evt && self.subscribers[i].cb === cb){
				self.subscribers.splice( i, 1 );
				break;
			}
		}

		return self;
	};


	//Set the prototype.
	FloatingMenu.prototype.set = function ( key, value ) {
		var self = FloatingMenu.prototype;
		self[key] = value;
		return self;
	};

	//Get the prototype.
	FloatingMenu.prototype.get = function ( key ) {
		var self = FloatingMenu.prototype;
		return self[key];
	};

	//Destroy the instance.
	FloatingMenu.prototype.destroy = function () {
		var self = this,
			all = self.get("all").splice(self._ind,1); //Removing it from the all array.

		//Reindexing all instances.
		for(var i = 0, max = all.length; i < max; i += 1){
			all[i]._ind = i;
		}

		//Overwriting old array.
		self.set("all",all);

		self.unbind();
		self = null;
	};


	// Version.
	FloatingManager.VERSION = v;

	// Export to the root, which is probably `window`.
	root.FloatingMenu = FloatingManager;


	var v = '0.0.2';
	var timerSize;
	var winRect;
	var raf, caf;

	//Scroll polyfill.
	var getScrollTop = (function (){
		if ( document.documentElement.scrollTop !== undefined )
			return function () { return document.documentElement.scrollTop; };
		else if ( document.body.scrollTop !== undefined )
			return function () { return document.body.scrollTop; };
	})();

	//Window size polyfill.
	var getSize = (function (){
		if ( typeof ( window.innerWidth ) == 'number' )
			return function () {
				return {
					w : window.innerWidth,
					h : window.innerHeight
				};
			};
		else if ( document.documentElement &&
							( document.documentElement.clientWidth !== undefined ||
								document.documentElement.clientHeight !== undefined ) )
			return function () {
				return {
					w : document.documentElement.clientWidth,
					h : document.documentElement.clientHeight
				};
			};
		else if ( document.body &&
							( document.body.clientWidth !== undefined ||
								document.body.clientHeight !== undefined ) )
			return function () {
				return {
					w : document.body.clientWidth,
					h : document.body.clientHeight
				};
			};
	})();

	//rAF polyfill
	(function() {
		var lastTime = 0;
		var vendors = ['webkit', 'moz'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
				window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
				window.cancelAnimationFrame =
					window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
		}

		if (!window.requestAnimationFrame)
				window.requestAnimationFrame = function(callback, element) {
						var currTime = new Date().getTime();
						var timeToCall = Math.max(0, 16 - (currTime - lastTime));
						var id = window.setTimeout(function() { callback(currTime + timeToCall); },
							timeToCall);
						lastTime = currTime + timeToCall;
						return id;
				};

		if (!window.cancelAnimationFrame)
				window.cancelAnimationFrame = function(id) {
						clearTimeout(id);
				};
	}());

	raf = window.requestAnimationFrame;
	caf = window.cancelAnimationFrame;
})(this);
