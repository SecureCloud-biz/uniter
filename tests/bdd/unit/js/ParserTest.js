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
    'js/util',
    'js/Parser'
], function (
    util,
    Parser
) {
    'use strict';

    describe('Parser', function () {
        describe('parse()', function () {
            util.each([
                // A string with a single token when grammar contains a matching rule
                {
                    grammarSpec: {
                        rules: {
                            'number': {name: 'value', what: /^\d+/}
                        },
                        start: 'number'
                    },
                    text: '128',
                    expectedAST: {
                        name: 'number',
                        value: '128'
                    }
                },
                // "allOf" and "what" qualifiers
                {
                    grammarSpec: {
                        rules: {
                            'add': /^\+/,
                            'expression': [{name: 'left', what: 'number'}, {name: 'operator', what: 'add'}, {name: 'right', what: 'number'}],
                            'number': /^\d+/
                        },
                        start: 'expression'
                    },
                    text: '128+67',
                    expectedAST: {
                        name: 'expression',
                        left: '128',
                        operator: '+',
                        right: '67'
                    }
                },
                // "oneOf" qualifier w/name
                {
                    grammarSpec: {
                        rules: {
                            'thing': [{name: 'value', oneOf: [(/^\d+/), (/^\w+/)]}, (/;/)]
                        },
                        start: 'thing'
                    },
                    text: 'hello;',
                    expectedAST: {
                        name: 'thing',
                        value: 'hello'
                    }
                },
                // Whitespace delimiter
                {
                    grammarSpec: {
                        ignore: 'whitespace',
                        rules: {
                            'add': /\+/,
                            'expression': [{name: 'left', what: 'number'}, {name: 'operator', what: 'add'}, {name: 'right', what: 'number'}],
                            'number': /\d+/,
                            'whitespace': /\s+/
                        },
                        start: 'expression'
                    },
                    text: '321 + 89',
                    expectedAST: {
                        name: 'expression',
                        left: '321',
                        operator: '+',
                        right: '89'
                    }
                }
            ], function (scenario) {
                var grammarSpecString = JSON.stringify(scenario.grammarSpec, function (key, value) {
                    if (value instanceof RegExp) {
                        return value.toString();
                    }
                    return value;
                });

                it('should return the correct AST when the grammar spec is ' + grammarSpecString, function () {
                    var parser = new Parser(scenario.grammarSpec);

                    expect(parser.parse(scenario.text)).to.deep.equal(scenario.expectedAST);
                });
            });

            describe('when using grammar spec #1', function () {
                var grammarSpec,
                    parser;

                beforeEach(function () {
                    /*
                     * Based on this EBNF grammar
                     * - from http://stackoverflow.com/questions/6805172/how-do-you-abstract-some-expression-to-bnf#answer-6805185
                     *
                     * AEXP => AS+
                     * AS   => id ':=' EX1 ';'
                     * EX1  => EX2 (('+' | '-') EX2)*
                     * EX2  => EX3 (('*' | '/') EX3)*
                     * EX3  => EX4 ('^' EX3)*
                     * EX4  => ('+'|'-')? EX5
                     * EX5  => id | number | '(' EX1 ')'
                     */
                    grammarSpec = {
                        ignore: 'whitespace',
                        rules: {
                            'assign': /:=/,
                            'character': /[;*\/^+-]/,
                            'id': /[\w$][\w\d$]*/,
                            'number': /\d(?:\.\d+)?/,
                            'whitespace': /\s+/,
                            'AEXP': {
                                components: {name: 'assignment', oneOrMoreOf: 'AS'}
                            },
                            'AS': {
                                components: [{name: 'target', what: 'id'}, 'assign', {name: 'expression', what: 'EX1'}, {'character': ';'}]
                            },
                            'EX1': {
                                captureAs: 'EX',
                                components: [{name: 'left', what: 'EX2'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', oneOf: [{'character': '+'}, {'character': '-'}]}, {name: 'operand', what: 'EX2'}]}],
                                ifNoMatch: {component: 'right', capture: 'left'}
                            },
                            'EX2': {
                                captureAs: 'EX',
                                components: [{name: 'left', what: 'EX3'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', oneOf: [{'character': '*'}, {'character': '/'}]}, {name: 'operand', what: 'EX3'}]}],
                                ifNoMatch: {component: 'right', capture: 'left'}
                            },
                            'EX3': {
                                captureAs: 'EX',
                                components: [{name: 'left', what: 'EX4'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: {'character': '^'}}, {name: 'operand', rule: 'EX3'}]}],
                                ifNoMatch: {component: 'right', capture: 'left'}
                            },
                            'EX4': {
                                captureAs: 'EX',
                                components: [{name: 'operator', optionally: {oneOf: [{'character': '+'}, {'character': '-'}]}}, {name: 'operand', what: 'EX5'}],
                                ifNoMatch: {component: 'operator', capture: 'operand'}
                            },
                            'EX5': {
                                components: [{oneOf: ['id', 'number', [{'character': '('}, 'EX1', {'character': ')'}]]}]
                            }
                        },
                        start: 'AEXP'
                    };

                    parser = new Parser(grammarSpec);
                });

                util.each([
                    {
                        text: 'waldo:=1;',
                        expectedAST: {
                            name: 'AEXP',
                            assignment: [{
                                name: 'AS',
                                target: 'waldo',
                                expression: '1'
                            }]
                        }
                    },
                    {
                        text: 'waldo:=2+3;',
                        expectedAST: {
                            name: 'AEXP',
                            assignment: [{
                                name: 'AS',
                                target: 'waldo',
                                expression: {
                                    name: 'EX',
                                    left: '2',
                                    right: [{
                                        operator: '+',
                                        operand: '3'
                                    }]
                                }
                            }]
                        }
                    },
                    {
                        // Precedence is equivalent to "waldo := (fern + (alpha / ((-beta) ^ gamma)));"
                        text: 'waldo := fern + alpha / -beta ^ gamma;',
                        expectedAST: {
                            name: 'AEXP',
                            assignment: [{
                                name: 'AS',
                                target: 'waldo',
                                expression: {
                                    name: 'EX',
                                    left: 'fern',
                                    right: [{
                                        operator: '+',
                                        operand: {
                                            name: 'EX',
                                            left: 'alpha',
                                            right: [{
                                                operator: '/',
                                                operand: {
                                                    name: 'EX',
                                                    left: {
                                                        name: 'EX',
                                                        operator: '-',
                                                        operand: 'beta'
                                                    },
                                                    right: [{
                                                        operator: '^',
                                                        operand: 'gamma'
                                                    }]
                                                }
                                            }]
                                        }
                                    }]
                                }
                            }]
                        }
                    }
                ], function (scenario) {
                    it('should return the correct AST when the text is "' + scenario.text + '"', function () {
                        //console.log('\nactual: ' + JSON.stringify(util.sortObject(parser.parse(scenario.text)), null, 4));
                        //console.log('expected: ' + JSON.stringify(util.sortObject(scenario.expectedAST), null, 4));

                        expect(parser.parse(scenario.text)).to.deep.equal(scenario.expectedAST);
                    });
                });
            });
        });
    });
});