var HybridAppFX = function() {
	if(document.all && window.external && typeof(window.external.addFavorite) === "undefined") {
		this.nativeInterface = window.external;
	}
	else {
		this.nativeInterface = window.fake_external;
	}
	if(window.document.title) {
		window.name = window.document.title + new Date().getTime();
	}
	else {
		window.name = "hafx_" + new Date().getTime();
	}
	this.appID = this.nativeInterface.allocate(window.name, "HybridAppFX_notify");
};

var HybridAppFX_funcMap = {};
function HybridAppFX_notify(callbackID, appID) {
	try {
		var key = appID + "_" + callbackID;
		var func = HybridAppFX_funcMap[key];
		var result = func.call(this);
		if(result) {
			delete HybridAppFX_funcMap[key];
		}
	}
	catch(err) {
		throw err;
	}
}
//Public Interfaces
HybridAppFX.prototype.dispose = function() {
	return this.nativeInterface.unallocate(this.appID);
};

HybridAppFX.prototype.invokeSync = function(/* String */ serviceName, /* Array */ parameters) {
	return this.nativeInterface.invokeSync(this.appID, serviceName, this.toJSON(parameters));
};
	
HybridAppFX.prototype.invokeAsync = function(/* String */ serviceName, /* Array */ parameters, /* Function */ onReturnCallback) {
	var invocationID = this.getCallbackID("SYS_CALLBACK_" + serviceName);
	var key = this.appID + "_" + invocationID;
	this.nativeInterface.registerMessage(this.appID, invocationID);
	var _this = this;
	this.execute(key, function() {
		var payload = _this.nativeInterface.receiveMessage(_this.appID, invocationID);
		if(payload == "") {
			return false;
		}
		var json = _this.fromJSON(payload);
		if(onReturnCallback) {
			onReturnCallback.call(_this, json);
		}
		
		_this.nativeInterface.unregisterMessage(_this.appID, invocationID);
		return true;
	});
	return this.nativeInterface.invokeAsync(this.appID, invocationID, serviceName, this.toJSON(parameters));
};

HybridAppFX.prototype.sendMessage = function(/* String */ messageID, /* Array */ parameters) {
	var _this = this;
	this.delayExecute(function() {
		_this.nativeInterface.sendMessage(_this.appID, messageID, _this.toJSON(parameters));
	});
};
	
HybridAppFX.prototype.receiveMessage = function(/* String */ messageID, /* Function */ onReceiveCallback) {
	var key = this.appID + "_" + messageID;
	if(HybridAppFX_funcMap[key]) {
		throw "Unable to receive a message twice with same messageID(" + messageID + ") in one instance.";
	}
	this.nativeInterface.registerMessage(this.appID, messageID);
	var _this = this;
	this.execute(key, function() {
		var payload = _this.nativeInterface.receiveMessage(_this.appID, messageID);
		if(payload == "") {
			return false;
		}
		var json = _this.fromJSON(payload);
		onReceiveCallback.call(_this, json);
		return false;
	});

	return true;
};

HybridAppFX.prototype.cancelMessage = function(/* String */ messageID) {
	var key = this.appID + "_" + messageID;
	if(HybridAppFX_funcMap[key]) {
		delete HybridAppFX_funcMap[key];
	}
	return this.nativeInterface.unregisterMessage(this.appID, messageID);
};

HybridAppFX.prototype.listenEvent = function(/* String */ eventID, /* Function */ eventHandler) {
	var key = this.appID + "_" + eventID;
	if(HybridAppFX_funcMap[key]) {
		throw "Unable to listen an event twice with same eventID(" + eventID + ") in one instance.";
	}
	this.nativeInterface.registerMessage(this.appID, eventID);
	var _this = this;
	this.execute(key, function() {
		var payload = _this.nativeInterface.receiveMessage(_this.appID, eventID);
		if(payload == "") {
			return false;
		}
		var json = _this.fromJSON(payload);
		eventHandler.call(_this, json);
		return false;
	});

	return true;
};

HybridAppFX.prototype.closeEvent = function(/* String */ eventID) {
	var key = this.appID + "_" + eventID;
	if(HybridAppFX_funcMap[key]) {
		delete HybridAppFX_funcMap[key];
	}
	return this.nativeInterface.unregisterMessage(this.appID, eventID);
};

HybridAppFX.prototype.saveData = function(/* String */ key, /* String */ value) {
	this.nativeInterface.saveData(key, value);
};

HybridAppFX.prototype.loadData = function(/* String */ key) {
	return this.nativeInterface.loadData(key);
};

HybridAppFX.prototype.jsonToString = function(json) {   
	return this.toJSON(json);
};
 
HybridAppFX.prototype.stringToJSON = function(str) {
	return this.fromJSON(str);
};

//Private Methods
HybridAppFX.prototype.fromJSON = function(/* String */ str) {
	return eval('(' + str + ')');
};

HybridAppFX.prototype.toJSON = function(/* Array || Object */ json) {
    var THIS = this;    
    switch(typeof(json)){   
        case "string":   
            return '"' + json.replace(/(["\\])/g, '\\$1') + '"';   
        case "array":   
            return '[' + json.map(THIS.toJSON).join(',') + ']';   
        case "object":   
            if(json instanceof Array) {   
                var strArr = [];   
                for(var i=0; i<json.length; i++){   
                    strArr.push(THIS.toJSON(json[i]));   
                }   
                return '[' + strArr.join(',') + ']';   
            }
            else if(json == null) {   
                return 'null';   
            }
            else {   
                var string = [];   
                for (var property in json) {
                	string.push(THIS.toJSON(property) + ':' + THIS.toJSON(json[property])); 
                }
                return '{' + string.join(',') + '}';   
            }   
        case "number":   
            return json;
        case "boolean":
        	return json;
        default:   
            return json;   
    } 
};

HybridAppFX.prototype.execute = function(/* String */ key, /* Function */ func) {
	HybridAppFX_funcMap[key] = func;
};

HybridAppFX.prototype.delayExecute = function(/* Function */ func) {
	var timer = setTimeout(function() {
		clearTimeout(timer);
		func.call(this);
	}, 100);
};

//HybridAppFX.prototype.callbackMap = {};
HybridAppFX.prototype.getCallbackID = function(key) {
	/*if(this.callbackMap[key] != undefined) {
		this.callbackMap[key]++;
	}
	else {
		this.callbackMap[key] = 0;
	}
	var callbackKey = key + this.callbackMap[key];*/
	var callbackKey = key + new Date().getTime() + "_" + (Math.random()*1000).toFixed(0);
	return callbackKey;
};
