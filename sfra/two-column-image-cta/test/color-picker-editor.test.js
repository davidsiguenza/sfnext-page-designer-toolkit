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
var path = require('path');

var colorPicker = require(path.resolve(
    __dirname,
    '../cartridges/bm_custom_pd_components/cartridge/static/default/experience/editors/custom_pd/colorpicker.js'
));
var fs = require('fs');
var colorPickerClient = fs.readFileSync(path.resolve(
    __dirname,
    '../cartridges/bm_custom_pd_components/cartridge/static/default/experience/editors/custom_pd/colorpicker.js'
), 'utf8');

assert.strictEqual(colorPicker.extractValue('#0057b8'), '#0057b8');
assert.strictEqual(colorPicker.extractValue({ value: ' #FFFFFF ' }), '#FFFFFF');
assert.strictEqual(colorPicker.extractValue({ color: '#222222' }), '#222222');
assert.strictEqual(colorPicker.extractValue(null), '');

assert.strictEqual(colorPicker.normalizeHex('#abc'), '#AABBCC');
assert.strictEqual(colorPicker.normalizeHex('#00a1e0'), '#00A1E0');
assert.strictEqual(colorPicker.normalizeHex('rgb(0, 0, 0)'), '');
assert.strictEqual(colorPicker.normalizeValue(' #fff '), '#FFFFFF');
assert.strictEqual(colorPicker.normalizeValue(' rgb(0, 0, 0) '), 'rgb(0, 0, 0)');

assert.strictEqual(colorPicker.isValidCssColor('#0057b8'), true);
assert.strictEqual(colorPicker.isValidCssColor('rgb(0, 87, 184)'), true);
assert.strictEqual(colorPicker.isValidCssColor('var(--brand-primary, #0057b8)'), true);
assert.strictEqual(colorPicker.isValidCssColor('red; background: blue'), false);
assert.strictEqual(colorPicker.DEFAULT_PALETTE.length, 8);
assert.ok(colorPickerClient.indexOf('Choose a color.') > -1);
assert.ok(colorPickerClient.indexOf('SFRA quick palette') > -1);
assert.ok(colorPickerClient.indexOf('>Clear<') > -1);

console.log('Color picker editor validation passed.');
