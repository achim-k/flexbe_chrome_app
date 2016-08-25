BehaviorSaver = new (function() {
	const path = require('path')
	var that = this;

	var names;

	var completed_counter = 0;

	var storeBehaviorCode = function(generated_code) {

		var writeFile = (filename, content) => {
			Filesystem.createFile(filename, content, (err) => {
				if(!err) {
					saveSuccessCallback();
				} else {
					T.logError(err);
				}
			});
		}

		var create_callback = function(folder) {
			if(!Filesystem.isDirectory(folder)) {
				Filesystem.createFolder(folder, (err) => {
					if(!err) {
						writeFile(path.join(folder, names.file_name), generated_code);
					} else {
						T.logError(err);
					}
				});
			} else {
				writeFile(path.join(folder, names.file_name), generated_code);
			}
		};

		folder = path.join(UI.Settings.getBehaviorsFolderID(), names.rosnode_name, 'src', names.rosnode_name);
		if (RC.Controller.isConnected()) {
			Filesystem.checkFileExists(path.join(folder, names.file_name_tmp), function(exists) {
				if (!exists) {
					Filesystem.getFileContent(path.join(folder, names.file_name), 'utf-8', (err, content_onboard) => {
						if(err) {
							T.logError(err)
							return
						}
						Filesystem.createFile(path.join(folder, names.file_name_tmp), content_onboard, (err) => {
							if(err) {
								T.logError(err)
								return
							}
							create_callback(folder);
						});
					});
				} else {
					create_callback(folder);
				}
			});
		} else {
			create_callback(folder);
		}
	}

	var createBehaviorFolder = function(wfe, create_cb) {
		dir = path.join(wfe, names.rosnode_name);
		code_dir = path.join(dir, 'src', names.rosnode_name);

		Filesystem.createFile(path.join(code_dir, "__init__.py"), "", (err) => {
			if(err) {
				T.logError(err)
				return
			}
			create_cb(code_dir);
		});

		Filesystem.createFile(path.join(dir, "package.xml"), PackageGenerator.generatePackageXML(), (err) => {
			if(err) {
				T.logError(err)
				return
			}
			T.logInfo("Created package.xml");
		});
		Filesystem.createFile(path.join(dir, "CMakeLists.txt"), PackageGenerator.generateCMake(), (err) => {
			if(err) {
				T.logError(err)
				return
			}
			T.logInfo("Created CMakeLists.txt");
		});
		Filesystem.createFile(path.join(dir, "setup.py"), PackageGenerator.generateSetupPy(), (err) => {
			if(err) {
				T.logError(err)
				return
			}
			T.logInfo("Created setup.py");
		});
	};

	var storeBehaviorManifest = function(generated_manifest) {
		dir = path.join(UI.Settings.getBEFolderID(), 'behaviors');
		Filesystem.createFile(path.join(dir, names.rosnode_name + ".xml"), generated_manifest, (err) => {
			if(err) {
				handleError(err);
			} else {
				saveSuccessCallback();
			}
		});
	}

	var addBehaviorDependency = function() {
		Filesystem.getFileContent(path.join(UI.Settings.getBEFolderID(), "package.xml"), 'utf-8', (err, content) => {
			if(err) {
				T.logError(err)
				return
			}
			if (content.indexOf("<run_depend>" + names.rosnode_name + "</run_depend>") > 0) {
				T.logInfo("flexbe_behaviors already has dependency");
				saveSuccessCallback();
				return;
			}
			content_split = content.split('</run_depend>');
			content_split[content_split.length - 1] = "\n  <run_depend>" + names.rosnode_name + "</run_depend>" + content_split[content_split.length - 1];
			content = content_split.join('</run_depend>');
			Filesystem.createFile(path.join(entry, "package.xml"), content, (err) => {
				if(err) {
					T.logError(err)
					return
				}
				T.logInfo("Added dependency to flexbe_behaviors");
				saveSuccessCallback();
			});
		});
	}

	var handleError = function(error_msg) {
		T.logError("Behavior saving failed: " + error_msg);
	}

	var saveSuccessCallback = function() {
		completed_counter -= 1;
		if (completed_counter == 0) {
			T.logInfo("Save successful!");
			UI.Panels.Terminal.hide();
			Behaviorlib.parseLib();
			UI.Tools.notifyRosCommand('save');
		}
		var scedit = document.getElementById("behavior_sourcecode_edit");
		var n = Behavior.createNames();
		scedit.setAttribute("cmd", 'rosed ' + n.rosnode_name + ' ' + n.file_name+ '\n');
		scedit.style.display = "block";
	}


	this.saveStateMachine = function() {
		T.clearLog();
		UI.Panels.Terminal.show();

		var perform_save = function() {
			// generate sourcecode
			var generated_code = "";
			//try {
				generated_code = CodeGenerator.generateBehaviorCode();
				T.logInfo("Code generation completed.");
			//} catch (err) {
			//	T.logError("Code generation failed: " + err);
			//	return;
			//}

			// generate manifest
			var generated_manifest = "";
			//try {
				generated_manifest = ManifestGenerator.generateManifest();
				T.logInfo("Manifest generation completed.");
			//} catch (err) {
			//	T.logError("Manifest generation failed: " + err);
			//	return;
			//}

			// store in file
			completed_counter = 3;
			storeBehaviorCode(generated_code);
			storeBehaviorManifest(generated_manifest);
			addBehaviorDependency();
		}

		names = Behavior.createNames();
		folder = path.join(UI.Settings.getBehaviorsFolderID(), names.rosnode_name, 'src', names.rosnode_name)
		Filesystem.checkFileExists(path.join(folder, names.file_name), function(exists) {
			if (exists) {
				Filesystem.getFileContent(path.join(folder, names.file_name), 'utf-8', (err, content) => {
					if(err) {
						T.logError(err)
						return
					}
					var extract_result = CodeParser.extractManual(content);
					Behavior.setManualCodeImport(extract_result.manual_import);
					Behavior.setManualCodeInit(extract_result.manual_init);
					Behavior.setManualCodeCreate(extract_result.manual_create);
					Behavior.setManualCodeFunc(extract_result.manual_func);
					perform_save();
				});
			} else {
				perform_save();
			}
		});
	}

}) ();
