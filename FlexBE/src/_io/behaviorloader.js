BehaviorLoader = new (function() {
	const path = require('path');
	var that = this;

	var parseCode = function(file_content, manifest_data) {
		var parsingResult;
		try {
			parsingResult = CodeParser.parseCode(file_content);
			T.logInfo("Code parsing completed.");
		} catch (err) {
			T.logError("Code parsing failed: " + err);
			return;
		}
		applyParsingResult(parsingResult, manifest_data);
		T.logInfo("Behavior " + parsingResult.behavior_name + " loaded.");

		var error_string = Checking.checkBehavior();
		if (error_string != undefined) {
			T.logError("The loaded behavior contains errors! Please fix and save:");
			T.logError(error_string);
			RC.Controller.signalChanged();
		}
	}

	var applyParsingResult = function(result, manifest) {
		ModelGenerator.generateBehaviorAttributes(result, manifest);

		T.logInfo("Building behavior state machine...");
		var sm = ModelGenerator.buildStateMachine("", result.root_sm_name, result.sm_defs, result.sm_states);
		Behavior.setStatemachine(sm);
		UI.Statemachine.resetStatemachine();
		T.logInfo("Behavior state machine built.");

		ActivityTracer.resetActivities();
	}

	var resetEditor = function() {
		Behavior.resetBehavior();
		UI.Dashboard.resetAllFields();
		UI.Statemachine.resetStatemachine();

		// make sure a new behavior always starts at the dashboard
		UI.Menu.toDashboardClicked();
		UI.Panels.setActivePanel(UI.Panels.NO_PANEL);
	}

	this.loadBehavior = function(manifest) {
		T.clearLog();
		UI.Panels.Terminal.show();

		resetEditor();

		if (UI.Settings.getBEFolderID() == '') {
			console.log('Unable to load behavior: No flexbe_behaviors folder set!');
			return;
		}

		var behaviors_folder_path = UI.Settings.getBehaviorsFolderID();
		folder = path.join(behaviors_folder_path, manifest.rosnode_name, 'src', manifest.rosnode_name);
		Filesystem.getFileContent(path.join(folder, manifest.codefile_name), 'utf-8', (err, content) => {
			if(err) {
				T.logError(err)
				return
			}
			T.logInfo("Parsing sourcecode...");
			parseCode(content, manifest);
		});
	}

	this.loadBehaviorInterface = function(manifest, callback) {
		if (UI.Settings.getBEFolderID() == '') {
			console.log('Unable to load behavior interface: No flexbe_behaviors folder set!');
			return;
		}

		var behaviors_folder_path = UI.Settings.getBehaviorsFolderID();
		folder = path.join(behaviors_folder_path, manifest.rosnode_name, 'src', manifest.rosnode_name);
		Filesystem.getFileContent(path.join(folder, manifest.codefile_name), 'utf-8', (err, content) => {
			if(err) {
				T.logError(err)
				return
			}

			try {
				var parsingResult = CodeParser.parseSMInterface(content);
				callback(parsingResult);
			} catch (err) {
				T.logError("Failed to parse behavior interface of " + manifest.name + ": " + err);
				return;
			}
		});
	}

	this.parseBehaviorSM = function(manifest, callback) {
		if (UI.Settings.getBEFolderID() == '') {
			console.log('Unable to parse behavior statemachine: No flexbe_behaviors folder set!');
			return;
		}

		var behaviors_folder_path = UI.Settings.getBehaviorsFolderID();
		folder = path.join(behaviors_folder_path, manifest.rosnode_name, 'src', manifest.rosnode_name);
		Filesystem.getFileContent(path.join(folder, manifest.codefile_name), 'utf-8', (err, content) => {
			if(err) {
				T.logError(err)
				return
			}

			console.log("Preparing sourcecode of behavior " + manifest.name + "...");
			try {
				parsingResult = CodeParser.parseCode(content);
			} catch (error) {
				console.log("Code parsing failed: " + error);
				return;
			}
			callback({
				container_name: "",
				container_sm_var_name: parsingResult.root_sm_name,
				sm_defs: parsingResult.sm_defs,
				sm_states: parsingResult.sm_states
			});
		});
	}

	this.parseBehaviorList = function(callback) {
		var updateCounter = function() {
			todo_counter--;
			if (todo_counter == 0) callback(be_list);
		};

		var todo_counter = 0;
		var be_list = []; // {name, description, filename}

		if (UI.Settings.getBEFolderID() == '') {
			console.log('Unable to parse behavior list: No flexbe_behaviors folder set!');
			return;
		}

		var be_folder_path = path.join(UI.Settings.getBEFolderID(), 'behaviors');

		Filesystem.getFolderContent(be_folder_path, (err, entries) => {
			if(err) {
				T.logError(err)
				T.logError("Can't open folder '" + be_folder_path + "'")
				return
			}

			todo_counter = entries.length;
			entries.sort().forEach(function(entry, i) {
				if(!Filesystem.isDirectory(entry)) {
					var filename = entry;
					if (!filename.endsWith(".xml") || filename[0] == '#') {
						updateCounter();
						return;
					}

					Filesystem.getFileContent(path.join(be_folder_path, filename), 'utf-8', (err, content) => {
						if(err) {
							T.logError(err)
							updateCounter()
							return
						}

						var manifest = ManifestParser.parseManifest(content);
						manifest.filename = filename;
						be_list.push(manifest);
						updateCounter();
					});
				} else {
					updateCounter();
				}
			});
		});
	}

}) ();
