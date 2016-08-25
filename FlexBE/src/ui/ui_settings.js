UI.Settings = new (function() {
	const {dialog} = require('electron').remote
	var that = this;

	var behaviors_folder_id;
	var be_folder_id;

	var rosbridge_running = false;
	var rosbridge_ip;
	var rosbridge_port;

	var runtime_timeout;
	var stop_behaviors;
	var collapse_info;
	var collapse_warn;
	var collapse_error;
	var collapse_hint;

	var package_namespace;
	var code_indentation;
	var transition_mode;
	var gridsize;
	var commands_enabled;
	var commands_key;

	var synthesis_enabled;
	var synthesis_topic;
	var synthesis_type;
	var synthesis_system;

	var storeSettings = function() {

		localStorage.setItem('settings', JSON.stringify({
			'behaviors_folder_id': behaviors_folder_id,
			'be_folder_id': be_folder_id,
			'rosbridge_ip': rosbridge_ip,
			'rosbridge_port': rosbridge_port,
			'runtime_timeout': runtime_timeout,
			'stop_behaviors': stop_behaviors,
			'collapse_info': collapse_info,
			'collapse_warn': collapse_warn,
			'collapse_error': collapse_error,
			'collapse_hint': collapse_hint,
			'package_namespace': package_namespace,
			'code_indentation': code_indentation,
			'transition_mode': transition_mode,
			'gridsize': gridsize,
			'commands_enabled': commands_enabled,
			'commands_key': commands_key,
			'synthesis_enabled': synthesis_enabled,
			'synthesis_topic': synthesis_topic,
			'synthesis_type': synthesis_type,
			'synthesis_system': synthesis_system
		}))
		displaySettingsHints();
	}


	this.restoreSettings = function(restored_callback) {
		var libFolders = JSON.parse(localStorage.getItem('libFolders'))
		if(null === libFolders) {
			libFolders = []
		}
		LibParser.restoreFolderList(libFolders, that.displayStateLibraryFolderEntry);

		var settings = JSON.parse(localStorage.getItem('settings'));
		if(null === settings) {
			settings = {
				'behaviors_folder_id': '',
				'be_folder_id': '',
				'rosbridge_ip': 'localhost',
				'rosbridge_port': '9090',
				'runtime_timeout': 10,
				'stop_behaviors': false,
				'collapse_info': true,
				'collapse_warn': true,
				'collapse_error': false,
				'collapse_hint': false,
				'package_namespace': '',
				'code_indentation': 0,
				'transition_mode': 1,
				'gridsize': 50,
				'commands_enabled': false,
				'commands_key': '',
				'synthesis_enabled': false,
				'synthesis_topic': '',
				'synthesis_type': 'flexbe_msgs/BehaviorSynthesisAction',
				'synthesis_system': ''
			}
		}

		behaviors_folder_id = settings.behaviors_folder_id;
		// TODO: behaviors_folder_id -> behaviors_folder_path
		document.getElementById("input_behaviors_folder").value = behaviors_folder_id;
		be_folder_id = settings.be_folder_id;
		document.getElementById("input_be_folder").value = be_folder_id;

		rosbridge_ip = settings.rosbridge_ip;
		document.getElementById("input_rosbridge_ip").value = settings.rosbridge_ip;
		rosbridge_port = settings.rosbridge_port;
		document.getElementById("input_rosbridge_port").value = settings.rosbridge_port;

		runtime_timeout = settings.runtime_timeout;
		document.getElementById("input_runtime_timeout").value = settings.runtime_timeout;
		stop_behaviors = settings.stop_behaviors;
		document.getElementById("cb_stop_behaviors").checked = settings.stop_behaviors;
		collapse_info = settings.collapse_info;
		document.getElementById("cb_collapse_info").checked = settings.collapse_info;
		collapse_warn = settings.collapse_warn;
		document.getElementById("cb_collapse_warn").checked = settings.collapse_warn;
		collapse_error = settings.collapse_error;
		document.getElementById("cb_collapse_error").checked = settings.collapse_error;
		collapse_hint = settings.collapse_hint;
		document.getElementById("cb_collapse_hint").checked = settings.collapse_hint;

		package_namespace = settings.package_namespace;
		document.getElementById("input_package_namespace").value = settings.package_namespace;
		code_indentation = settings.code_indentation;
		document.getElementById("select_code_indentation").selectedIndex = settings.code_indentation;
		transition_mode = settings.transition_mode;
		document.getElementById("select_transition_mode").selectedIndex = settings.transition_mode;
		gridsize = settings.gridsize;
		document.getElementById("input_gridsize").value = settings.gridsize;
		commands_enabled = settings.commands_enabled;
		document.getElementById("cb_commands_enabled").checked = settings.commands_enabled;
		commands_key = settings.commands_key;
		document.getElementById("input_commands_key").value = settings.commands_key;

		synthesis_enabled = settings.synthesis_enabled;
		document.getElementById("cb_synthesis_enabled").checked = settings.synthesis_enabled;
		synthesis_topic = settings.synthesis_topic;
		document.getElementById("input_synthesis_topic").value = settings.synthesis_topic;
		synthesis_type = settings.synthesis_type;
		document.getElementById("input_synthesis_type").value = settings.synthesis_type;
		synthesis_system = settings.synthesis_system;
		document.getElementById("input_synthesis_system").value = settings.synthesis_system;
		updateSynthesisInterface();

		Behaviorlib.parseLib();

		if (restored_callback != undefined)
			restored_callback();

		displaySettingsHints();
	}

	var displaySettingsHints = function() {
		if (behaviors_folder_id == '') {
			var button_el = document.getElementById('button_behaviors_chooser');
			var hint = button_el.parentNode.parentNode.getAttribute('title');
			var action_el = document.createElement('input');
			action_el.setAttribute('type', "button");
			action_el.setAttribute('value', "Choose behaviors folder...");
			action_el.addEventListener('click', function() {
				UI.Menu.toSettingsClicked();
				that.behaviorsChooserClicked();
			});
			UI.Feed.displayCustomMessage('msg_behaviors_folder_id', 1, 'Required setting missing!', 'No behaviors folder configured:<br /><i>' + hint + '</i><br />', action_el);
		} else {
			var msg = document.getElementById('msg_behaviors_folder_id');
			if (msg != undefined) msg.parentNode.removeChild(msg);
		}
		if (be_folder_id == '') {
			var button_el = document.getElementById('button_be_chooser');
			var hint = button_el.parentNode.parentNode.getAttribute('title');
			var action_el = document.createElement('input');
			action_el.setAttribute('type', "button");
			action_el.setAttribute('value', "Set flexbe_behaviors folder...");
			action_el.addEventListener('click', function() {
				UI.Menu.toSettingsClicked();
				that.beChooserClicked();
			});
			UI.Feed.displayCustomMessage('msg_be_folder_id', 1, 'Required setting missing!', 'No flexbe_behaviors folder configured:<br /><i>' + hint + '</i><br />', action_el);
		} else {
			var msg = document.getElementById('msg_be_folder_id');
			if (msg != undefined) msg.parentNode.removeChild(msg);
		}
		var libFolders = localStorage.getItem('libFolders')
		if(null === libFolders) {
			libFolders = []
		}
		if (libFolders.length == 0) {
			var action_el = document.createElement('input');
			action_el.setAttribute('type', "button");
			action_el.setAttribute('value', "Go to Configuration");
			action_el.addEventListener('click', function() {
				UI.Menu.toSettingsClicked();
			});
			UI.Feed.displayCustomMessage('msg_empty_statelib', 1, 'No states known', 'The list of available states is empty. You can add folders to the State Library.<br />', action_el);
		} else {
			var msg = document.getElementById('msg_empty_statelib');
			if (msg != undefined) msg.parentNode.removeChild(msg);
		}
	}

	this.importConfiguration = function() {
		var dialog_options = {
			properties: ['openFile', 'createDirectory'],
			filters: [
				{name: 'Configuration (.json)', extensions: ['json']}
			]
		}
		dialog.showOpenDialog(dialog_options, function (file_paths) {
			if (file_paths == undefined) return
			filename = file_paths[0]
			UI.Panels.setActivePanel(UI.Panels.NO_PANEL);
			Filesystem.getFileContent(filename, 'utf-8', (err, content) => {
				if(err) {
					T.logError(err)
					return
				}

				console.log(JSON.parse(content));
				localStorage.setItem('settings', content);
				document.getElementById('state_library_folder_table').innerHTML = "";
				that.restoreSettings();
			});
		});
	}

	this.exportConfiguration = function() {
		var dialog_options = {
			defaultPath: 'flexbe_config.json',
			filters: [
				{name: 'Configuration (.json)', extensions: ['json']}
			]
		};
		dialog.showSaveDialog(dialog_options, function (filename) {
			var config = JSON.parse(localStorage.getItem('settings'));
			var content = JSON.stringify(config, null, 2);

			Filesystem.createFile(filename, content, (err) => {
				if(err) {
					T.logError(err);
					T.logError('Exporting configuration failed');
				} else
					console.log('Configuration saved to ' + filename);
			})
		});
	}


	// Statelib
	//==========

	this.addStateFolderClicked = function() {
		LibParser.addLibFolder(UI.Settings.displayStateLibraryFolderEntry);
	}

	this.applyStateLibraryClicked = function() {
		LibParser.parseLibFolders();
		displaySettingsHints();
	}

	this.displayStateLibraryFolderEntry = function(path) {
			if (path == undefined) return
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
		dialog.showOpenDialog({properties: ['openDirectory']}, function (folder_paths) {
			if (folder_paths == undefined) return
			path = folder_paths[0]
			behaviors_folder_id = path
			document.getElementById("input_behaviors_folder").value = path;
			storeSettings();
			Behaviorlib.parseLib();
		});
	}

	this.beChooserClicked = function() {
		dialog.showOpenDialog({properties: ['openDirectory']}, function (folder_paths) {
			if (folder_paths == undefined) return
			path = folder_paths[0]
			be_folder_id = path
			document.getElementById("input_be_folder").value = path;
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

	this.stopBehaviorsClicked = function(evt) {
		stop_behaviors = evt.target.checked;
		storeSettings();
	}

	this.collapseInfoClicked = function(evt) {
		collapse_info = evt.target.checked;
		storeSettings();
	}

	this.collapseWarnClicked = function(evt) {
		collapse_warn = evt.target.checked;
		storeSettings();
	}

	this.collapseErrorClicked = function(evt) {
		collapse_error = evt.target.checked;
		storeSettings();
	}

	this.collapseHintClicked = function(evt) {
		collapse_hint = evt.target.checked;
		storeSettings();
	}

	this.isStopBehaviors = function() {
		return stop_behaviors;
	}

	this.isCollapseInfo = function() { return collapse_info; }
	this.isCollapseWarn = function() { return collapse_warn; }
	this.isCollapseError = function() { return collapse_error; }
	this.isCollapseHint = function() { return collapse_hint; }


	// Editor
	//========

	this.packageNamespaceChanged = function() {
		var el = document.getElementById('input_package_namespace');
		package_namespace = el.value;
		storeSettings();
	}

	this.codeIndentationChanged = function() {
		var el = document.getElementById('select_code_indentation');
		code_indentation = el.selectedIndex;
		console.log('Set to: '+code_indentation);
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

	this.getCodeIndentation = function() {
		console.log('code indentation: '+code_indentation);
		var chars = ['\t', '  ', '    ', '        '];
		return chars[code_indentation];
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
