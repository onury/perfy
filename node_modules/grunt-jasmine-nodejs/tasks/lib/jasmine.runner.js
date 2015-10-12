/*jslint node:true, devel:false, nomen:true, regexp:true, unparam:true, vars:true, plusplus:true */

/**
 *  Jasmine.Runner
 *  @author   Onur Yıldırım (onur@cutepilot.com)
 *  @version  1.0.0 (2015-05-01)
 *  @license  MIT
 */
module.exports = (function () {
    'use strict';

    var jasmineCore = require('jasmine-core');

    //----------------------------
    //  Helper Methods
    //----------------------------

    function requireFiles(files) {
        files.forEach(function (file) {
            require(file);
        });
    }

    function unloadFiles(files) {
        files.forEach(function (file) {
            delete require.cache[file];
        });
    }

    //----------------------------
    //  CLASS: JasmineRunner
    //----------------------------

    function JasmineRunner(options) {
        options = options || {};
        this.jasmine = jasmineCore.boot(jasmineCore);
        this.env = this.jasmine.getEnv();
        this.env.throwOnExpectationFailure(!!options.stopOnFailure);
        this._reporters = [];
    }

    JasmineRunner.isValidReporter = function (object) {
        return typeof object === 'object'
            && typeof object.jasmineDone === 'function'
            && typeof object.specDone === 'function';
    };

    JasmineRunner.prototype.addReporter = function (reporter, onDone) {
        reporter.name = reporter.name || 'Reporter #' + (this._reporters.length + 1);
        if (!JasmineRunner.isValidReporter(reporter)) {
            throw new Error(reporter.name + ' is not a valid Jasmine reporter.');
        }
        // store original callbacks
        var specDone = reporter.specDone,
            // suiteDone is not mandatory for reporters
            suiteDone = reporter.suiteDone,
            jasmineDone = reporter.jasmineDone;

        // mark whether this has failed
        reporter.specDone = function (spec) {
            if (spec.status === 'failed') {
                this.__failed = true;
            }
            specDone(spec);
        };
        if (typeof suiteDone === 'function') {
            reporter.suiteDone = function (suite) {
                if (suite.failedExpectations.length > 0) {
                    this.__failed = true;
                }
                suiteDone(suite);
            };
        }
        // inject our callback
        reporter.jasmineDone = function () {
            jasmineDone();
            onDone(!this.__failed);
        };
        this.env.addReporter(reporter);
        this._reporters.push(reporter);
        return reporter;
    };

    JasmineRunner.prototype.getReporters = function (reporter) {
        return this._reporters;
    };

    JasmineRunner.prototype.addMatchers = function (matchers) {
        this.jasmine.Expectation.addMatchers(matchers);
    };

    JasmineRunner.prototype.unloadHelpers = unloadFiles;

    JasmineRunner.prototype.loadHelpers = requireFiles;

    JasmineRunner.prototype.loadSpecs = requireFiles;

    JasmineRunner.prototype.execute = function () {
        this.env.execute();
    };

    //----------------------------
    //  EXPORT
    //----------------------------

    return JasmineRunner;

}());