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
var URLUtils = require('dw/web/URLUtils');
var helpers = require('*/cartridge/scripts/experience/twoColumnImageCtaHelpers');

var ASPECT_RATIOS = ['landscape_3_2', 'landscape_4_3', 'square_1_1', 'portrait_4_5'];
var GAPS = ['small', 'medium', 'large'];
var ALIGNMENTS = ['left', 'center', 'right'];
var SPACINGS = ['none', 'small', 'medium', 'large'];

/**
 * Supports both dw.util.Map and plain objects used by local tests.
 * @param {dw.util.Map|Object} content processed component attributes
 * @param {string} attributeID attribute identifier
 * @returns {*} resolved attribute value
 */
function getContentValue(content, attributeID) {
    if (content && typeof content.get === 'function') {
        return content.get(attributeID);
    }

    return content ? content[attributeID] : null;
}

/**
 * @param {Object} image dw.experience.image.Image
 * @returns {Object} template-safe image model
 */
function getImageModel(image) {
    var focalPoint = helpers.getFocalPoint(image);
    var file = image && image.file;
    var metadata = image && image.metaData;

    return {
        url: file ? String(file.absURL) : '',
        width: metadata && metadata.width ? Number(metadata.width) : 0,
        height: metadata && metadata.height ? Number(metadata.height) : 0,
        focalPointX: focalPoint.x,
        focalPointY: focalPoint.y
    };
}

/**
 * @param {dw.util.Map} content processed Page Designer attributes
 * @param {string} suffix One or Two
 * @param {Object} colorFallbacks preset fallbacks for the column
 * @returns {Object} column view model
 */
function getColumnModel(content, suffix, colorFallbacks) {
    var title = getContentValue(content, 'title' + suffix) || '';
    var decorativeImage = getContentValue(content, 'decorativeImage' + suffix) === true;
    var configuredAlt = getContentValue(content, 'imageAlt' + suffix) || '';

    return {
        image: getImageModel(getContentValue(content, 'image' + suffix)),
        alt: decorativeImage ? '' : (configuredAlt || title),
        title: title,
        showTitleBand: getContentValue(content, 'showTitleBand' + suffix) !== false,
        description: getContentValue(content, 'description' + suffix) || '',
        ctaLabel: getContentValue(content, 'ctaLabel' + suffix) || '',
        ctaUrl: getContentValue(content, 'ctaUrl' + suffix) || '',
        openInNewTab: getContentValue(content, 'openInNewTab' + suffix) === true,
        titleBackground: helpers.resolveColor(
            getContentValue(content, 'titleBackgroundPreset' + suffix),
            getContentValue(content, 'titleBackgroundColor' + suffix),
            colorFallbacks.background
        ),
        titleTextColor: helpers.resolveColor(
            getContentValue(content, 'titleTextPreset' + suffix),
            getContentValue(content, 'titleTextColor' + suffix),
            colorFallbacks.text
        )
    };
}

/**
 * Render logic for the two-column image, text and CTA component.
 * @param {dw.experience.ComponentScriptContext} context component context
 * @returns {string} rendered component markup
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;
    var componentID = context.component && context.component.ID;

    model.put('componentId', 'pd-two-column-' + helpers.toHtmlId(componentID));
    model.put('stylesheetUrl', URLUtils.staticURL(
        '/css/experience/components/commerceAssets/twoColumnImageCta.css'
    ).toString());
    model.put('sectionTitle', content.sectionTitle || '');
    model.put('aspectRatio', helpers.allowEnum(content.aspectRatio, ASPECT_RATIOS, 'landscape_3_2'));
    model.put('gap', helpers.allowEnum(content.gap, GAPS, 'medium'));
    model.put('contentAlignment', helpers.allowEnum(content.contentAlignment, ALIGNMENTS, 'center'));
    model.put('verticalSpacing', helpers.allowEnum(content.verticalSpacing, SPACINGS, 'medium'));
    model.put('alignButtons', content.alignButtons !== false);

    model.put('sectionBackground', helpers.resolveColor(
        content.sectionBackgroundPreset,
        content.sectionBackgroundColor,
        'theme_background'
    ));
    model.put('bodyTextColor', helpers.resolveColor(
        content.bodyTextPreset,
        content.bodyTextColor,
        'theme_text'
    ));
    model.put('buttonBackground', helpers.resolveColor(
        content.buttonBackgroundPreset,
        content.buttonBackgroundColor,
        'theme_primary'
    ));
    model.put('buttonTextColor', helpers.resolveColor(
        content.buttonTextPreset,
        content.buttonTextColor,
        'theme_primary_inverse'
    ));

    model.put('columnOne', getColumnModel(content, 'One', {
        background: 'theme_primary',
        text: 'theme_primary_inverse'
    }));
    model.put('columnTwo', getColumnModel(content, 'Two', {
        background: 'theme_heading',
        text: 'theme_heading_inverse'
    }));

    return new Template('experience/components/commerce_assets/twoColumnImageCta').render(model).text;
};
