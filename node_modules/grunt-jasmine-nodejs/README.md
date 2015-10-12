# grunt-jasmine-nodejs

Jasmine (v2.x) Grunt multi-task for NodeJS with built-in reporters such as Default (Console) Reporter, JUnit XML, NUnit XML, Terminal Reporter, TeamCity, TAP Reporter. Supports the latest Jasmine features such as `fdescribe`, `fit`, `beforeAll`, `afterAll`, etc...

> Version: 1.4.3  
> Author: Onur Yıldırım (onury) © 2015  
> Licensed under the MIT License.  

![Example Screenshot](https://raw.github.com/onury/grunt-jasmine-nodejs/master/screenshots/verbose-report.jpg)

## Getting Started

This plugin requires Grunt `^0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-jasmine-nodejs --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-jasmine-nodejs');
```

## jasmine_nodejs task

_Run this task with the `grunt jasmine_nodejs` command._  
_The `--verbose` option will additionally output list of enabled reporters, spec and helper file lists._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

### Options

#### specNameSuffix

Type: `String|Array`  Default: `"spec.js"`  
Case-insensitive suffix(es) for the spec files, including the extension. Only files ending with this suffix will be executed within the specified `specs` destination(s).

#### helperNameSuffix

Type: `String|Array`  Default: `"helper.js"`  
Case-insensitive suffix(es) for the helper files, including the extension. Only files ending with this suffix will be executed within the specified `helpers` destination(s).

#### useHelpers

Type: `Boolean`  Default: `true`  
Specifies whether to execute the helper files.

#### stopOnFailure

Type: `Boolean`  Default: `false`  
Specifies whether to stop running further tests, on first expectation-failure. This can be useful if you want to debug your failed specs one by one. _Note: Regardless of this option; the runner will still stop on suite failures (such as errors thrown in `afterAll`, etc) and as normal, Grunt will abort when a task/target fails._

#### reporters

Type: `Object`  Default: `undefined`  
Defines a list of built-in Jasmine reporter configurations to be used. If omitted, `console` reporter will be used as default. See the definitions and corresponding options for each reporter below.  

> _Note that reporters producing command-line output (such as console, terminal, teamcity and tap reporters), are not allowed to run at the same time, to prevent puzzled outputs. If still enabled, only the first one (in respective order) will be used. This is not the case for reporters producing a file._  

- **reporters.console**  
    The built-in default reporter that outputs the detailed test results to the console, with colors.  

    + **colors** — Type: `Boolean` Default: `true`  
    Specifies whether the output should have colored text.  

    + **cleanStack** — Type: `Number|Boolean` Default: `1`  
    Specifies the filter level for the error stacks. Possible integer values: 0 to 3. Set to `1` (or `true`) to only filter out lines with jasmine-core path from stacks. Set to `2` to filter out all `node_modules` paths. Set to `3` to also filter out lines with no file path in it.  

    + **verbosity** — Type: `Number|Boolean` Default: `4`  
    (_alias: `verbose`_) Specifies the verbosity level for the reporter output. Possible integer values: 0 to 4. When a `Boolean` value is passed, `true` defaults to `4` and `false` defaults to `0`. Level 0: reports errors only. Level 1: also displays a summary. Level 2: also reports pending specs. Level 3: additionally displays all suites and specs as a list, except disabled specs. Level 4: also lists disabled specs.  

    + **listStyle** — Type: `String` Default: `"indent"`  
    Indicates the style of suites/specs list output. Possible values: `"flat"` or `"indent"`. Setting this to `"indent"` provides a better view especially when using nested (describe) suites. This option is only effective when verbosity level is set to `3`, `4` or `true`.  

    + **activity** — Type: `Boolean` Default: `false`  
    Specifies whether to enable the activity indicator animation that outputs the current spec that is being executed. If your tests log extra data to console, this option should be disabled or they might be overwritten.  

- **reporters.junit**  
    JUnit XML Reporter that outputs test results to a file in JUnit XML Report format. The default option values are set to create as few .xml files as possible. It is possible to save a single XML file, or an XML file for each top-level `describe`, or an XML file for each `describe` regardless of nesting.  

    + **savePath** — Type: `String` Default: `""`  
    Defines the directory path to save output report files. This directory will be automatically created if it does not already exist.  

    + **filePrefix** — Type: `String` Default: `"junitresults-"`  
    Defines the string value that is prepended to the XML output file. If `consolidateAll` is true, the default is simply `"junitresults"` and this becomes the actual filename, i.e. `"junitresults.xml"`.  

    + **consolidateAll** — Type: `Boolean` Default: `true`  
    Specifies whether to save all test results in a single file. If set to `true`, `filePrefix` is treated as the full file name (excluding extension).  

    + **consolidate** — Type: `Boolean` Default: `true`  
    Specifies whether to save nested describes within the same file as their parent. Setting to `true` does nothing if `consolidateAll` is also `true`. Setting to `false` will also set `consolidateAll` to `false`.  

    + **useDotNotation** — Type: `Boolean` Default: `true`  
    Specifies whether to separate suite names with dots instead of spaces. e.g. `Class.init` instead of `Class init`.  

- **reporters.nunit**  
    NUnit XML Reporter that outputs test results to a file in NUnit XML Report format. Allows the test results to be used in java based CI systems like Jenkins.  

    + **savePath** — Type: `String` Default: `""`  
    Defines the directory path to save output report files. This directory will be automatically created if it does not already exist.  

    + **filename** — Type: `String` Default: `"nunitresults.xml"`  
    Defines the name of xml output file.  

    + **reportName** — Type: `String` Default: `"Jasmine Results"`  
    Defines the name for parent test-results node.  

- **reporters.terminal**  
    Similar to the default console reporter but simpler.  

    + **color** — Type: `Boolean` Default: `false`  
    Specifies whether the output should have colored text.  

    + **verbosity** — Type: `Number` Default: `2`  
    Specifies the verbosity level for the reporter output. Possible integer values: 0 to 3.  

    + **showStack** — Type: `Boolean` Default: `false`  
    Specifies whether to show stack trace for failed specs.  

- **reporters.teamcity**  
    TeamCity Reporter that outputs test results for the Teamcity build system. There are no options to specify for this reporter. Just set this to `true` to enable the reporter.   

- **reporters.tap**  
    Reporter for Test Anything Protocol ([TAP](http://en.wikipedia.org/wiki/Test_Anything_Protocol)), that outputs tests results to console. There are no options to specify for this reporter. Just set this to `true` to enable the reporter.  


#### customReporters

Type: `Array`  Default: `undefined`  
Defines a list of custom Jasmine reporters to be used. Each item should be an initialized reporter instance with interfaces such as `jasmineDone`, `specDone`, etc...  

### Usage Example

```js
grunt.initConfig({
    jasmine_nodejs: {
        // task specific (default) options
        options: {
            specNameSuffix: "spec.js", // also accepts an array
            helperNameSuffix: "helper.js",
            useHelpers: false,
            stopOnFailure: false,
            // configure one or more built-in reporters
            reporters: {
                console: {
                    colors: true,
                    cleanStack: 1,       // (0|false)|(1|true)|2|3
                    verbosity: 4,        // (0|false)|1|2|3|(4|true)
                    listStyle: "indent", // "flat"|"indent"
                    activity: false
                },
                // junit: {
                //     savePath: "./reports",
                //     filePrefix: "junit-report",
                //     consolidate: true,
                //     useDotNotation: true
                // },
                // nunit: {
                //     savePath: "./reports",
                //     filename: "nunit-report.xml",
                //     reportName: "Test Results"
                // },
                // terminal: {
                //     color: false,
                //     showStack: false,
                //     verbosity: 2
                // },
                // teamcity: true,
                // tap: true
            },
            // add custom Jasmine reporter(s)
            customReporters: []
        },
        your_target: {
            // target specific options
            options: {
                useHelpers: true
            },
            // spec files
            specs: [
                "test/lib/**",
                "test/core/**"
            ],
            helpers: [
                "test/helpers/**"
            ]
        }
    }
});
grunt.loadNpmTasks('grunt-jasmine-nodejs');
```
  
_Note 1: The target-level `reporters` object will override the task-level `reporters` object all together. They will not be merged._

_Note 2: If you're migrating from v0.4.x, task options used for the default reporter (`showColors` and `verboseReport`) are now removed. Use the new (refactored) `reporters.console.colors` and `reporters.console.verbosity` options instead._
  

## Changelog

- **v1.4.3** (2015-08-15)  
    + Clear require cache to force helper files to be reloaded between executions. ([PR @domtronn](https://github.com/onury/grunt-jasmine-nodejs/pull/23))
    
    ---

- **v1.4.2** (2015-07-05)  
    + Console Reporter: Expanded `verbosity` levels (0 to 4). Setting to `3` will not report disabled specs anymore while listing others. Set to `4` (default) for the most verbose report. (Fixes [Issue #17](https://github.com/onury/grunt-jasmine-nodejs/issues/17))
    + Console Reporter: `useHelpers` option does actually default to `true` now.
    + Updated Jasmine-Core and other dependencies to their latest versions.
    
    ---

- **v1.4.0** (2015-05-01)  
    + Updated Jasmine-Core, added support for latest Jasmine version (2.3.0). 
    _Note that all `xit` specs are now treated as `disabled` instead of `pending`._  
    + Added New Task Option: `stopOnFailure`. See documentation.  
    + Fixed an issue where the task would exit before completing all targets. (Fixes [Issue #15](https://github.com/onury/grunt-jasmine-nodejs/issues/15))  
    + Revised dependencies. Updated console reporter.  
    
    ---

- **v1.3.2** (2015-04-27)  
    + Console Reporter: Changed the default value of `report.console.activity` option to `false`. This should not be enabled if your tests log extra data to console. Fixed activity output.  
    
    ---

- **v1.3.0** (2015-04-21)  
    + Console Reporter: Progressive console output. Each spec result is now output at real-time as it's executed. This effectively helps tracking unhandled errors. (Fixes [Issue #7](https://github.com/onury/grunt-jasmine-nodejs/issues/7))  
    + Console Reporter: Fixed mis-handled _nested_ suites (describe blocks). Each spec result and nested suite is now correctly output in relation to its parent test siute. (Fixes [Issue #10](https://github.com/onury/grunt-jasmine-nodejs/issues/10))  
    + Console Reporter: Highlighted file name, line and column numbers in stacks. Only effective if `reporters.console.colors` is enabled.  
    + Console Reporter: Fixed the stack-filter to support Windows file paths. (Fixes [Issue #11](https://github.com/onury/grunt-jasmine-nodejs/issues/11))  
    + Console Reporter: Improved option: `cleanStack` now also accepts a `Number` (integer) to determine the filter level. See documentation.  
    + Console Reporter: Added new option: `listStyle`. See documentation.  
    + Console Reporter: Improved option: `verbosity` (alias: `verbose`) now also accepts a `Number` (integer) to determine the verbosity level. See documentation.  
    + Console Reporter: Clickable file paths in error stacks (This is useful only if your terminal supports it. For example, <kbd>CMD</kbd>+<kbd>Click</kbd> will open the file and move the cursor to the target line in iTerm 2 for Mac, if [configured](http://adrian-philipp.com/post/iterm-jumpto-sublimetext).)  
    + Console Reporter: Added new option: `activity`. See documentation.
    + **Obselete** task options: Removed `showColors` and `verboseReport`. Use `reporters.console.colors` and `reporters.console.verbosity` options instead.  
    + Enabled terminal reporter (similar to console reporter). Define `reporters.terminal` object to set its options.  
    + Updated dependencies to their latest versions.  

    ---

- **v1.0.2** (2015-03-11)  
    + Console Reporter: Fixed *undefined suite description* issue for focused specs (`fit(...)`); which was breaking the spec-run. (Fixes [Issue #9](https://github.com/onury/grunt-jasmine-nodejs/issues/9))    

    ---

- **v1.0.1** (2015-03-06)  
    + Console Reporter: Fixed symbols and colors for Windows platforms. (Fixes [Issue #6](https://github.com/onury/grunt-jasmine-nodejs/issues/6))  

    ---

- **v1.0.0** (2015-03-04)  
    + Added new reporters: JUnit XML Reporter, NUnit XML Reporter, TeamCity Reporter, TAP Reporter. (Fulfills [Issue #4](https://github.com/onury/grunt-jasmine-nodejs/issues/4)). Implemented using [jasmine-reporters](https://github.com/larrymyers/jasmine-reporters).  
    + Added new task option `reporters`. This object defines enabled reporters to be used in conjunction. See documentation.  
    + Deprecated task options: `showColors` and `verboseReport`. These are refactored under `reporters.console` object.  
    + Console Reporter: Added new option: `cleanStack`.  
    + Added support for adding custom reporters. See `customReporters` task option.  
    + Better output for Grunt `--verbose` command.  
    + Code revisions and clean-up.  

    ---

- v0.4.1 (2015-03-03)  
    + Console Reporter: Fixes for `null` stack trace & peer jasmine-core. ([PR #3](https://github.com/onury/grunt-jasmine-nodejs/pull/3) by [@fiznool](https://github.com/fiznool))  

    ---
  
- v0.4.0 (2015-03-01)  
    + Fixed a concatenation issue that would prevent helper-files from loading. (Fixes [Issue #1](https://github.com/onury/grunt-jasmine-nodejs/issues/1))  
    + Added new task option `verboseReport` which reports a verbose list of all suites.  
    + Console Reporter: Improved reporter output.  
    + Updated test example (added helper file).  
    + Code clean-up.  

    ---
  
- v0.3.5 (2015-02-12)  
    + Console Reporter: Cleaner error stacks. Filtered out lines with jasmine-core path.  
    + Fixed a typo that caused the task to throw a `TypeError` when a test fails.  
    + Console Reporter: Better reporter console output.  

    ---
  
- v0.3.1 (2015-02-07)  
    + Console Reporter: Fixed timer (zero elapsed time) issue.  

    ---
  
- v0.3.0 (2015-02-07)  
    + Updated Jasmine-core to latest version (2.2.1).  
    + Added reporter for Jasmine output.  

  
 