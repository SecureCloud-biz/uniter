/*
 * Uniter - JavaScript PHP interpreter
 * Copyright 2013 Dan Phillimore (asmblah)
 * http://asmblah.github.com/uniter/
 *
 * Released under the MIT license
 * https://github.com/asmblah/uniter/raw/master/MIT-LICENSE.txt
 */

/*global define */
define([
    '../../../tools',
    '../../../../tools',
    'js/util'
], function (
    engineTools,
    phpTools,
    util
) {
    'use strict';

    describe('PHP Engine str_replace() builtin function integration', function () {
        var engine;

        function check(scenario) {
            engineTools.check(function () {
                return {
                    engine: engine
                };
            }, scenario);
        }

        beforeEach(function () {
            engine = phpTools.createEngine();
        });

        util.each({
            'simple replace of string with string': {
                code: '<?php return str_replace("a", "x", "abc");',
                expectedResult: 'xbc',
                expectedResultType: 'string',
                expectedStderr: '',
                expectedStdout: ''
            },
            'replace of array with string': {
                code: '<?php return str_replace(array("a", "c"), "x", "abc");',
                expectedResult: 'xbx',
                expectedResultType: 'string',
                expectedStderr: '',
                expectedStdout: ''
            },
            'replace of array with array': {
                code: '<?php return str_replace(array("a", "c"), array("x", "y"), "abc");',
                expectedResult: 'xby',
                expectedResultType: 'string',
                expectedStderr: '',
                expectedStdout: ''
            },
            'replace of array with array, when some replacements are missing': {
                code: '<?php return str_replace(array("a", "b"), array("x"), "abc");',
                expectedResult: 'xc', // `b` is simply discarded
                expectedResultType: 'string',
                expectedStderr: '',
                expectedStdout: ''
            },
            'recording replacement count when string,string and matches 3 times': {
                code: '<?php str_replace("a", "x", "aaabb", $count); return $count;',
                expectedResult: 3,
                expectedResultType: 'integer',
                expectedStderr: '',
                expectedStdout: ''
            },
            'recording replacement count when array,array and matches 4 times': {
                code: '<?php str_replace(array("a"), array("x"), "aaaabb", $count); return $count;',
                expectedResult: 4,
                expectedResultType: 'integer',
                expectedStderr: '',
                expectedStdout: ''
            }
        }, function (scenario, description) {
            describe(description, function () {
                check(scenario);
            });
        });
    });
});
