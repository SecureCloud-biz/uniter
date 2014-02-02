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
    '../tools',
    '../../tools',
    'js/util',
    'languages/PHP/interpreter/Error/Fatal'
], function (
    engineTools,
    phpTools,
    util,
    PHPFatalError
) {
    'use strict';

    describe('PHP Engine class statement integration', function () {
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
            'class that does not extend or implement': {
                code: util.heredoc(function (/*<<<EOS
<?php
    class Test {}

    $object = new Test();

    var_dump($object);
EOS
*/) {}),
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: util.heredoc(function (/*<<<EOS
object(Test)#1 (0) {
}

EOS
*/) {})
            },
            // Test for pre-hoisting
            'instantiating a class before its definition outside of any blocks eg. conditionals': {
                code: util.heredoc(function (/*<<<EOS
<?php
    var_dump(new FunTime);

    class FunTime {}
EOS
*/) {}),
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: util.heredoc(function (/*<<<EOS
object(FunTime)#1 (0) {
}

EOS
*/) {})
            },
            'instantiating a class before its definition where definition is inside of a conditional': {
                code: util.heredoc(function (/*<<<EOS
<?php
    var_dump(new FunTime);

    if (true) {
        class FunTime {}
    }
EOS
*/) {}),
                expectedException: {
                    instanceOf: PHPFatalError,
                    match: /^PHP Fatal error: Class 'FunTime' not found$/
                },
                expectedStderr: 'PHP Fatal error: Class \'FunTime\' not found',
                expectedStdout: ''
            },
            'instantiating a class before its definition where definition is inside of a function': {
                code: util.heredoc(function (/*<<<EOS
<?php
    function doDeclare() {
        var_dump(new FunTime);

        class FunTime {}
    }

    doDeclare();
EOS
*/) {}),
                expectedException: {
                    instanceOf: PHPFatalError,
                    match: /^PHP Fatal error: Class 'FunTime' not found$/
                },
                expectedStderr: 'PHP Fatal error: Class \'FunTime\' not found',
                expectedStdout: ''
            },
            'instantiating a class before its definition where definition is inside of a while loop': {
                code: util.heredoc(function (/*<<<EOS
<?php
    $a = 1;

    while ($a--) {
        var_dump(new FunTime);

        class FunTime {}
    }
EOS
*/) {}),
                expectedException: {
                    instanceOf: PHPFatalError,
                    match: /^PHP Fatal error: Class 'FunTime' not found$/
                },
                expectedStderr: 'PHP Fatal error: Class \'FunTime\' not found',
                expectedStdout: ''
            },
            'instantiating a class before its definition where definition is inside of a foreach loop': {
                code: util.heredoc(function (/*<<<EOS
<?php
    $items = array(1);

    foreach ($items as $item) {
        var_dump(new FunTime);

        class FunTime {}
    }
EOS
*/) {}),
                expectedException: {
                    instanceOf: PHPFatalError,
                    match: /^PHP Fatal error: Class 'FunTime' not found$/
                },
                expectedStderr: 'PHP Fatal error: Class \'FunTime\' not found',
                expectedStdout: ''
            },
            'class with one public property': {
                code: util.heredoc(function (/*<<<EOS
<?php
    class OnePub {
        public $prop = 'ok';
    }

    var_dump(new OnePub);
EOS
*/) {}),
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: util.heredoc(function (/*<<<EOS
object(OnePub)#1 (1) {
  ["prop"]=>
  string(2) "ok"
}

EOS
*/) {})
            },
            'class with one public method': {
                code: util.heredoc(function (/*<<<EOS
<?php
    class Test {
        public function doIt() {
            echo 21;
        }
    }

    $object = new Test();
    $object->doIt();
EOS
*/) {}),
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: util.heredoc(function (/*<<<EOS
21
EOS
*/) {})
            },
            'class with one public method using $this variable': {
                code: util.heredoc(function (/*<<<EOS
<?php
    class Test {
        public function dumpMe() {
            var_dump($this);
        }
    }

    $object = new Test();
    $object->dumpMe();
EOS
*/) {}),
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: util.heredoc(function (/*<<<EOS
object(Test)#1 (0) {
}

EOS
*/) {})
            },
            'class with magic __invoke(...) method': {
                code: util.heredoc(function (/*<<<EOS
<?php
    class CallableClass {
        public function __invoke() {
            echo 'in here';

            return 7;
        }
    }

    $object = new CallableClass();
    return $object();
EOS
*/) {}),
                expectedResult: 7,
                expectedResultType: 'integer',
                expectedStderr: '',
                expectedStdout: 'in here'
            }
        }, function (scenario, description) {
            describe(description, function () {
                check(scenario);
            });
        });
    });
});
