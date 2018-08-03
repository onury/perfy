/* eslint no-param-reassign:0 */

/**
 *  A simple, light-weight NodeJS utility for measuring code execution in high-resolution real times.
 *
 *  @module   perfy
 *  @author   Onur Yıldırım <onur@cutepilot.com>
 *  @license  MIT
 *  @example
 *      var perfy = require('perfy');
 *      perfy.start('loop-test');
 *      // some heavy stuff here...
 *      console.log(perfy.end('loop-test').time);
 */
module.exports = (function () {

    // See https://nodejs.org/api/process.html#process_process_hrtime

    // --------------------------------
    //  CLASS: PerfyItem
    // --------------------------------

    function PerfyItem(name) {
        this.name = name;
        this.reset();
    }

    PerfyItem.prototype.reset = function () {
        this.time = {
            start: null,
            end: null
        };
        this.utc = {
            start: null,
            end: null
        };
        this.result = null;
    };

    PerfyItem.prototype.start = function () {
        this.reset();
        this.time.start = process.hrtime();
        this.utc.start = Date.now();
    };

    PerfyItem.prototype.end = function () {
        if (!this.time.start) {
            throw new Error('start() should be called first!');
        }
        this.time.end = process.hrtime(this.time.start);
        this.utc.end = Date.now();

        var o = {
            name: this.name || '',
            seconds: this.time.end[0],
            nanoseconds: this.time.end[1],
            // divide by a million to convert nanoseconds to milliseconds
            milliseconds: (this.time.end[1] / 1000000),
            startTime: this.utc.start,
            endTime: this.utc.end
        };
        var fullMilliseconds = (o.seconds * 1000) + o.milliseconds;
        o.fullMilliseconds = Number(fullMilliseconds.toFixed(3));
        o.fullSeconds = o.time = Number((fullMilliseconds / 1000).toFixed(3));
        o.fullNanoseconds = (o.seconds * 1000 * 1000000) + o.nanoseconds;

        var n = this.name ? this.name + ': ' : '';
        o.summary = n + o.time + ' sec.';
        this.result = o;
        return o;
    };

    // --------------------------------
    //  CLASS: perfy
    // --------------------------------

    // storage for PerfyItem instances
    var perfList = {},
        perfy = {},
        ERR = {
            NAME: 'Performance instance name required!',
            NOITEM: 'No performance instance with name: ',
            CALLBACK: 'Callback is not a function!'
        };

    perfy.start = function (name, autoDestroy) {
        if (!name) { throw new Error(ERR.NAME); }
        name = String(name);
        autoDestroy = typeof autoDestroy === 'undefined' ? true : autoDestroy;
        perfList[name] = new PerfyItem(name);
        perfList[name].autoDestroy = autoDestroy;
        perfList[name].start();
        return perfy;
    };

    perfy.end = function (name) {
        if (!name) { throw new Error(ERR.NAME); }
        name = String(name);
        var p = perfList[name];
        if (!p) { throw new Error(ERR.NOITEM + name); }
        // if already ended and has result, return
        if (p.result) { return p.result; }
        var result = p.end();
        if (p.autoDestroy) {
            delete perfList[name];
        }
        return result;
    };

    perfy.result = function (name) {
        if (!name) { throw new Error(ERR.NAME); }
        name = String(name);
        var p = perfList[name];
        if (!p) { return null; }
        return p.result;
    };

    perfy.exists = function (name) {
        if (!name) { throw new Error(ERR.NAME); }
        return Boolean(perfList[name]);
    };

    perfy.names = function () {
        return Object.keys(perfList);
    };

    perfy.count = function () {
        return perfy.names().length;
    };

    perfy.destroy = function (name) {
        if (!name) { throw new Error(ERR.NAME); }
        if (perfList[name]) {
            delete perfList[name];
        }
        return perfy;
    };

    perfy.destroyAll = function () {
        perfList = {};
        return perfy;
    };

    perfy.exec = function (name, fn) {
        if (typeof fn !== 'function') {
            if (typeof name === 'function') {
                fn = name;
                name = null;
            } else {
                throw new Error(ERR.CALLBACK);
            }
        }

        var p;
        if (name) {
            perfList[name] = new PerfyItem(name);
            perfList[name].autoDestroy = false;
            p = perfList[name];
        } else {
            p = new PerfyItem();
        }
        function done() {
            var result = p.end();
            if (name && p.autoDestroy) {
                delete perfList[name];
            }
            return result;
        }
        p.start();
        if (fn.length > 0) {
            fn(done);
            return perfy;
        }
        fn();
        return done();
    };

    // --------------------------------
    //  EXPORT
    // --------------------------------

    return perfy;

}());
