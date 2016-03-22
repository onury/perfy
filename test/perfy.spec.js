
var perfy = require('../index');

/**
 *  Test: perfy
 *  @module perfy.spec
 */
describe('Test: perfy', function () {

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

    it('should return zero pad milliseconds in time and summary', function (done) {
        perfy.start('m1');
        setTimeout(function () {
            var result = perfy.end('m1');
            expect(result.time).toEqual(Number('0.0' + Math.round(result.milliseconds)));
            expect(result.summary).toEqual('m1: ' + '0.0' + Math.round(result.milliseconds) + ' sec.');
            done();
        }, 15);
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

    it('should count/get names', function () {
        perfy.start('m4');
        perfy.start('m5');
        perfy.start('m6');
        expect(perfy.count()).toEqual(4);
        var names = perfy.names();
        expect(names).toContain('m2');
        expect(names).toContain('m6');
        expect(names.length).toEqual(perfy.count());
    });

    it('should get result', function () {
        var result = perfy.result('m2');
        expect(Boolean(result)).toEqual(true);
        expect(result.time).toEqual(jasmine.any(Number));
    });

    function throw_start() { return perfy.start(); }
    function throw_end() { return perfy.end(); }
    function throw_exists() { return perfy.exists(); }
    function throw_destroy() { return perfy.destroy(); }
    function throw_result() { return perfy.result(); }
    it('should throw if no name', function () {
        expect(throw_start).toThrow();
        expect(throw_end).toThrow();
        expect(throw_exists).toThrow();
        expect(throw_destroy).toThrow();
        expect(throw_result).toThrow();
    });

    it('should exec sync', function () {
        var c = 0, count = 10000,
            // sync op.
            result = perfy.exec(function () {
                while (c < count) { c += 1; }
                return c;
            });
        expect(result).toBeDefined();
        expect(result.time).toEqual(jasmine.any(Number));
        expect(result.name).toEqual('');
        expect(c).toEqual(count);
        // console.log(result);
    });

    it('should save/exec named sync', function () {
        var name = 'sync-op',
            result = perfy.exec(name, function () {
                var i = 0;
                while (i < 10000) { i += 1; }
            });
        expect(result).toBeDefined();
        expect(result.time).toEqual(jasmine.any(Number));
        expect(perfy.result(name)).toBeDefined();
        expect(perfy.exists(name)).toEqual(true);
    });

    it('should exec async', function (jasmineDone) {
        perfy.destroyAll().exec(function (done) {
            setTimeout(function () {
                var result = done();
                expect(result).toBeDefined();
                expect(result.time).toBeGreaterThan(1);
                expect(result.name).toEqual('');
                expect(perfy.count()).toEqual(0);
                jasmineDone();
            }, 1100);
        });
    });

    it('should save/exec named async', function (jasmineDone) {
        perfy.exec('async-op', function (done) {
            setTimeout(function () {
                var result = done();
                expect(result.name).toEqual('async-op');
                expect(perfy.count()).toEqual(1);
                jasmineDone();
            }, 1100);
        });
    });

});
