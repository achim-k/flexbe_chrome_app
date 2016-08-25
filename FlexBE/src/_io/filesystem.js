Filesystem = new (function() {
	const fs = require('fs');
	const path = require('path');

	this.createFile = fs.writeFile;			// fs.writeFile(file, data[, options], callback)							(err) => {}
	this.getFileContent = fs.readFile		// fs.readFile(file[, options], callback)  										(err, data) => {}
	this.getFolderContent = fs.readdir	// fs.readdir(path[, options], callback)											(err, files) => {}

	this.getFileName = (filename, extension) => {
		if(extension)
		return path.parse(filename).base
		return path.parse(filename).name
	}

	// from http://lmws.net/making-directory-along-with-missing-parents-in-node-js
	this.createFolder = (folder, callback) => {
		//Call the standard fs.mkdir
		fs.mkdir(folder, (err) => {
			//When it fail in this way, do the custom steps
			if (err && err.code === 'ENOENT') {
				//Create all the parents recursively
				this.createFolder(path.dirname(folder, callback));
				//And then the directory
				this.createFolder(folder, callback);
				return
			}
			//Manually run the callback since we used our own callback to do all these
			callback && callback(error);
		});
	};

	this.checkFolderExists = (path, callback) => {
		fs.stat(path, (err, stats) => {
			if(err)
				callback(false)
			else
				callback(stats.isDirectory())
		})
	}

	this.checkFileExists = (path, callback) => {
		fs.stat(path, (err, stats) => {
			if(err)
				callback(false)
			else
				callback(stats.isFile())
		})
	}

	this.isDirectory = (path) => {
		try {
			return fs.statSync(path).isDirectory();
		} catch (e) {
			return false
		}
	}

}) ();
