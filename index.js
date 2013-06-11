
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var fs = require('fs');


function Watcher(opts) {
    EventEmitter.call(this);

    this.filter = opts && typeof opts.filter == 'function' && opts.filter || null;
    this.root = null;
    this.dir = null;
}
module.exports = Watcher;
Watcher.prototype = Object.create(EventEmitter.prototype);

Watcher.prototype.watch = function(dir, cb) {
    var self = this;
    this.root = dir;
    fs.stat(dir, function(err, stats) {
        if(err) {
            return cb(err);
        }
        if(stats.isDirectory()) {
            self.dir = new Dir(self, '.', stats);
        }
        else {
            cb(new Error("Root must be a directory"));
            //this.watch = fs.watch(file, onChange.bind(self, self.file = new File(self, path.join('.', path.basename(file)), stats)));
        }
    });
};

function onChange(src, event, filename) {
    var self = this;
    var file = filename === null && src.path || path.join(src.path, filename);
    fs.stat(path.join(self.root, file), function(err, stats) {
        var ev, _f = src.files[filename];
        if(err) {
            // file deleted
            if(err.code == 'ENOENT') {
                if(_f) {
                    if(_f instanceof Dir) {
                        _f.stop();
                    }
                    ev = new Event(_f.stats, file, null, null);
                    self.emit('delete', ev);
                    self.emit('any', 'delete', ev);
                }
                delete src.files[filename];
            }
            // error ?
            else {
                self.emit('error', err);
            }
        }
        // file created
        else if(event == 'rename') {
            if(_f === false) return;
            if((self.filter || defaultFilter).call(self, file, stats)) {
                if(stats.isDirectory()) {
                    src.files[filename] = new Dir(self, file, stats);
                }
                else {
                    src.files[filename] = new File(file, stats);
                }
                ev = new Event(null, null, stats, file);
                self.emit('change', ev);
                self.emit('any', 'change', ev);
            }
            else {
                src.files[filename] = false;
            }
        }
        // file changed
        else if(event == 'change' && _f) {
            ev = new Event(_f.stats, file, stats, file);
            _f.stats = stats;
            self.emit('change', ev);
            self.emit('any', 'change', ev);
        }
    });
}

function defaultFilter() {return true;}


function Event(oldStats, oldPath, newStats, newPath) {
    this.oldStats = oldStats;
    this.oldPath = oldPath;
    this.newStats = newStats;
    this.newPath = newPath;
}

function File(path, stats) {
    this.path = path;
    this.stats = stats;
}

function Dir(self, _path, stats) {
    File.call(this, _path, stats);
    this.root = self;
    this.watcher = fs.watch(path.join(self.root, _path), onChange.bind(self, this));
    this.files = {};
    // scan
    var dir = this;
    fs.readdir(path.join(self.root, _path), function(err, files) {
        if(err) {
            return self.emit('error', err);
        }
        files.forEach(function(file) {
            fs.stat(path.join(self.root, dir.path, file), function(err, stats) {
                if(err) {
                    return self.emit('error', err);
                }
                if((self.filter || defaultFilter).call(self, path.join(dir.path, file), stats)) {
                    if(stats.isDirectory()) {
                        dir.files[file] = new Dir(self, path.join(dir.path, file), stats);
                    }
                    else {
                        dir.files[file] = new File(path.join(dir.path, file), stats);
                    }
                }
                else {
                    dir.files[file] = false;
                }
            });
        });
    });
}
Dir.prototype = Object.create(File.prototype);

Dir.prototype.stop = function() {
    this.watcher.close();
    for(var file in this.files) {
        if(this.files[file] && this.files[file] instanceof Dir) {
            this.files[file].stop();
        }
    }
};

