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

var projectRoot = path.resolve(__dirname, '..');
var componentScriptPath = path.join(
    projectRoot,
    'cartridges/app_custom_pd_components/cartridge/experience/components/commerce_assets/twoColumnImageCta.js'
);
var helpers = require(path.join(
    projectRoot,
    'cartridges/app_custom_pd_components/cartridge/scripts/experience/twoColumnImageCtaHelpers'
));

function HashMap() {}

HashMap.prototype.put = function (key, value) {
    this[key] = value;
};

function Template(templatePath) {
    this.templatePath = templatePath;
}

Template.prototype.render = function (model) {
    return {
        text: JSON.stringify({
            templatePath: this.templatePath,
            model: model
        })
    };
};

var componentModule = { exports: {} };
var sandbox = {
    module: componentModule,
    exports: componentModule.exports,
    require: function (moduleID) {
        if (moduleID === 'dw/util/Template') {
            return Template;
        }

        if (moduleID === 'dw/util/HashMap') {
            return HashMap;
        }

        if (moduleID === 'dw/web/URLUtils') {
            return {
                staticURL: function (url) {
                    return {
                        toString: function () {
                            return '/on/demandware.static/' + url;
                        }
                    };
                }
            };
        }

        if (moduleID === '*/cartridge/scripts/experience/twoColumnImageCtaHelpers') {
            return helpers;
        }

        throw new Error('Unexpected module: ' + moduleID);
    }
};

vm.runInNewContext(fs.readFileSync(componentScriptPath, 'utf8'), sandbox, {
    filename: componentScriptPath
});

var data = {
    aspectRatio: 'invalid-ratio',
    gap: 'large',
    contentAlignment: 'center',
    verticalSpacing: 'small',
    alignButtons: false,
    titleOne: 'Primera promoción',
    showTitleBandOne: false,
    imageOne: {
        file: { absURL: 'https://example.com/one.jpg' },
        focalPoint: { x: 0.2, y: 0.7 },
        metaData: { width: 1200, height: 800 }
    },
    titleBackgroundPresetOne: 'custom',
    titleBackgroundColorOne: { value: '#123456' },
    titleTextPresetOne: 'theme_primary_inverse',
    imageTwo: {
        file: { absURL: 'https://example.com/two.jpg' },
        focalPoint: { x: 0.8, y: 0.4 }
    },
    titleTwo: 'Segunda promoción',
    decorativeImageTwo: true,
    ctaLabelTwo: 'Discover',
    ctaUrlTwo: '/destination',
    openInNewTabTwo: true
};

var contentMap = {
    get: function (key) {
        return data[key];
    }
};

Object.keys(data).forEach(function (key) {
    contentMap[key] = data[key];
});

var rendered = componentModule.exports.render({
    component: { ID: 'component.foo/bar' },
    content: contentMap
});
var result = JSON.parse(rendered);
var model = result.model;

assert.strictEqual(result.templatePath, 'experience/components/commerce_assets/twoColumnImageCta');
assert.strictEqual(model.componentId, 'pd-two-column-component-foo-bar');
assert.strictEqual(
    model.stylesheetUrl,
    '/on/demandware.static//css/experience/components/commerceAssets/twoColumnImageCta.css'
);
assert.strictEqual(model.aspectRatio, 'landscape_3_2');
assert.strictEqual(model.gap, 'large');
assert.strictEqual(model.verticalSpacing, 'small');
assert.strictEqual(model.alignButtons, false);

assert.strictEqual(model.columnOne.image.url, 'https://example.com/one.jpg');
assert.strictEqual(model.columnOne.image.width, 1200);
assert.strictEqual(model.columnOne.image.height, 800);
assert.strictEqual(model.columnOne.image.focalPointX, 20);
assert.strictEqual(model.columnOne.image.focalPointY, 70);
assert.strictEqual(model.columnOne.alt, 'Primera promoción');
assert.strictEqual(model.columnOne.showTitleBand, false);
assert.strictEqual(model.columnOne.titleBackground, '#123456');

assert.strictEqual(model.columnTwo.alt, '');
assert.strictEqual(model.columnTwo.image.focalPointX, 80);
assert.strictEqual(model.columnTwo.image.focalPointY, 40);
assert.strictEqual(model.columnTwo.ctaLabel, 'Discover');
assert.strictEqual(model.columnTwo.ctaUrl, '/destination');
assert.strictEqual(model.columnTwo.openInNewTab, true);
assert.strictEqual(model.columnTwo.titleBackground, helpers.THEME_COLORS.theme_heading);

assert.strictEqual(model.sectionBackground, helpers.THEME_COLORS.theme_background);
assert.strictEqual(model.bodyTextColor, helpers.THEME_COLORS.theme_text);
assert.strictEqual(model.buttonBackground, helpers.THEME_COLORS.theme_primary);
assert.strictEqual(model.buttonTextColor, helpers.THEME_COLORS.theme_primary_inverse);

console.log('Component render-model test passed.');
