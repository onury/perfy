/*jslint node, white, this, for */
/*global jasmine, describe, xdescribe, fdescribe, before, beforeAll, beforeEach, after, afterAll, afterEach, it, fit, xit, expect, mostRecentAjaxRequest, qq, runs, spyOn, spyOnEvent, waitsFor, confirm, context */

/**
 *  Test: perfy
 *  @module perfy.spec
 */
describe('Test: perfy', function () {
    'use strict';

    var perfy = require('../index');

    // beforeAll(function () {});

    it('should return elapsed time', function (done) {
        perfy.start('m1');
        setTimeout(function () {
            var result = perfy.end('m1');
            expect(result).toEqual(jasmine.any(Object));
            expect(result.time).toEqual(jasmine.any(Number));
            expect(result.nanoseconds).toEqual(jasmine.any(Number));
            expect(result.milliseconds).toEqual(jasmine.any(Number));
            expect(perfy.count()).toEqual(0);
            done();
        }, 345);
    });

    it('should keep/destroy/auto-destroy perf instance', function (done) {
        expect(perfy.exists('m1')).toEqual(false);
        perfy.start('m2', false);
        perfy.start('m3', false);
        setTimeout(function () {
            perfy.end('m2');
            expect(perfy.exists('m2')).toEqual(true);
            expect(perfy.count()).toEqual(2);
            perfy.destroy('m3');
            expect(perfy.count()).toEqual(1);
            expect(perfy.exists('m3')).toEqual(false);
            done();
        }, 200);
    });

    it('should count, get names', function () {
        perfy.start('m4');
        perfy.start('m5');
        perfy.start('m6');
        expect(perfy.count()).toEqual(4);
        var names = perfy.names();
        expect(names).toContain('m2');
        expect(names).toContain('m6');
    });

    function resultM1() {
        perfy.result('m1');
    }

    it('should get result', function () {
        var result = perfy.result('m2');
        expect(!!result).toEqual(true);
        expect(result.time).toEqual(jasmine.any(Number));
        expect(resultM1).toThrow();
    });

});