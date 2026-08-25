/**
 * Copyright 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageMgr = require('dw/experience/PageMgr');

/**
 * Renders a minimal Page Designer page without SFRA cartridge dependencies.
 * @param {dw.experience.PageScriptContext} context page render context
 * @returns {string} rendered page markup
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var page = context.page;

    model.put('page', page);
    model.put('mainRegion', PageMgr.renderRegion(page.getRegion('main')));

    return new Template('experience/pages/twoColumnComponentTestPage').render(model).text;
};
