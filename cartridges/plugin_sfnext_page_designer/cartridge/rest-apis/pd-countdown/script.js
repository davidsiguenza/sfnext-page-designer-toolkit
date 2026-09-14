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
var RESTResponseMgr = require('dw/system/RESTResponseMgr');
exports.getSchedule = function () {
    response.setExpires(0);
    var id = request.httpParameterMap.c_campaign_id.stringValue;
    var campaign = id ? PromotionMgr.getCampaign(id) : null;
    var result = { status: 'missing', start: null, end: null };
    if (campaign) {
        result.campaignId = campaign.ID;
        result.status = campaign.enabled ? 'ready' : 'disabled';
        if (campaign.enabled) {
            result.start = campaign.startDate ? campaign.startDate.getTime() : null;
            result.end = campaign.endDate ? campaign.endDate.getTime() : null;
            if (result.start !== null && result.end !== null && result.end <= result.start) result.status = 'invalid';
        }
    }
    RESTResponseMgr.createSuccess(result).render();
};
exports.getSchedule.public = true;
