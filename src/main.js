(function(root, undefined){
	"use strict";

	var v = '0.0.1';

	//Centralisation of each instance via a manager.
	var FloatingManager = function(options){
		var self = this,
				fp = FloatingMenu.prototype;

		self.add = function(options){
			return new FloatingMenu(options);
		};

		self.get = function(){
			return fp.get('all');
		};

		//DESTROY EVERYTHING !
		self.destroy = function(){
			var all = fp.get('all');
			for(var i = 0, max = all.length; i < max; i += 1){
				all[i].destroy();
			}
			self.add = self.get = self = fp = null;
		};


		//If we have options, we instanciate our first floater.
		if(options !== undefined){
			self.add(options);
		}

		return self;
	};

	var FloatingMenu = function(options) {
		return _init(options,this);
	};

	var _init = function(options,cont){
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

		return self;
	};

	FloatingMenu.prototype.bindings = function() {};

	FloatingMenu.prototype.unbind = function() {
		var self = this;

		//Unsubscribe all subscribers.
		for(var i = 0, max = self.subscribers.length; i < max; i += 1){
			self.off(self.subscribers[i].evt, self.subscribers[i].cb);
		}
	};




	//Some events api.
	FloatingMenu.prototype.dispatch = function( evt ) {
		var self = this,
			toSend = [];

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

	FloatingMenu.prototype.on = function( evt, cb ) {
		var self = this;

		self.subscribers = self.subscribers || [];
		self.subscribers.push({evt:evt,cb:cb});

		return self;
	};

	FloatingMenu.prototype.off = function( evt, cb ) {
		var self = this;

		self.subscribers = self.subscribers || [];
		for(var i = 0, max = self.subscribers.length; i<max; i+=1){
			if(self.subscribers[i].evt === evt && self.subscribers[i].cb === cb){
				self.subscribers.splice(i,1);
				break;
			}
		}

		return self;
	};


	//Set the prototype.
	FloatingMenu.prototype.set = function( key, value ) {
		var self = FloatingMenu.prototype;
		self[key] = value;
		return self;
	};

	//Get the prototype.
	FloatingMenu.prototype.get = function(key){
		var self = FloatingMenu.prototype;
		return self[key];
	};

	//Destroy the instance.
	FloatingMenu.prototype.destroy = function() {
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

})(this);
