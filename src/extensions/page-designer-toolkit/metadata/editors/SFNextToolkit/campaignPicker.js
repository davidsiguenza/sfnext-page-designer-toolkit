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
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Site = require('dw/system/Site');
module.exports.init = function (editor) {
    var campaigns = [];
    var iterator = PromotionMgr.getCampaigns().iterator();
    while (iterator.hasNext()) {
        var campaign = iterator.next();
        campaigns.push({
            id: campaign.ID,
            enabled: campaign.enabled,
            start: campaign.startDate ? campaign.startDate.toISOString() : null,
            end: campaign.endDate ? campaign.endDate.toISOString() : null,
        });
    }
    campaigns.sort(function (left, right) {
        return left.id.localeCompare(right.id);
    });
    editor.configuration.put('campaigns', campaigns);
    editor.configuration.put('siteId', Site.current.ID);
};
