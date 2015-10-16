# perfy

A simple, light-weight NodeJS utility for measuring code execution in high-resolution real times.

> Version: 1.1.0  
> Author: Onur Yıldırım (onury) © 2015  
> Licensed under the MIT License.  

## Installation

```sh
    npm install perfy --save
```

## Usage

Simple. Just call `perfy.start('unique-name')` and the performance instance will be created and start time will be set until you call `perfy.end('unique-name')` which returns a result object containing the high-res elapsed time information (and destroys the created instance).

```js
    var perfy = require('perfy');

    perfy.start('loop-stuff');
    // some heavy stuff here...
    var result = perfy.end('loop-stuff');
    console.log(result.summary); // —> loop-stuff: 1.459 sec.
```
... or you could:
```js
    perfy.exec('loop-stuff', function (done) {
        // some heavy stuff here...
        var result = done();
        console.log(result.summary); // —> loop-stuff: 1.459 sec.
    });    
```

## Documentation

### `.start(name [, autoDestroy])`
Initializes a new performance instance with the given name; and marks the current high-resolution real time.  

**Parameters:**  

 - *name* `String` — Required. Unique name of the performance instance to be started. Setting an existing name will overwrite this item. Use `.exists()` method to check for existence.  
 - *autoDestroy* `Boolean` — Optional. Default: `true`. Specifies whether this performance instance should be destroyed when `.end()` is called.  

**returns** `perfy`  

### `.end(name)`
Ends the performance instance with the given name; and calculates the elapsed high-resolution real time. Note that if `autoDestroy` is not disabled when `.start()` is called; corresponding performance instance is immediately destroyed after returning the result.  

**Parameters:**  

 - *name* `String` — Required. Unique name of the performance instance to be ended.  

**returns** `Object` — A result object with the following properties.  

 - *name* `String` — Initialized name of the performance instance.   
 - *seconds* `Number` — Seconds portion of the elapsed time.   
 - *nanoseconds* `Number` — Nanoseconds portion of the elapsed time.    
 - *milliseconds* `Number` — Nanoseconds converted to milliseconds.  
 - *time* `Number` — Float representation of elapsed time. e.g. `1.347` (seconds).   
 - *summary* `String` — Text summary shorthand for elapsed time.  
 - *startTime* `Number` — UTC start time of the execution (low-resolution).  
 - *endTime* `Number` — UTC end time of the execution (low-resolution).  

### `.exec([name,] fn)`
Initializes a new performance instance right before executing the given function, and automatically ends after the execution is done.  

**Parameters:**  

 - *name* `String` — Optional. Unique name of the performance instance. Set this if you want the keep the instance for later use (such as getting the result at a later time).  
 - *fn* `Function` — Required. Function to be executed. This function is invoked with an optional `done` argument which is only required if you are running an asynchronous operation. You should omit the `done` argument if it's a synchronous operation.  

**returns** `Object|perfy` — Returns a result object if running a **synchronous** operation (by omitting `done`).  
```js
    function syncOp() {
        // sync operation
    }
    var result = perfy.exec(syncOp);
```
Otherwise (if **asynchronous**), immediately returns the `perfy` object and result will be returned by calling `done()` from within `fn`.   
```js
    perfy.exec(function (done) {
        // a-sync operation
        var result = done();
        // perfy.count() === 0 // (auto-destroyed)
    });
```
You can also save this performance instance by setting the name.  
```js
    perfy.exec('async-op', function (done) {
        // a-sync operation
        done();
        perfy.exists('async-op'); // —> true (saved)
    });
```

### `.result(name)`
Gets the calculated result of the performance instance for the given name. To be used with non-destroyed, ended instances. If instance is not yet ended or does not exist at all, returns `null`.  

**Parameters:**  

 - *name* `String` — Required. Unique name of the performance instance.  

**returns** `Object` — A result object (see `.end()` method).  

### `.exists(name)`
Specifies whether a performance instance exists with the given name. This method will return `false` for an item, if called after `.end(name)` is called since the instance is destroyed.  

**Parameters:**  

 - *name* `String` — Required. Name of the performance instance to be checked.  

**returns** `Boolean`

### `.destroy(name)`
Destroys the performance instance with the given name.  

**Parameters:**  

 - *name* `String` — Required. Name of the performance instance to be destroyed.  

**returns** `perfy`

### `.destroyAll()`
Destroys all existing performance instances.  

**returns** `perfy`

### `.names()`
Gets the names of existing performance instances.  

**returns** `Array`  

### `.count()`
Gets the total number of existing performance instances.  

**returns** `Number`  

## More Examples:  

Basic:
```js
    perfy.start('metric-1');
    var result1 = perfy.end('metric-1');
    console.log(result1.seconds + ' sec, ' + result1.milliseconds.toFixed(3) + ' ms.');
    // —> 1 sec, 234 ms.
    // OR
    console.log(result1.time + ' sec. ');
    // —> 1.234 sec.
```

Auto-Destroy:
```js
    perfy.start('metric-2').count(); // —> 1 (metric-1 is already destroyed)
    var result2 = perfy.end('metric-2');
    perfy.count(); // —> 0 (metric-2 is also destroyed after .end() is called)
```

Keep the instance (disable `autoDestroy`):
```js
    perfy.start('metric-3', false);
    perfy.end('metric-3').time; // —> 0.123
    perfy.exists('metric-3'); // —> true
```

Destroy all:
```js
    perfy.destroyAll().count(); // —> 0
```

Save/exec async:
```js
    perfy
        .exec('async-op', function (done) {
            var result = done(); // === perfy.result('async-op')
            perfy.count(); // 1
        })
        .count(); // 0 (sync)
```

## Changelog

- **v1.1.0** (2015-10-16)  
    + Added `.exec()` convenience method.  
    + `.exists()` will throw if no `name` is specified.  
    
    ---
    
- **v1.0.1** (2015-10-12)  
    + `.result(name)` will not throw (and return `null`) even if the perf-instance does not exist. It will throw if no name is specified.  
    
    ---
    
- **v1.0.0** (2015-10-12)  
    + First release.  
    
    ---
    