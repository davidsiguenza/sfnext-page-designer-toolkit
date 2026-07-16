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
/** @sfdc-extension-file SFDC_EXT_PAGE_DESIGNER_TOOLKIT */

export const SIZE_GUIDE_DATASET_VERSION = '2026-07-16' as const;

export type SizeGuideDatasetVersion = typeof SIZE_GUIDE_DATASET_VERSION;
export type SourceBrand = 'adidas' | 'new-balance' | 'nike' | 'vans';
export type SourceSizeSystem = 'brand' | 'eu';

export interface MeasurementRangeMm {
    min: number;
    max: number;
}

export interface MayoralApparelSizeRow {
    size: string;
    heightMm: number;
    chestMm: number;
    inseamMm: MeasurementRangeMm;
}

export interface MayoralApparelCollectionOverride {
    collection: string;
    size: string;
    heightMm: number;
    chestMm: number;
    waistMm: number;
    hipMm: number;
}

export interface MayoralFootwearSizeRow {
    size: string;
    /**
     * More than one value means that official Mayoral pages disagree and the
     * engine must evaluate every variant instead of silently choosing one.
     */
    footLengthMm: readonly number[];
}

export interface SourceApparelSizeRow {
    brand: SourceBrand;
    audience: 'kids';
    sizeSystem: 'brand';
    size: string;
    aliases: readonly string[];
    heightMm: MeasurementRangeMm;
    chestMm: MeasurementRangeMm;
    waistMm?: MeasurementRangeMm;
    hipMm?: MeasurementRangeMm;
}

export interface SourceFootwearSizeRow {
    brand: SourceBrand;
    audience: 'kids';
    sizeSystem: 'eu';
    size: string;
    aliases: readonly string[];
    /** Length associated with the source-brand size, not a universal EU conversion. */
    footLengthMm: number;
}

function range(min: number, max = min): MeasurementRangeMm {
    return { min, max };
}

/** General Mayoral child references, stored in canonical millimetres. */
export const MAYORAL_APPAREL_SIZES = [
    { size: '2', heightMm: 920, chestMm: 520, inseamMm: range(375, 380) },
    { size: '3', heightMm: 980, chestMm: 540, inseamMm: range(415) },
    { size: '4', heightMm: 1040, chestMm: 560, inseamMm: range(450, 455) },
    { size: '6', heightMm: 1160, chestMm: 600, inseamMm: range(530) },
    { size: '8', heightMm: 1280, chestMm: 650, inseamMm: range(610) },
    { size: '10', heightMm: 1400, chestMm: 690, inseamMm: range(650) },
    { size: '12', heightMm: 1520, chestMm: 730, inseamMm: range(690) },
    { size: '14', heightMm: 1570, chestMm: 770, inseamMm: range(730) },
    { size: '16', heightMm: 1620, chestMm: 810, inseamMm: range(780) },
] as const satisfies readonly MayoralApparelSizeRow[];

/** Collection-specific measurements take precedence over the general row. */
export const MAYORAL_APPAREL_COLLECTION_OVERRIDES = [
    {
        collection: 'boston-x-mayoral',
        size: '8',
        heightMm: 1280,
        chestMm: 665,
        waistMm: 600,
        hipMm: 700,
    },
] as const satisfies readonly MayoralApparelCollectionOverride[];

/** Mayoral child footwear references, including the unresolved size-30 discrepancy. */
export const MAYORAL_FOOTWEAR_SIZES = [
    { size: '18', footLengthMm: [112] },
    { size: '19', footLengthMm: [118] },
    { size: '20', footLengthMm: [124] },
    { size: '21', footLengthMm: [130] },
    { size: '22', footLengthMm: [136] },
    { size: '23', footLengthMm: [142] },
    { size: '24', footLengthMm: [148] },
    { size: '25', footLengthMm: [154] },
    { size: '26', footLengthMm: [160] },
    { size: '27', footLengthMm: [166] },
    { size: '28', footLengthMm: [173] },
    { size: '29', footLengthMm: [179] },
    { size: '30', footLengthMm: [185, 188] },
    { size: '31', footLengthMm: [191] },
    { size: '32', footLengthMm: [197] },
    { size: '33', footLengthMm: [204] },
    { size: '34', footLengthMm: [210] },
    { size: '35', footLengthMm: [216] },
    { size: '36', footLengthMm: [222] },
] as const satisfies readonly MayoralFootwearSizeRow[];

/**
 * Only source-brand rows present in the reviewed research are included. Missing
 * labels intentionally remain unsupported so the engine can fail closed.
 */
export const SOURCE_APPAREL_SIZES = [
    {
        brand: 'adidas',
        audience: 'kids',
        sizeSystem: 'brand',
        size: '7-8/128',
        aliases: ['7-8/128', '7-8 anos/128', '7-8 years/128', '128'],
        heightMm: range(1230, 1280),
        chestMm: range(640),
        waistMm: range(590),
        hipMm: range(680),
    },
    {
        brand: 'nike',
        audience: 'kids',
        sizeSystem: 'brand',
        size: 'S/8-10',
        aliases: ['s/8-10', 's 8-10', 's'],
        heightMm: range(1270, 1370),
        chestMm: range(660, 690),
        waistMm: range(610, 650),
        hipMm: range(710, 750),
    },
    {
        brand: 'vans',
        audience: 'kids',
        sizeSystem: 'brand',
        size: 'Boys S/US 8',
        aliases: ['boys s/us 8', 'boys s', 'chicos s/us 8', 'chicos s'],
        heightMm: range(1320, 1360),
        chestMm: range(660, 690),
    },
    {
        brand: 'vans',
        audience: 'kids',
        sizeSystem: 'brand',
        size: 'Girls S/US 7-8',
        aliases: ['girls s/us 7-8', 'girls s', 'chicas s/us 7-8', 'chicas s'],
        heightMm: range(1280, 1370),
        chestMm: range(660, 710),
    },
] as const satisfies readonly SourceApparelSizeRow[];

export const SOURCE_FOOTWEAR_SIZES = [
    {
        brand: 'vans',
        audience: 'kids',
        sizeSystem: 'eu',
        size: '25',
        aliases: ['25', 'eu 25'],
        footLengthMm: 145,
    },
    {
        brand: 'adidas',
        audience: 'kids',
        sizeSystem: 'eu',
        size: '25',
        aliases: ['25', 'eu 25'],
        footLengthMm: 145,
    },
    {
        brand: 'new-balance',
        audience: 'kids',
        sizeSystem: 'eu',
        size: '25',
        aliases: ['25', 'eu 25'],
        footLengthMm: 145,
    },
] as const satisfies readonly SourceFootwearSizeRow[];
