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
			dif : getScrollTop(),
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
			var scrollTop = getScrollTop();

			if( winRect.top !== scrollTop ){
				var all = fp.get('all');

				winRect.dif = winRect.top - scrollTop;
				winRect.dir = winRect.dif / Math.abs( winRect.dif ) * -1;
				winRect.top = scrollTop;
				for(var i = 0, max = all.length; i < max; i += 1) {
					all[i].update();
				}
			}
		};

		//If we have options, we instanciate our floaters.
		if(options !== undefined){
			if( options.menus ){
				for( var i = 0, max = options.menus.length; i < max; i += 1 ) {
					self.add({
						el : options.menus[i].menu,
						constrain : options.menus[i].constrain,
						offset : options.menus[i].offset
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

		//Cache old CSS
		self.old = {};
		self.old.position = self.el.style.position;
		self.old.top = self.el.style.old;
		self.old.bottom = self.el.style.bottom;
		self.old.display = self.el.style.display;
		self.old.width = self.el.style.width;
		self.old.left = self.el.style.left;
		self.old.marginLeft = self.el.style.marginLeft;
		self.old.marginRight = self.el.style.marginRight;
		self.old.marginTop = self.el.style.marginTop;
		self.old.marginBottom = self.el.style.marginBottom;

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

		var shouldBeFixed = self.isFixed();

		if ( shouldBeFixed && !self.fixed)
				self.fix( shouldBeFixed, self.offset[shouldBeFixed] );
		else if ( !shouldBeFixed && self.fixed )
			self.unfix();

		return self.elRect;
	};


	FloatingMenu.prototype.fix = function ( where, distance ) {
		var self = this;
		var padding = getCSS( self.el, 'padding-left', true);
		padding += getCSS( self.el, 'padding-right', true);

		self.el.style.position = 'fixed';
		self.el.style.display = 'block';
		self.el.style.width = ( self.elRect.width - padding ) + "px";
		self.el.style.left = self.elRect.left + "px";

		//Reset margins.
		self.el.style.marginLeft = "0px";
		self.el.style.marginRight = "0px";
		self.el.style.marginTop = "0px";
		self.el.style.marginBottom = "0px";

		if( distance !== undefined ) {
			self.el.style.top = self.el.style.bottom = undefined;
			self.el.style[where] = distance + "px";
		}
		self.fixed = true;
	};


	FloatingMenu.prototype.unfix = function ( where ) {
		var self = this;

		for(var i in self.old){
			self.el.style[i] = null;
		}

		self.fixed = false;
	};

	FloatingMenu.prototype.isFixed = function() {
		var self = this;

		//If we're scrolling down.
		if( winRect.dir )
			//If the top is passed.
			if( self.constrainRect.top <= self.offset.top )
				//But the bottom has not yet reached the critical place.
				if( self.constrainRect.bottom >= Math.min( self.elRect.height, winRect.size.h ) - self.offset.bottom )
					//If the floater is smaller than the window.
					if( self.elRect.height < winRect.size.h )
						return 'top';
					//If we're scrolling past the bottom of the bigger floater.
					else if( self.constrainRect.top < - ( self.elRect.height - winRect.size.h + self.offset.bottom ) )
						return 'bottom';

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

	var getCSS = function ( el, property, digest ){
		var prop = window.getComputedStyle( el, null ).getPropertyValue( property );
		if( digest === true )
			prop = +prop.replace(/px|em/g, '');
		return prop;
	};

	//Scroll polyfill.
	var getScrollTop = /*(function (){
		if ( document.documentElement.scrollTop !== undefined )
			return function () { return document.documentElement.scrollTop; };
		else
			return function () { return document.body.scrollTop; };
	})();*/ function(){
	return document.documentElement.scrollTop||document.body.scrollTop;
};

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
