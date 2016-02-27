UI.Settings = new (function() {
	var that = this;

	var behaviors_folder_id;
	var be_folder_id;

	var rosbridge_running = false;
	var rosbridge_ip;
	var rosbridge_port;

	var runtime_timeout;

	var package_namespace;
	var transition_mode;
	var gridsize;
	var commands_enabled;
	var commands_key;

	var synthesis_enabled;
	var synthesis_topic;
	var synthesis_type;
	var synthesis_system;

	var storeSettings = function() {
		chrome.storage.local.set({
			'behaviors_folder_id': behaviors_folder_id,
			'be_folder_id': be_folder_id,
			'rosbridge_ip': rosbridge_ip,
			'rosbridge_port': rosbridge_port,
			'runtime_timeout': runtime_timeout,
			'package_namespace': package_namespace,
			'transition_mode': transition_mode,
			'gridsize': gridsize,
			'commands_enabled': commands_enabled,
			'commands_key': commands_key,
			'synthesis_enabled': synthesis_enabled,
			'synthesis_topic': synthesis_topic,
			'synthesis_type': synthesis_type,
			'synthesis_system': synthesis_system
		});
	}


	this.restoreSettings = function(restored_callback) {
		chrome.storage.local.get({libFolders: []}, function(items) { 
			LibParser.restoreFolderList(items.libFolders, that.displayStateLibraryFolderEntry);
		});

		chrome.storage.local.get({
			'behaviors_folder_id': '',
			'be_folder_id': '',
			'rosbridge_ip': 'localhost',
			'rosbridge_port': '9090',
			'runtime_timeout': 10,
			'package_namespace': '',
			'transition_mode': 1,
			'gridsize': 50,
			'commands_enabled': false,
			'commands_key': '',
			'synthesis_enabled': false,
			'synthesis_topic': '',
			'synthesis_type': 'flexbe_msgs/BehaviorSynthesisAction',
			'synthesis_system': ''
		}, function(items) {
			behaviors_folder_id = items.behaviors_folder_id;
			chrome.fileSystem.restoreEntry(items.behaviors_folder_id, function(entry) {
				chrome.fileSystem.getDisplayPath(entry, function(path) {
					document.getElementById("input_behaviors_folder").value = path;
				});
			});
			be_folder_id = items.be_folder_id;
			chrome.fileSystem.restoreEntry(items.be_folder_id, function(entry) {
				chrome.fileSystem.getDisplayPath(entry, function(path) {
					document.getElementById("input_be_folder").value = path;
				});
			});

			rosbridge_ip = items.rosbridge_ip;
			document.getElementById("input_rosbridge_ip").value = items.rosbridge_ip;
			rosbridge_port = items.rosbridge_port;
			document.getElementById("input_rosbridge_port").value = items.rosbridge_port;
			
			runtime_timeout = items.runtime_timeout;
			document.getElementById("input_runtime_timeout").value = items.runtime_timeout;
			
			package_namespace = items.package_namespace;
			document.getElementById("input_package_namespace").value = items.package_namespace;
			transition_mode = items.transition_mode;
			document.getElementById("select_transition_mode").selectedIndex = items.transition_mode;
			gridsize = items.gridsize;
			document.getElementById("input_gridsize").value = items.gridsize;
			commands_enabled = items.commands_enabled;
			document.getElementById("cb_commands_enabled").checked = items.commands_enabled;
			commands_key = items.commands_key;
			document.getElementById("input_commands_key").value = items.commands_key;

			synthesis_enabled = items.synthesis_enabled;
			document.getElementById("cb_synthesis_enabled").checked = items.synthesis_enabled;
			synthesis_topic = items.synthesis_topic;
			document.getElementById("input_synthesis_topic").value = items.synthesis_topic;
			synthesis_type = items.synthesis_type;
			document.getElementById("input_synthesis_type").value = items.synthesis_type;
			synthesis_system = items.synthesis_system;
			document.getElementById("input_synthesis_system").value = items.synthesis_system;
			updateSynthesisInterface();
			
			if (restored_callback != undefined)
				restored_callback();
		});
	}


	// Statelib
	//==========

	this.addStateFolderClicked = function() {
		LibParser.addLibFolder(UI.Settings.displayStateLibraryFolderEntry);
	}

	this.applyStateLibraryClicked = function() {
		LibParser.parseLibFolders();
	}

	this.displayStateLibraryFolderEntry = function(path_id) {
		chrome.fileSystem.restoreEntry(path_id, function(entry) {
			chrome.fileSystem.getDisplayPath(entry, function(path) {
				var removeButton = document.createElement("input");
				removeButton.type = "button";
				removeButton.value = "-";
				removeButton.addEventListener('click', function() {
					console.log("Remove " + path_id);
					LibParser.removeLibFolder(path_id);
					var table_row = this.parentNode.parentNode;
					table_row.parentNode.removeChild(table_row);
				});
				var table_row = document.createElement("tr");
				var remove_cell = document.createElement("td");
				var text_cell = document.createElement("td");
				text_cell.style.width = "100%";
				var path_label = document.createElement("input");
				path_label.type = "text";
				path_label.value = path;
				path_label.style.width = "100%";
				path_label.setAttribute("readonly", "readonly");

				text_cell.appendChild(path_label);
				remove_cell.appendChild(removeButton);
				table_row.appendChild(remove_cell);
				table_row.appendChild(text_cell);
				document.getElementById('state_library_folder_table').appendChild(table_row);
			});
		});
	}


	// Workspace
	//===========

	this.applyWorkspaceFolders = function(behaviors, be) {

	}

	this.applyWorkspaceFoldersClicked = function() {
		that.applyWorkspaceFolders(
			document.getElementById("input_behaviors_folder").value,
			document.getElementById("input_be_folder").value
		);
	}

	this.behaviorsChooserClicked = function() {
		chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function(entry) {
			if (entry == undefined) {
				console.log(runtime.lastError);
				return;
			}
			behaviors_folder_id = chrome.fileSystem.retainEntry(entry);
			chrome.fileSystem.getDisplayPath(entry, function(path) {
				document.getElementById("input_behaviors_folder").value = path;
			});
			storeSettings();
			Behaviorlib.parseLib();
		});
	}

	this.beChooserClicked = function() {
		chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function(entry) {
			if (entry == undefined) return;
			be_folder_id = chrome.fileSystem.retainEntry(entry);
			chrome.fileSystem.getDisplayPath(entry, function(path) {
				document.getElementById("input_be_folder").value = path;
			});
			storeSettings();
			Behaviorlib.parseLib();
		});
	}

	this.getBehaviorsFolderID = function() {
		return behaviors_folder_id;
	}

	this.getBEFolderID = function() {
		return be_folder_id;
	}


	// RosBridge
	//===========

	this.rosbridgeIPChanged = function() {
		rosbridge_ip = document.getElementById("input_rosbridge_ip").value;
		storeSettings();
	}

	this.rosbridgePortChanged = function() {
		rosbridge_port = document.getElementById("input_rosbridge_port").value;
		storeSettings();
	}

	this.connectRosbridgeClicked = function() {
		if (rosbridge_running) return;

		RC.ROS.trySetupConnection();
	}

	this.disconnectRosbridgeClicked = function() {
		if (!rosbridge_running) return;

		RC.ROS.closeConnection();
	}

	this.getRosbridgeIP = function() {
		return rosbridge_ip;
	}
	this.getRosbridgePort = function() {
		return rosbridge_port;
	}

	this.updateRosbridgeStatus = function(running) {
		rosbridge_running = running;

		document.getElementById("button_rosbridge_connect").disabled = running;
		document.getElementById("button_rosbridge_disconnect").disabled = !running;
	}


	// Runtime
	//=========

	this.runtimeTimeoutChanged = function() {
		runtime_timeout = document.getElementById("input_runtime_timeout").value;
		RC.Controller.onboardTimeout = runtime_timeout;
		storeSettings();
	}


	// Editor
	//========

	this.packageNamespaceChanged = function() {
		var el = document.getElementById('input_package_namespace');
		package_namespace = el.value;
		storeSettings();
	}

	this.transitionEndpointsChanged = function() {
		var el = document.getElementById('select_transition_mode');
		transition_mode = el.selectedIndex;
		storeSettings();
	}

	this.gridsizeChanged = function() {
		var el = document.getElementById('input_gridsize');
		gridsize = parseInt(el.value);
		storeSettings();
	}

	this.commandsEnabledClicked = function(evt) {
		commands_enabled = evt.target.checked;
		storeSettings();
	}

	this.commandsKeyChanged = function() {
		var el = document.getElementById('input_commands_key');
		commands_key = el.value;
		storeSettings();
	}

	this.getPackageNamespace = function() {
		return package_namespace;
	}

	this.isTransitionModeCentered = function() {
		return transition_mode == 0;
	}

	this.isTransitionModeCombined = function() {
		return transition_mode == 2;
	}

	this.getGridsize = function() {
		return gridsize;
	}

	this.isCommandsEnabled = function() {
		return commands_enabled;
	}

	this.getCommandsKey = function() {
		return commands_key;
	}


	// Synthesis
	//===========

	this.synthesisEnabledClicked = function(evt) {
		synthesis_enabled = evt.target.checked;
		storeSettings();
		updateSynthesisInterface();
	}

	this.synthesisTopicChanged = function() {
		var el = document.getElementById('input_synthesis_topic');
		synthesis_topic = el.value;
		storeSettings();
	}

	this.synthesisTypeChanged = function() {
		var el = document.getElementById('input_synthesis_type');
		synthesis_type = el.value;
		storeSettings();
	}

	this.synthesisSystemChanged = function() {
		var el = document.getElementById('input_synthesis_system');
		synthesis_system = el.value;
		storeSettings();
	}

	this.isSynthesisEnabled = function() {
		return synthesis_enabled;
	}

	this.getSynthesisTopic = function() {
		return synthesis_topic;
	}

	this.getSynthesisType = function() {
		return synthesis_type;
	}

	this.getSynthesisSystem = function() {
		return synthesis_system;
	}

	var updateSynthesisInterface = function() {
		if (synthesis_enabled) {
			document.getElementById('synthesis_display_option').style.display = "inline";
			if (RC.ROS.isConnected()) {
				RC.PubSub.initializeSynthesisAction();
			}
		} else {
			document.getElementById('synthesis_display_option').style.display = "none";
		}
	}

}) ();