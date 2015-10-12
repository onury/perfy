/*jslint node:true, devel:false, nomen:true, regexp:true, unparam:true, vars:true, plusplus:true */

/**
 *  Console.Reporter
 *  @author   Onur Yıldırım (onur@cutepilot.com)
 *  @version  1.2.0 (2015-05-01)
 *  @license  MIT
 */
module.exports = (function () {
    'use strict';

    var chalk = require('chalk'),
        path = require('path'),
        // windows returns 'win32' even on 64 bit but we still check for
        // win64, just in case...
        isWindows = process.platform === 'win32'
            || process.platform === 'win64';

    //----------------------------
    //  UTILITY METHODS
    //----------------------------

    function plural(str, count) {
        return count === 1 ? str : str + 's';
    }

    function repeat(string, times) {
        return new Array(times + 1).join(string);
    }

    function indent(str, times, indentChar) {
        indentChar = indentChar || ' ';
        var i,
            newArr = [],
            lines = (str || '').split('\n');
        for (i = 0; i < lines.length; i++) {
            newArr.push(repeat(indentChar, times) + lines[i]);
        }
        return newArr.join('\n');
    }

    function symbol(name) {
        switch (name) {
        case 'dot':
            return isWindows ? '.' : '∙';
        case 'info':
            return isWindows ? 'i' : 'ℹ';
        case 'success':
            return isWindows ? '√' : '✔'; // ✓
        case 'warning':
            return isWindows ? '‼' : '⚠';
        case 'error':
            return isWindows ? '×' : '✖'; // ✕
        case 'disabled':
            return isWindows ? '!' : '•';
        }
    }

    function log() {
        process.stdout.write.apply(process.stdout, arguments);
    }

    function reStack(stack, cleanLevel, style) {
        if (!stack) { return stack; }
        stack = String(stack).split('\n');
        // store the first line (error message)
        var first = stack[0] || '';
        // remove the first from the stack to filter
        stack = stack.slice(1);

        if (cleanLevel > 0) {
            var cleanPath = cleanLevel >= 2
                ? 'node_modules'
                : path.join('node_modules', 'jasmine-core');
            cleanPath = path.sep + cleanPath + path.sep;
            // remove stack lines with jasmine-core path.
            stack = stack.filter(function (stackLine) {
                var pathCheck = stackLine.indexOf(cleanPath) === -1,
                    sepCheck = cleanLevel >= 3
                        ? stackLine.indexOf(path.sep) > -1
                        : true;
                return (pathCheck && sepCheck);
            });
        }

        // make the file paths clickable by removing the wrapping parenths.
        stack = stack.map(function (stackLine) {
            stackLine = stackLine.replace(/\(([^\(]+?)\)/g, '$1'); // '( $1 )'
            if (style) {
                stackLine = stackLine.replace(/([^:\/\\ ]+):(\d+):(\d+)/, function (m, $1, $2, $3) {
                    return style.yellow($1) + ':' + style.white($2) + ':' + style.white($3);
                });
            }
            return stackLine;
        });
        // add back the first line and rest of stack
        if (style) { first = style.red(first); }
        return first + '\n' + stack.join('\n');
    }

    function extend(defaults, object) {
        object = object || {};
        var key;
        for (key in defaults) {
            if (defaults.hasOwnProperty(key)
                    && object[key] === undefined) {
                object[key] = defaults[key];
            }
        }
        return object;
    }

    // Normalizes and tries to get a numeric value. This is used for options
    // that support both Boolean and Number values.
    function optionBoolToNum(value, numTrue, numFalse) {
        return typeof value === 'boolean'
            ? (value ? numTrue : numFalse)
            : typeof value === 'number'
                ? value
                : undefined;
    }

    //----------------------------
    //  CLASS: Timer
    //----------------------------

    function Timer() {
        this._startTime = 0;
        this._endTime = 0;
    }
    Timer.prototype.start = function () {
        this._startTime = Date.now();
    };
    Timer.prototype.stop = function () {
        this._endTime = Date.now();
    };
    Timer.prototype.elapsed = function () {
        this.stop();
        var t = (this._endTime - this._startTime) / 1000;
        return t.toFixed(3);
    };

    //----------------------------
    //  CLASS: Activity
    //----------------------------

    // example:
    // var activity = new Activity(80);
    // activity.start('* please wait...');
    // asterisk will be replaced with rotating line animation (\ | / —) on
    // each interval. For ANSI codes, see http://academic.evergreen.edu/projec
    // ts/biophysics/technotes/program/ansi_esc.htm
    function Activity(interval) {
        this._ticks = 0;
        this._interval = interval || 60;
        this.running = false;
    }
    Activity.prototype.stop = function () {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        // clear the full title
        if (this.running) {
            log('\x1B[u\r\x1B[K');
        }
        this.running = false;
        this._ticks = 0;
        this._row = null;
    };
    function _activityRun() {
        this._ticks += 1;
        var mod = this._ticks % 4,
            c = mod === 0
                ? '\\' : mod === 1
                ? '|'  : mod === 2
                ? '/'  : '—';
        var title = this.title ? this.title.replace(/\*/g, c) : c;
        // move cursor to last saved position, clear line and update activity
        // title.
        log('\x1B[u' + title);
    }
    Activity.prototype.start = function (title) {
        var $this = this;
        $this.stop();
        $this.title = title;
        $this.running = true;
        // save cursor position
        log('\x1B[s');
        $this._timer = setInterval(function () {
            _activityRun.apply($this);
        }, $this._interval);
    };

    //----------------------------
    //  CLASS: ConsoleReporter
    //----------------------------

    function ConsoleReporter(options) {
        this.name = 'Jasmine Console Reporter';

        options = options || {};
        options.verbosity = optionBoolToNum(options.verbosity, 4, 0);
        options.cleanStack = optionBoolToNum(options.cleanStack, 1, 0);

        // extend options with defaults
        options = extend({
            colors: true,
            cleanStack: 1, // 0 to 3
            verbosity: 4,  // 0 to 4
            activity: false,
            listStyle: 'indent'
        }, options);

        var report = {
            listAll: options.verbosity >= 4, // also list disabled specs
            list: options.verbosity >= 3,
            pendingSpecs: options.verbosity >= 2,
            stats: options.verbosity >= 1,
            none: options.verbosity <= 0
        };

        var listStyle = {
            flat: options.listStyle === 'flat',
            indent: options.listStyle === 'indent'
        };

        var printer = options.print || log,
            timer = new Timer(),
            activity;
        if (options.activity) { activity = new Activity(); }

        var _failedSpecs = [],
            _pendingSpecs = [],
            _failedSuites = [],
            stats = {
                failures: 0,
                suites: {
                    total: 0,
                    disabled: 0,
                    failed: 0
                },
                specs: {
                    defined: 0,
                    total: 0,
                    failed: 0,
                    passed: 0,
                    pending: 0,
                    disabled: 0
                },
                expects: {
                    total: 0,
                    failed: 0,
                    passed: 0
                }
            },
            // Keeping track of suite (describe) nest levels.
            _depth = -1,
            // Just keeping a flag to determine whether an extra new line is
            // needed when there is a remaining spec after a nested suite is
            // finished.
            _suiteDone = false,
            _indentChar = ' ',
            _indentUnit = 3;

        //----------------------------
        //  HELPER METHODS
        //----------------------------

        function fnStyle(color) {
            return function (str) {
                return !!options.colors ? chalk[color](str) : str;
            };
        }

        // ansi styles
        var style = {
            green: fnStyle('green'),
            red: fnStyle('red'),
            yellow: fnStyle('yellow'),
            // blue: fnStyle('blue'),
            cyan: fnStyle('cyan'),
            white: fnStyle('white'),
            gray: fnStyle('gray'),
            underline: fnStyle('underline')
        };

        var print = {
            str: function () {
                printer.apply(printer, arguments);
            },
            line: function () {
                printer('\n');
                if (arguments.length) {
                    printer.apply(printer, arguments);
                }
            },
            newLine: function (num) {
                num = num || 1;
                printer(new Array(num + 1).join('\n'));
            },
            // return: function () {
            //     printer('\r');
            //     if (arguments.length) {
            //         printer.apply(printer, arguments);
            //     }
            // },
            suite: function (suite) {
                if (!report.list) { return; }
                _depth = _depth || 0;
                var ind = listStyle.indent
                        ? repeat(_indentChar, _depth * _indentUnit)
                        : '',
                    title = style.cyan(stats.suites.total + ') ' + suite.description);
                print.line(ind + title);
            },
            spec: function (spec) {
                // console.log('spec', spec.description, spec.status);
                if (!report.list) { return; }
                _depth = _depth || 0;
                var title = '',
                    ind = listStyle.indent
                        ? repeat(_indentChar, (_depth + 1) * _indentUnit)
                        : '';

                switch (spec.status) {
                case 'pending':
                    title = style.yellow(symbol('warning') + ' ' + spec.description);
                    break;
                case 'disabled':
                    // we don't print disableds if verbosity < 4
                    if (!report.listAll) {
                        // clear the new line printed on spec-start
                        print.clearLine();
                        return;
                    }
                    title = style.gray(symbol('disabled') + ' ' + spec.description);
                    break;
                case 'failed':
                    var fc = spec.failedExpectations.length,
                        f = ' (' + fc + ' ' + plural('failure', fc) + ')';
                    title = style.red(symbol('error') + ' ' + spec.description + f);
                    break;
                case 'passed':
                    title = style.green(symbol('success') + ' ' + spec.description);
                    break;
                }

                print.str(ind + title);
            },
            end: function () {
                if (report.list) {
                    print.newLine(2);
                }
                print.str(style.gray('>> Done!'));
                print.newLine();
            },
            clearLine: function (num) {
                num = num === undefined
                    ? 1 : (num < 1 ? 1 : num);
                var i;
                for (i = 0; i < num; i++) {
                    process.stdout.clearLine(0);
                    process.stdout.moveCursor(0, -1);
                }
            }
        };

        //----------------------------
        //  REPORT METHODS
        //----------------------------

        function specFailureDetails(spec, num) {
            print.line(style.red(num + ') '));
            var title = spec.fullName.replace(spec.description, ': ' + spec.description);
            print.str(style.cyan(title));
            var i, failedExpectation, stack;
            for (i = 0; i < spec.failedExpectations.length; i++) {
                failedExpectation = spec.failedExpectations[i];
                stack = reStack(failedExpectation.stack, options.cleanStack, style);
                print.line(indent(stack, _indentUnit));
            }
            print.newLine();
        }

        function specPendingDetails(spec, num) {
            print.line(style.yellow(num + ') '));
            var title = spec.fullName.replace(spec.description, ': ' + spec.description);
            print.str(style.cyan(title));
            var pendingReason = spec.pendingReason
                    ? style.yellow('Reason: ' + spec.pendingReason)
                    : style.gray('(No pending reason)');
            print.line(indent(pendingReason, _indentUnit));
            print.newLine();
        }

        function suiteFailureDetails(suite) {
            var i, failedExpectation, stack;
            for (i = 0; i < suite.failedExpectations.length; i++) {
                failedExpectation = suite.failedExpectations[i];
                print.line(style.red('>> An error was thrown in an afterAll'));
                stack = reStack(failedExpectation.stack, options.cleanStack, style);
                print.line(indent(stack, _indentUnit));
            }
            print.newLine(2);
        }

        function finalReport() {
            var i,
                seconds = timer.elapsed();

            if (_failedSpecs.length > 0) {
                print.line(style.red(style.underline('Failed Specs')) + style.red(':'));
                print.newLine();
                for (i = 0; i < _failedSpecs.length; i++) {
                    specFailureDetails(_failedSpecs[i], i + 1);
                }
            }

            if (report.pendingSpecs && _pendingSpecs.length > 0) {
                print.line(style.yellow(style.underline('Pending Specs')) + style.yellow(':'));
                print.newLine();
                for (i = 0; i < _pendingSpecs.length; i++) {
                    specPendingDetails(_pendingSpecs[i], i + 1);
                }
            }

            // verbosity >= 2
            // if (report.pendingSpecs) { }

            if (report.stats) {
                print.line(style.white(style.underline('Summary') + ':'));
                print.newLine();

                if (stats.specs.total > 0) {
                    var executedSuites = stats.suites.total - stats.suites.disabled;
                    print.line('Suites:  ' + style.white(executedSuites) + ' of ' + stats.suites.total);
                    if (stats.suites.disabled) {
                        print.str(style.yellow(' (' + stats.suites.disabled + ' disabled)'));
                    }

                    var executedSpecs = stats.specs.total - (stats.specs.pending + stats.specs.disabled);
                    print.line('Specs:   ' + style.white(executedSpecs) + ' of ' + stats.specs.defined);
                    var specsInfo = [];
                    if (stats.specs.pending) {
                        specsInfo.push(stats.specs.pending + ' pending');
                    }
                    // var disabledSpecs = stats.specs.defined - stats.specs.total;
                    if (stats.specs.disabled > 0) {
                        specsInfo.push(stats.specs.disabled + ' disabled');
                    }
                    if (specsInfo.length) {
                        print.str(style.yellow(' (' + specsInfo.join(', ') + ')'));
                    }

                    print.line('Expects: ' + style.white(stats.expects.total));
                    var fc = stats.expects.failed,
                        f = ' (' + fc + ' ' + plural('failure', fc) + ')';
                    if (fc > 0) { f = style.red(f); }
                    print.str(f);

                } else {
                    print.str(style.yellow('No specs executed.'));
                }

                print.line(style.gray('Finished in ' + seconds + ' ' + plural('second', seconds)));
                print.newLine(2);
            } else {
                print.newLine();
            }

            for (i = 0; i < _failedSuites.length; i++) {
                suiteFailureDetails(_failedSuites[i]);
            }
        }

        //----------------------------
        //  CLASS METHODS
        //----------------------------

        this.jasmineStarted = function (summary) {
            stats.suites.total = 0;
            stats.specs.total = 0;
            stats.failures = 0;

            print.newLine();
            stats.specs.defined = summary.totalSpecsDefined;
            print.str('>> Executing ' + summary.totalSpecsDefined + ' defined specs...');
            print.newLine();
            timer.start();

            if (report.list) {
                print.line(style.cyan(style.underline('Test Suites & Specs')) + style.cyan(':'));
                print.newLine();
            }
        };

        this.suiteStarted = function (suite) {
            _depth++;

            var isFirstSuite = !stats.suites.total;
            if (!isFirstSuite && report.list) {
                print.newLine();
            }
            stats.suites.total++;

            print.suite(suite);
            _suiteDone = false;
        };

        this.suiteDone = function (suite) {
            var disabled = suite.status === 'disabled';

            if (disabled) {
                stats.suites.disabled++;
                // if (report.list) {
                //     // if suite is disabled, print extra info and line.
                //     print.str(style.gray(' (disabled)'));
                //     // print.newLine();
                // }
            }

            _depth--;

            var failed = suite.failedExpectations || [];
            if (failed.length > 0) {
                _failedSuites.push(suite);
                stats.suites.failed++;
                stats.failures++;
            }
            _suiteDone = true;
        };

        this.specStarted = function (spec) {
            if (report.list) {
                var nl = _suiteDone ? 2 : 1;
                print.newLine(nl);
            }

            // show the activity animation and current spec to be executed, if
            // enabled.
            if (options.activity && activity) {
                var ind = report.list && listStyle.indent
                        ? repeat(_indentChar, (_depth + 1) * _indentUnit)
                        : '',
                    title = ind + '* ' + style.gray(spec.description);
                activity.start(title);
            }
        };

        this.specDone = function (spec) {
            if (options.activity && activity) {
                activity.stop();
            }

            stats.specs.total++;
            stats.expects.failed += spec.failedExpectations.length;
            stats.expects.passed += spec.passedExpectations.length;
            stats.expects.total = (stats.expects.failed + stats.expects.passed);

            switch (spec.status) {
            case 'pending':
                stats.specs.pending++;
                _pendingSpecs.push(spec);
                break;
            // this is new in Jasmine 2.3.x
            case 'disabled':
                stats.specs.disabled++;
                break;
            case 'failed':
                stats.failures++;
                stats.specs.failed++;
                _failedSpecs.push(spec);
                break;
            case 'passed':
                stats.specs.passed++;
                break;
            }

            print.spec(spec);
        };

        this.jasmineDone = function (a) {
            print.end();
            print.newLine();
            finalReport();
            if (activity) {
                activity = null;
            }
        };

    }

    //----------------------------
    //  EXPORT
    //----------------------------

    return ConsoleReporter;

}());