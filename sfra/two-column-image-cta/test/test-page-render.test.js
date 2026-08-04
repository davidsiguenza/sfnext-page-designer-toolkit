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

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var pageScriptPath = path.resolve(
    __dirname,
    '../cartridges/app_custom_pd_components/cartridge/experience/pages/twoColumnComponentTestPage.js'
);
var capturedModel;
var capturedRegion;

function HashMap() {}

HashMap.prototype.put = function (key, value) {
    this[key] = value;
};

function Template(templatePath) {
    this.templatePath = templatePath;
}

Template.prototype.render = function (model) {
    capturedModel = model;
    return { text: 'rendered-test-page' };
};

var pageModule = { exports: {} };
var sandbox = {
    module: pageModule,
    exports: pageModule.exports,
    require: function (moduleID) {
        if (moduleID === 'dw/util/Template') {
            return Template;
        }

        if (moduleID === 'dw/util/HashMap') {
            return HashMap;
        }

        if (moduleID === 'dw/experience/PageMgr') {
            return {
                renderRegion: function (region) {
                    capturedRegion = region;
                    return '<div class="experience-region">Rendered component</div>';
                }
            };
        }

        throw new Error('Unexpected module: ' + moduleID);
    }
};

vm.runInNewContext(fs.readFileSync(pageScriptPath, 'utf8'), sandbox, {
    filename: pageScriptPath
});

var mainRegion = { ID: 'main' };
var page = {
    ID: 'test-page',
    getRegion: function (regionID) {
        assert.strictEqual(regionID, 'main');
        return mainRegion;
    }
};

var result = pageModule.exports.render({ page: page });

assert.strictEqual(result, 'rendered-test-page');
assert.strictEqual(capturedRegion, mainRegion);
assert.strictEqual(capturedModel.page, page);
assert.strictEqual(
    capturedModel.mainRegion,
    '<div class="experience-region">Rendered component</div>'
);

console.log('Standalone Page Designer test-page render test passed.');
