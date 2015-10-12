/*jslint node:true, nomen:true, unparam:true, vars:true, plusplus:true */

/**
 *  Jasmine Grunt Task for NodeJS.
 *  @author   Onur Yıldırım (onur@cutepilot.com)
 *  @license  MIT
 */
module.exports = function (grunt) {
    'use strict';

    var JasmineRunner = require('./lib/jasmine.runner'),
        ConsoleReporter = require('./lib/console.reporter'),
        reporters = require('jasmine-reporters'),
        path = require('path'),
        _ = grunt.util._;

    //-------------------------------------
    //  UTILITY METHODS
    //-------------------------------------

    function ensureArray(value, delim) {
        return !_.isArray(value)
            ? (value || '').split(delim)
            : value;
    }

    function hasSuffix(suffixes, filePath) {
        return _.some(suffixes, function (suffix) {
            return _.endsWith(filePath.toLowerCase(), suffix.toLowerCase());
        });
    }

    function expand(glob, suffixes) {
        var options = {
            // matchBase: true,
            filter: function (filePath) {
                return grunt.file.isFile(filePath)
                    && hasSuffix(suffixes, filePath.toLowerCase());
            }
        };
        // filter and expand glob
        var files = grunt.file.expand(options, glob);
        // resolve file paths
        return _.map(files, function (file) {
            return path.resolve(file);
        });
    }

    //-------------------------------------
    //  TASK DEFINITION
    //-------------------------------------

    grunt.registerMultiTask('jasmine_nodejs', 'Jasmine Grunt Task for NodeJS.', function () {
        var task = this,
            // Mark the task as async
            taskComplete = task.async(),
            conf = grunt.config.get([this.name, this.target]);

        var options = task.options({
            specNameSuffix: 'spec.js', // string or array
            helperNameSuffix: 'helper.js',
            useHelpers: true,
            reporters: {}
            // , customReporters: []
        });

        var jasmineRunner = new JasmineRunner({ stopOnFailure: options.stopOnFailure }),
            enabledReporters = [],
            ropts = options.reporters,
            helperFiles;

        // HELPER METHODS

        // Handler to be executed witin `reporter.jasmineDone()`. We should
        // execute this callback only once, when all reporters are completed.
        // So we keep a counter.
        var cc = 0;
        function onComplete(passed) {
            cc++;
            if (cc >= enabledReporters.length) {
                if (passed) {
                    grunt.log.ok('Successful!');
                }
                taskComplete(passed);
                cc = 0;
            }
            if (_.isArray(helperFiles)) {
                jasmineRunner.unloadHelpers(helperFiles);
            }
        }

        // Extends default console reporter options
        function getConsoleReporterOpts(opts) {
            opts = opts || {};
            opts.print = function () {
                grunt.log.write.apply(this, arguments);
            };
            // checking this here for the old name `verbose` (now alias).
            opts.verbosity = opts.verbosity === undefined
                ? opts.verbose
                : opts.verbosity;
            return opts;
        }

        function addReporter(reporter) {
            try {
                reporter = jasmineRunner.addReporter(reporter, onComplete);
                enabledReporters.push(reporter.name);
            } catch (error) {
                grunt.log.error(error);
            }
        }

        // BUILT-IN REPORTERS
        // additional Jasmine reporters
        // https://github.com/larrymyers/jasmine-reporters
        var reporter;

        // Reporters that only write to a file:
        if (ropts.junit) {
            reporter = new reporters.JUnitXmlReporter(ropts.junit);
            reporter.name = 'JUnit XML Reporter';
            addReporter(reporter);
        }
        if (ropts.nunit) {
            reporter = new reporters.NUnitXmlReporter(ropts.nunit);
            reporter.name = 'NUnit XML Reporter';
            addReporter(reporter);
        }

        // We will not allow reporters producing command-line output to run at
        // the same time, to prevent puzzled outputs.
        var conflict = !!ropts.console;
        if (!conflict && ropts.terminal) {
            conflict = true;
            reporter = new reporters.TerminalReporter(ropts.terminal);
            reporter.name = 'Terminal Reporter';
            addReporter(reporter);
        }
        if (!conflict && ropts.teamcity) {
            conflict = true;
            reporter = new reporters.TeamCityReporter(); // no options to set
            reporter.name = 'TeamCity Reporter';
            addReporter(reporter);
        }
        if (!conflict && ropts.tap) {
            conflict = true;
            reporter = new reporters.TapReporter(); // no options to set
            reporter.name = 'TAP Reporter';
            addReporter(reporter);
        }

        // CUSTOM JASMINE REPORTERS

        if (_.isArray(options.customReporters)) {
            options.customReporters.forEach(function (customReporter, index) {
                customReporter.name = customReporter.name
                    || 'Custom Reporter #' + (index + 1);
                addReporter(customReporter);
            });
        }

        // DEFAULT REPORTER

        // Finally add the default (console) reporter if set/needed.
        if (enabledReporters.length === 0 || ropts.console) {
            var crOpts = getConsoleReporterOpts(ropts.console),
                consoleReporter = new ConsoleReporter(crOpts);
            // consoleReporter already has `name` property defined
            addReporter(consoleReporter);
        }

        grunt.verbose.writeln('Enabled Reporters:\n  ', enabledReporters.join(', ') || 'none');

        // EXECUTE SPEC (and HELPER) FILES

        // Spec files
        var specSuffixes = ensureArray(options.specNameSuffix, ','),
            specFiles = expand(conf.specs || [], specSuffixes);
        grunt.verbose.writeln('Spec Files:\n  ', specFiles);

        // Helper files
        if (options.useHelpers && options.helperNameSuffix) {
            var helperSuffixes = ensureArray(options.helperNameSuffix, ',');
            helperFiles = expand(conf.helpers || [], helperSuffixes);
            grunt.verbose.writeln('Helper Files:\n  ', helperFiles);
            jasmineRunner.loadHelpers(helperFiles);
        }

        jasmineRunner.loadSpecs(specFiles);
        jasmineRunner.execute();
    });
};
