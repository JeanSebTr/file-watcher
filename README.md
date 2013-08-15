# file-watcher

Modern file watcher for nodejs

- Watch a directory and his subdirectories for changes
- Filter method to exclude files or directories

## Installation

```sh
npm install file-watcher
```

## Usage

```javascript

var Watcher = require('file-watcher');

var watcher = new Watcher({
    root: __dirname,
    filter: function(filename, stats) {
        // only watch those files
        if(filename.indexOf('.styl') != -1) {
            return true;
        }
        else {
            return false;
        }
    }
});

watcher.on('...', function() { /* Watcher is an EventEmitter */ });

watcher.watch(__dirname, function(err){
    if (err){
        console.log(err);
    }
});

```

### _constructor_ new Watcher(opts)

- opts.root : _Directory to watch_
- opts.filter : _callback to filter filename or by [fs.Stat][fs.Stat]_

### _callback_ filter(filename, stats)

- filename : _filename relative to the root of the watched tree_
- stats : _a [fs.Stat][fs.Stat] object_

Return __true__ to include this file or directory and their children.
Return __false__ to exclude them.

### _method_ watcher.watch()

Start watching the directory tree

### _event_ create (event)

- event.oldStats : _null_
- event.oldPath : _null_
- event.newStats : _a [fs.Stat][fs.Stat] object_
- event.newPath : _created filename relative to the root of the watched tree_

### _event_ change (event)

- event.oldStats : _last [fs.Stat][fs.Stat] object_
- event.oldPath : _current filename relative to the root of the watched tree_
- event.newStats : _current [fs.Stat][fs.Stat] object_
- event.newPath : _current filename relative to the root of the watched tree_

### _event_ delete (event)

- event.oldStats : _last [fs.Stat][fs.Stat] object_
- event.oldPath : _deleted filename relative to the root of the watched tree_
- event.newStats : _null_
- event.newPath : _null_

### _event_ any (type, event)

- type : _event type_
- event : _see corresponding event type_

### _event_ error (err)

- err : _unhandled error_

## TODOs

- Add unit tests
- Handle rename
- ?

## History

- 2013-06-11 : first working version

[fs.Stat]: http://nodejs.org/api/fs.html#fs_class_fs_stats
