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

var helpers = require(path.resolve(
    __dirname,
    '../cartridges/app_custom_pd_components/cartridge/scripts/experience/twoColumnImageCtaHelpers'
));

assert.strictEqual(helpers.toPercent(0), 0);
assert.strictEqual(helpers.toPercent(0.5), 50);
assert.strictEqual(helpers.toPercent(1), 100);
assert.strictEqual(helpers.toPercent(75), 75);
assert.strictEqual(helpers.toPercent(150), 100);
assert.strictEqual(helpers.toPercent(-1), 0);
assert.strictEqual(helpers.toPercent(null), 50);
assert.strictEqual(helpers.toPercent('not-a-number'), 50);

assert.deepStrictEqual(helpers.getFocalPoint({ focalPoint: { x: 0.25, y: 0.8 } }), { x: 25, y: 80 });
assert.deepStrictEqual(helpers.getFocalPoint(null), { x: 50, y: 50 });

assert.strictEqual(helpers.getColorValue({ value: '#123456' }), '#123456');
assert.strictEqual(helpers.getColorValue({ color: '#abcdef' }), '#abcdef');
assert.strictEqual(helpers.getColorValue(' red '), 'red');

['#fff', '#ffffff', '#ffffffff', 'rgb(1, 2, 3)', 'hsl(20, 50%, 40%)', 'rebeccapurple', 'var(--brand-color, #fff)'].forEach(function (color) {
    assert.strictEqual(helpers.isSafeCssColor(color), true, 'Expected safe color: ' + color);
});

['#12', '#12345', 'red; background:url(test)', 'url(https://example.com)', 'var(color)', '" onmouseover="alert(1)'].forEach(function (color) {
    assert.strictEqual(helpers.isSafeCssColor(color), false, 'Expected rejected color: ' + color);
});

assert.strictEqual(helpers.resolveColor('custom', { value: '#123456' }, 'theme_primary'), '#123456');
assert.strictEqual(
    helpers.resolveColor('custom', { value: 'red; background:url(test)' }, 'theme_primary'),
    helpers.THEME_COLORS.theme_primary
);
assert.strictEqual(helpers.resolveColor('theme_heading', null, 'theme_primary'), helpers.THEME_COLORS.theme_heading);
assert.strictEqual(helpers.resolveColor('unknown', null, 'theme_text'), helpers.THEME_COLORS.theme_text);

assert.strictEqual(helpers.allowEnum('center', ['left', 'center', 'right'], 'left'), 'center');
assert.strictEqual(helpers.allowEnum('invalid', ['left', 'center', 'right'], 'left'), 'left');
assert.strictEqual(helpers.toHtmlId('component.foo/bar'), 'component-foo-bar');

console.log('Helper unit tests passed.');
