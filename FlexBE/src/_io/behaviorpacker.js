BehaviorPacker = new (function() {
	const path = require('path')
	var that = this;

	this.loadBehaviorCode = function(callback) {
		var names = Behavior.createNames();
		var src_dir = path.join(UI.Settings.getBehaviorsFolderID(), names.rosnode_name, 'src')
		var filename = path.join(src_dir, names.rosnode_name, names.file_name)

		Filesystem.getFileContent(filename, 'utf-8', callback)
	}

}) ();
