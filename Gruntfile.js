/*jslint node, white, this, for */

module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        jasmine_nodejs: grunt.file.readYAML('config/jasmine.conf.yml')
    });

    grunt.loadNpmTasks('grunt-jasmine-nodejs');

    grunt.registerTask('default', ['jasmine_nodejs:test']);

};
