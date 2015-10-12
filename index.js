/*jslint node, white, this, for */

/**
 *  A simple, light-weight NodeJS utility for measuring code execution in high-resolution real times.
 *
 *  @module   perfy
 *  @author   Onur Yıldırım (onur@cutepilot.com)
 *  @license  MIT
 *  @example
 *      var perfy = require('perfy');
 *      perfy.start('loop-test');
 *      // some heavy stuff here...
 *      console.log(perfy.end('loop-test').summary);
 */
module.exports = (function () {
    'use strict';

    // See https://nodejs.org/api/process.html#process_process_hrtime

    //---------------------------------
    //  CLASS: PerfyItem
    //---------------------------------

    function PerfyItem(name) {
        this.name = name || 'PerfyItem';
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
            name: this.name,
            seconds: this.time.end[0],
            nanoseconds: this.time.end[1],
            // divide by a million to convert nanoseconds to milliseconds
            milliseconds: (this.time.end[1] / 1000000),
            startTime: this.utc.start,
            endTime: this.utc.end
        };
        o.time = parseFloat(o.seconds + '.' + Math.round(o.milliseconds));
        o.summary = this.name + ': ' + o.time.toFixed(3) + ' sec.';
        this.result = o;
        return o;
    };

    //---------------------------------
    //  CLASS: perfy
    //---------------------------------

    // storage for PerfyItem instances
    var perfList = {},
        perfy = {},
        ERR_NAME_REQ = 'Performance instance name required!',
        ERR_NOITEM = 'No performance instance with name: ';

    perfy.start = function (name, autoDestroy) {
        if (!name) { throw new Error(ERR_NAME_REQ); }
        name = String(name);
        autoDestroy = autoDestroy === undefined ? true : autoDestroy;
        perfList[name] = new PerfyItem(name);
        perfList[name].autoDestroy = autoDestroy;
        perfList[name].start();
        return perfy;
    };

    perfy.end = function (name) {
        if (!name) { throw new Error(ERR_NAME_REQ); }
        name = String(name);
        var p = perfList[name];
        if (!p) { throw new Error(ERR_NOITEM + name); }
        var result = p.end();
        if (p.autoDestroy) {
            delete perfList[name];
        }
        return result;
    };

    perfy.result = function (name) {
        if (!name) { throw new Error(ERR_NAME_REQ); }
        name = String(name);
        var p = perfList[name];
        if (!p) {
            throw new Error(ERR_NOITEM + name);
        }
        return p.result;
    };

    perfy.exists = function (name) {
        return !!perfList[name];
    };

    perfy.names = function () {
        return Object.keys(perfList);
    };

    perfy.count = function () {
        return perfy.names().length;
    };

    perfy.destroy = function (name) {
        if (perfList[name]) {
            delete perfList[name];
        }
        return perfy;
    };

    perfy.destroyAll = function () {
        perfList = {};
        return perfy;
    };

    //---------------------------------
    //  EXPORT
    //---------------------------------

    return perfy;

}());