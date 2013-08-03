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
    'js/util'
], function (
    util
) {
    'use strict';

    function Recompiler(spec) {
        this.spec = spec;
    }

    util.extend(Recompiler.prototype, {
        recompile: function (ast) {

        }
    });

    return Recompiler;
});
