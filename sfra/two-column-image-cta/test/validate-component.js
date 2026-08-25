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

var projectRoot = path.resolve(__dirname, '..');
var componentBase = path.join(
    projectRoot,
    'cartridges/app_custom_pd_components/cartridge/experience/components/commerce_assets/twoColumnImageCta'
);
var metaPath = componentBase + '.json';
var scriptPath = componentBase + '.js';
var templatePath = path.join(
    projectRoot,
    'cartridges/app_custom_pd_components/cartridge/templates/default/experience/components/commerce_assets/twoColumnImageCta.isml'
);
var cssPath = path.join(
    projectRoot,
    'cartridges/app_custom_pd_components/cartridge/static/default/css/experience/components/commerceAssets/twoColumnImageCta.css'
);
var thumbnailPath = path.join(
    projectRoot,
    'cartridges/app_custom_pd_components/cartridge/static/default/experience/components/commerce_assets/twoColumnImageCta.svg'
);
var testPageBase = path.join(
    projectRoot,
    'cartridges/app_custom_pd_components/cartridge/experience/pages/twoColumnComponentTestPage'
);
var testPageMetaPath = testPageBase + '.json';
var testPageScriptPath = testPageBase + '.js';
var testPageTemplatePath = path.join(
    projectRoot,
    'cartridges/app_custom_pd_components/cartridge/templates/default/experience/pages/twoColumnComponentTestPage.isml'
);
var bmCartridgeBase = path.join(
    projectRoot,
    'cartridges/bm_custom_pd_components/cartridge'
);
var colorPickerEditorBase = path.join(
    bmCartridgeBase,
    'experience/editors/custom_pd/colorpicker'
);
var colorPickerClientBase = path.join(
    bmCartridgeBase,
    'static/default/experience/editors/custom_pd/colorpicker'
);
var bmPropertiesPath = path.join(bmCartridgeBase, 'bm_custom_pd_components.properties');
var colorPickerMetaPath = colorPickerEditorBase + '.json';
var colorPickerServerPath = colorPickerEditorBase + '.js';
var colorPickerClientPath = colorPickerClientBase + '.js';
var colorPickerCssPath = colorPickerClientBase + '.css';
var bmProjectPath = path.join(projectRoot, 'cartridges/bm_custom_pd_components/.project');

[metaPath, scriptPath, templatePath, cssPath, thumbnailPath, testPageMetaPath,
    testPageScriptPath, testPageTemplatePath, bmPropertiesPath, colorPickerMetaPath,
    colorPickerServerPath, colorPickerClientPath, colorPickerCssPath, bmProjectPath].forEach(function (filePath) {
    assert.ok(fs.existsSync(filePath), 'Missing expected file: ' + filePath);
});

var meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

assert.strictEqual(meta.name, 'Two columns · Image, text and CTA');
assert.strictEqual(meta.group, 'commerce_assets');
assert.ok(Array.isArray(meta.region_definitions));
assert.strictEqual(meta.region_definitions.length, 0);
assert.ok(Array.isArray(meta.attribute_definition_groups));
assert.ok(meta.attribute_definition_groups.length > 0);

var groupIds = {};
var attributeIds = {};
var customColorAttributeIds = [
    'titleBackgroundColorOne',
    'titleTextColorOne',
    'titleBackgroundColorTwo',
    'titleTextColorTwo',
    'sectionBackgroundColor',
    'bodyTextColor',
    'buttonBackgroundColor',
    'buttonTextColor'
];

meta.attribute_definition_groups.forEach(function (group) {
    assert.ok(group.id, 'Every group needs an id');
    assert.ok(!groupIds[group.id], 'Duplicate group id: ' + group.id);
    groupIds[group.id] = true;
    assert.ok(Array.isArray(group.attribute_definitions));

    group.attribute_definitions.forEach(function (attribute) {
        assert.ok(attribute.id, 'Every attribute needs an id');
        assert.ok(attribute.type, 'Every attribute needs a type: ' + attribute.id);
        assert.ok(!attributeIds[attribute.id], 'Duplicate attribute id: ' + attribute.id);
        attributeIds[attribute.id] = attribute;

        if (attribute.type === 'enum') {
            assert.ok(Array.isArray(attribute.values) && attribute.values.length > 0);
            attribute.values.forEach(function (value) {
                assert.strictEqual(typeof value, 'string', 'Enum values must be strings: ' + attribute.id);
            });
            assert.ok(attribute.values.indexOf(attribute.default_value) > -1);
        }

        if (attribute.type === 'image') {
            assert.ok(!Object.prototype.hasOwnProperty.call(attribute, 'default_value'));
            assert.ok(!Object.prototype.hasOwnProperty.call(attribute, 'editor_definition'));
        }

        if (attribute.type === 'custom') {
            assert.ok(
                customColorAttributeIds.indexOf(attribute.id) > -1,
                'Unexpected custom attribute: ' + attribute.id
            );
            assert.deepStrictEqual(attribute.editor_definition, { type: 'custom_pd.colorpicker' });
            assert.ok(!Object.prototype.hasOwnProperty.call(attribute, 'default_value'));
        }
    });
});

[
    'imageOne',
    'imageTwo',
    'showTitleBandOne',
    'showTitleBandTwo',
    'alignButtons',
    'titleBackgroundPresetOne',
    'titleBackgroundPresetTwo',
    'titleBackgroundColorOne',
    'titleBackgroundColorTwo'
].forEach(function (id) {
    assert.ok(attributeIds[id], 'Missing required product feature attribute: ' + id);
});

customColorAttributeIds.forEach(function (id) {
    assert.strictEqual(attributeIds[id].type, 'custom', 'Color override must use the visual picker: ' + id);
});

var colorPickerMeta = JSON.parse(fs.readFileSync(colorPickerMetaPath, 'utf8'));
assert.strictEqual(colorPickerMeta.name, 'Visual color picker');
assert.deepStrictEqual(colorPickerMeta.resources.scripts, [
    '/experience/editors/custom_pd/colorpicker.js'
]);
assert.deepStrictEqual(colorPickerMeta.resources.styles, [
    '/experience/editors/custom_pd/colorpicker.css'
]);

var colorPickerServer = fs.readFileSync(colorPickerServerPath, 'utf8');
assert.ok(colorPickerServer.indexOf('module.exports.init') > -1);

var bmProperties = fs.readFileSync(bmPropertiesPath, 'utf8');
assert.ok(bmProperties.indexOf('demandware.cartridges.bm_custom_pd_components.id=bm_custom_pd_components') > -1);

var bmProject = fs.readFileSync(bmProjectPath, 'utf8');
assert.ok(bmProject.indexOf('<name>bm_custom_pd_components</name>') > -1);

var script = fs.readFileSync(scriptPath, 'utf8');
assert.ok(script.indexOf("Template('experience/components/commerce_assets/twoColumnImageCta')") > -1);

var template = fs.readFileSync(templatePath, 'utf8');
assert.ok(template.indexOf('object-position') === -1, 'Focal positioning belongs in the component CSS');
assert.ok(template.indexOf('pd-two-column-promo--align-buttons') > -1);
assert.ok(template.indexOf('pdict.stylesheetUrl') > -1);
assert.strictEqual(template.indexOf("scripts/assets"), -1, 'Component must be previewable without SFRA assets.js');

var testPageMeta = JSON.parse(fs.readFileSync(testPageMetaPath, 'utf8'));
assert.strictEqual(testPageMeta.name, 'Test · Two columns');
assert.strictEqual(testPageMeta.region_definitions[0].name, 'Test component');
assert.strictEqual(testPageMeta.region_definitions.length, 1);
assert.strictEqual(testPageMeta.region_definitions[0].id, 'main');
assert.strictEqual(testPageMeta.region_definitions[0].max_components, 1);
assert.deepStrictEqual(testPageMeta.region_definitions[0].component_type_inclusions, [
    { type_id: 'commerce_assets.twoColumnImageCta' }
]);

var testPageScript = fs.readFileSync(testPageScriptPath, 'utf8');
assert.ok(testPageScript.indexOf("PageMgr.renderRegion(page.getRegion('main'))") > -1);
assert.ok(testPageScript.indexOf("Template('experience/pages/twoColumnComponentTestPage')") > -1);

var css = fs.readFileSync(cssPath, 'utf8');
assert.ok(css.indexOf('object-fit: cover') > -1);
assert.ok(css.indexOf('object-position: var(--pd-two-column-focus-x') > -1);
assert.ok(css.indexOf('margin-top: auto') > -1);
assert.ok(css.indexOf('@media (max-width: 767.98px)') > -1);

console.log('Component structure validation passed.');
