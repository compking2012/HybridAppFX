//Fake functions
window.fake_external = {};

window.fake_external.allocate = function() {
	return new Date().getTime();
};

window.fake_external.unallocate = function(appID) {
	return true;
};

window.fake_external.invokeSync = function(appID, serviceName, parameters) {
	parameters = eval('(' + parameters + ')');
	var result = "";
	if(serviceName == "addNumbers") {
		result = parameters[0] + parameters[1];
	}
	//console.debug("Invoke sync:", appID, serviceName, parameters);
	return result;
};

window.fake_external.invokeAsync = function(appID, messageID, serviceName, parameters, funcID) {
	parameters = eval('(' + parameters + ')');
	var result = "";
	if(serviceName == "addNumbers") {
		result = parameters[0] + parameters[1];
	}
	else if(serviceName == "addMoreNumbers") {
		var sum = 0;
		for(var i=0; i<parameters.length; i++) {
			sum += parameters[i];
			window.fake_external.sendMessage(appID, "NUMBER_ADDING_EVENT", parameters[i]);
		}
		result = sum;
	}
	//console.debug("Invoke async:", appID, serviceName, parameters, funcID);
	window.fake_external.sendMessage(appID, messageID, result);
	return true;
};

window.fake_external.registerMessage = function(appID, messageID) {
	return true;
};

window.fake_external.unregisterMessage = function(appID, messageID) {
	return true;
};

window.fake_external.messageQueue = [];
window.fake_external.sendMessage = function(appID, messageID, parameters) {
	window.fake_external.messageQueue.push({
		appID: appID, 
		messageID: messageID,
		parameters: parameters
	});
	return true;
};

window.fake_external.receiveMessage = function(appID, messageID) {
	for(var i=0; i<window.fake_external.messageQueue.length; i++) {
		var item = window.fake_external.messageQueue[i];
		if(item.appID == appID && item.messageID == messageID) {
			window.fake_external.messageQueue.splice(i, 1);
			return item.parameters;
		}
	}
	return "";
};

window.fake_external.storageData = {};
window.fake_external.loadData = function(key) {
	return window.fake_external.storageData[key];
};

window.fake_external.saveData = function(key, value) {
	window.fake_external.storageData[key] = value;
};